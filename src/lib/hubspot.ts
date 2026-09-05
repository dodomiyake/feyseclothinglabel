import "server-only";

import type { Customer, Enquiry, WorkflowStatus } from "@/lib/types";

const HUBSPOT_BASE_URL = "https://api.hubapi.com";
const API_VERSION = "2026-03";

type HubSpotProperties = Record<string, string>;

interface HubSpotRecord {
  id: string;
  properties: HubSpotProperties;
}

interface HubSpotList<T> {
  results: T[];
}

interface HubSpotProperty {
  name: string;
  label: string;
  type?: string;
  options?: Array<{ label: string; value: string }>;
}

interface HubSpotStage {
  id: string;
  label: string;
}

interface HubSpotPipeline {
  id: string;
  label: string;
  stages?: HubSpotStage[];
}

class HubSpotRequestError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HubSpotRequestError";
  }
}

const CONTACT_PROPERTY_LABELS = {
  whatsapp: "WhatsApp number",
  deliveryPhone: "Delivery phone number",
  customerSource: "Customer source",
  country: "Country",
  businessName: "Business or brand name",
} as const;

const DEAL_PROPERTY_LABELS = {
  enquiryNumber: "Enquiry number",
  labelType: "Label type",
  dimensions: "Dimensions",
  quantity: "Quantity",
  quotationAmount: "Quotation amount",
  requiredDate: "Required date",
  paymentStatus: "Payment status",
  productionStatus: "Production status",
  dispatchStatus: "Dispatch status",
  expectedDeliveryDate: "Expected delivery date",
} as const;

const DEAL_STAGE_LABELS: Partial<Record<WorkflowStatus, string>> = {
  submitted: "Enquiry Submitted",
  under_review: "Under Review",
  changes_requested: "Under Review",
  quotation_sent: "Quotation Sent",
  quotation_accepted: "Quotation Accepted",
  invoice_issued: "Awaiting Payment",
  awaiting_payment: "Awaiting Payment",
  payment_evidence_submitted: "Awaiting Payment",
  payment_under_review: "Awaiting Payment",
  payment_rejected: "Awaiting Payment",
  payment_confirmed: "Payment Confirmed — Closed Won",
  production_authorised: "Payment Confirmed — Closed Won",
  in_production: "Payment Confirmed — Closed Won",
  quality_check: "Payment Confirmed — Closed Won",
  ready_for_dispatch: "Payment Confirmed — Closed Won",
  out_for_delivery: "Payment Confirmed — Closed Won",
  delivered: "Payment Confirmed — Closed Won",
  completed: "Payment Confirmed — Closed Won",
  quotation_declined: "Cancelled or Declined — Closed Lost",
  cancelled: "Cancelled or Declined — Closed Lost",
  refund_pending: "Cancelled or Declined — Closed Lost",
  refunded: "Cancelled or Declined — Closed Lost",
};

function serviceKey() {
  const key = process.env.HUBSPOT_SERVICE_KEY;
  if (!key) throw new Error("HUBSPOT_SERVICE_KEY is not configured");
  return key;
}

async function hubspotRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serviceKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 1_000);
    throw new HubSpotRequestError(
      response.status,
      `HubSpot ${response.status} ${init.method ?? "GET"} ${path}: ${body || response.statusText}`
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function splitName(fullName: string) {
  const [firstname, ...rest] = fullName.trim().split(/\s+/);
  return { firstname: firstname || fullName, lastname: rest.join(" ") };
}

function normalizeLabel(value: string) {
  return value.trim().toLocaleLowerCase("en-GB");
}

async function propertyNames(objectType: "contacts" | "deals") {
  const response = await hubspotRequest<HubSpotList<HubSpotProperty>>(`/crm/properties/${API_VERSION}/${objectType}`);
  return new Map(response.results.map((property) => [normalizeLabel(property.label), property]));
}

function setCustomProperty(
  target: HubSpotProperties,
  available: Map<string, HubSpotProperty>,
  label: string,
  value: string | number | null | undefined
) {
  const property = available.get(normalizeLabel(label));
  if (!property || value === null || value === undefined || value === "") return;

  let serialized = String(value);
  if (property.type === "enumeration" && property.options?.length) {
    const option = property.options.find(
      (candidate) => normalizeLabel(candidate.label) === normalizeLabel(serialized) || candidate.value === serialized
    );
    // Sending an unknown option causes HubSpot to reject the entire record.
    if (!option) return;
    serialized = option.value;
  }
  target[property.name] = serialized;
}

async function findRecord(objectType: "contacts" | "deals", propertyName: string, value: string) {
  const response = await hubspotRequest<HubSpotList<HubSpotRecord>>(`/crm/objects/${API_VERSION}/${objectType}/search`, {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName, operator: "EQ", value }] }],
      limit: 1,
    }),
  });
  return response.results[0] ?? null;
}

async function upsertRecord(objectType: "contacts" | "deals", existingId: string | null, properties: HubSpotProperties) {
  if (existingId) {
    try {
      return await hubspotRequest<HubSpotRecord>(`/crm/objects/${API_VERSION}/${objectType}/${existingId}`, {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      });
    } catch (error) {
      // HubSpot records can be removed independently of the app. Recover from a
      // stale saved ID by allowing the caller to create a replacement record.
      if (!(error instanceof HubSpotRequestError) || error.status !== 404) throw error;
    }
  }
  return hubspotRequest<HubSpotRecord>(`/crm/objects/${API_VERSION}/${objectType}`, {
    method: "POST",
    body: JSON.stringify({ properties }),
  });
}

async function resolveDealPipeline(status: WorkflowStatus) {
  const desiredStage = DEAL_STAGE_LABELS[status] ?? "Enquiry Submitted";
  const response = await hubspotRequest<HubSpotList<HubSpotPipeline>>(`/crm/pipelines/${API_VERSION}/deals`);

  for (const pipeline of response.results) {
    const stages =
      pipeline.stages ??
      (await hubspotRequest<HubSpotList<HubSpotStage>>(`/crm/pipelines/${API_VERSION}/deals/${pipeline.id}/stages`)).results;
    const stage = stages.find((candidate) => normalizeLabel(candidate.label) === normalizeLabel(desiredStage));
    if (stage) return { pipelineId: pipeline.id, stageId: stage.id };
  }

  throw new Error(`HubSpot deal stage not found: ${desiredStage}`);
}

async function associateContactAndDeal(contactId: string, dealId: string) {
  await hubspotRequest<void>(
    `/crm/objects/${API_VERSION}/contact/${contactId}/associations/default/deal/${dealId}`,
    { method: "PUT" }
  );
}

export async function syncCustomerAndEnquiry(params: {
  customer: Customer;
  enquiry: Enquiry;
  hubspotContactId: string | null;
  hubspotDealId: string | null;
  quotationAmount: number | null;
}) {
  const [contactSchema, dealSchema, pipeline] = await Promise.all([
    propertyNames("contacts"),
    propertyNames("deals"),
    resolveDealPipeline(params.enquiry.status),
  ]);

  const { firstname, lastname } = splitName(params.customer.full_name);
  const contactProperties: HubSpotProperties = { firstname, lastname };
  if (params.customer.email) contactProperties.email = params.customer.email;
  if (params.customer.whatsapp_number) contactProperties.phone = params.customer.whatsapp_number;
  if (params.customer.business_name) contactProperties.company = params.customer.business_name;
  setCustomProperty(contactProperties, contactSchema, CONTACT_PROPERTY_LABELS.whatsapp, params.customer.whatsapp_number);
  setCustomProperty(contactProperties, contactSchema, CONTACT_PROPERTY_LABELS.deliveryPhone, params.customer.delivery_phone);
  setCustomProperty(contactProperties, contactSchema, CONTACT_PROPERTY_LABELS.customerSource, params.customer.source);
  setCustomProperty(contactProperties, contactSchema, CONTACT_PROPERTY_LABELS.businessName, params.customer.business_name);

  let existingContactId = params.hubspotContactId;
  if (!existingContactId && params.customer.email) {
    existingContactId = (await findRecord("contacts", "email", params.customer.email))?.id ?? null;
  }
  if (!existingContactId) {
    const whatsappProperty = contactSchema.get(normalizeLabel(CONTACT_PROPERTY_LABELS.whatsapp))?.name;
    if (whatsappProperty) {
      existingContactId = (await findRecord("contacts", whatsappProperty, params.customer.whatsapp_number))?.id ?? null;
    }
  }
  const contact = await upsertRecord("contacts", existingContactId, contactProperties);

  const dimensions =
    params.enquiry.width && params.enquiry.height
      ? `${params.enquiry.width} × ${params.enquiry.height} ${params.enquiry.measurement_unit}`
      : "";
  const dealProperties: HubSpotProperties = {
    dealname: `${params.enquiry.enquiry_number} — ${params.customer.business_name || params.customer.full_name}`,
    pipeline: pipeline.pipelineId,
    dealstage: pipeline.stageId,
  };
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.enquiryNumber, params.enquiry.enquiry_number);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.labelType, params.enquiry.label_type);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.dimensions, dimensions);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.quantity, params.enquiry.quantity);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.quotationAmount, params.quotationAmount);
  if (params.quotationAmount !== null) dealProperties.amount = String(params.quotationAmount);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.requiredDate, params.enquiry.required_date);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.paymentStatus, params.enquiry.status);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.productionStatus, params.enquiry.status);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.dispatchStatus, params.enquiry.status);
  setCustomProperty(dealProperties, dealSchema, DEAL_PROPERTY_LABELS.expectedDeliveryDate, params.enquiry.required_date);

  let existingDealId = params.hubspotDealId;
  if (!existingDealId) {
    const enquiryNumberProperty = dealSchema.get(normalizeLabel(DEAL_PROPERTY_LABELS.enquiryNumber))?.name;
    existingDealId = enquiryNumberProperty
      ? (await findRecord("deals", enquiryNumberProperty, params.enquiry.enquiry_number))?.id ?? null
      : (await findRecord("deals", "dealname", dealProperties.dealname))?.id ?? null;
  }
  const deal = await upsertRecord("deals", existingDealId, dealProperties);
  await associateContactAndDeal(contact.id, deal.id);

  return { contactId: contact.id, dealId: deal.id };
}
