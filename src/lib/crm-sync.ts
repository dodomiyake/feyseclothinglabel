import "server-only";

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncCustomerAndEnquiry } from "@/lib/hubspot";
import type { Customer, Enquiry } from "@/lib/types";

type CrmEventType = "enquiry_upsert" | "enquiry_stage_update";

export async function enqueueCrmSync(params: {
  eventType: CrmEventType;
  customerId: string;
  enquiryId: string;
}) {
  if (!process.env.HUBSPOT_SERVICE_KEY) {
    console.warn("[crm-sync] HUBSPOT_SERVICE_KEY not configured — skipped enqueue");
    return null;
  }

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("crm_sync_jobs")
    .insert({
      event_type: params.eventType,
      customer_id: params.customerId,
      enquiry_id: params.enquiryId,
    })
    .select("id")
    .single();

  if (error || !job) {
    console.error("[crm-sync] failed to enqueue:", error);
    return null;
  }

  after(async () => {
    await processCrmSyncQueue(job.id);
  });

  return job.id;
}

async function processCrmSyncQueue(priorityJobId: string) {
  await processCrmSyncJob(priorityJobId);

  // Opportunistically retry older due jobs whenever fresh CRM work arrives.
  // The rows remain durable if there is no traffic; a scheduled drain can be
  // added later without changing the outbox or processor contract.
  const admin = createAdminClient();
  const staleBefore = new Date(Date.now() - 15 * 60_000).toISOString();
  await admin
    .from("crm_sync_jobs")
    .update({ status: "failed", locked_at: null, last_error: "Processing lease expired; retrying." })
    .eq("status", "processing")
    .lt("locked_at", staleBefore);

  const { data: ready } = await admin
    .from("crm_sync_jobs")
    .select("id")
    .in("status", ["pending", "failed"])
    .lte("available_at", new Date().toISOString())
    .neq("id", priorityJobId)
    .order("created_at", { ascending: true })
    .limit(4);

  for (const job of ready ?? []) await processCrmSyncJob(job.id);
}

export async function processCrmSyncJob(jobId: string) {
  const admin = createAdminClient();
  const { data: claimed, error: claimError } = await admin
    .from("crm_sync_jobs")
    .update({ status: "processing", locked_at: new Date().toISOString() })
    .eq("id", jobId)
    .in("status", ["pending", "failed"])
    .select("*")
    .maybeSingle();

  if (claimError) {
    console.error("[crm-sync] failed to claim job:", claimError);
    return;
  }
  if (!claimed) return;

  try {
    const [
      { data: customer, error: customerError },
      { data: enquiry, error: enquiryError },
      { data: quotation },
    ] = await Promise.all([
      admin.from("customers").select("*").eq("id", claimed.customer_id).single(),
      admin.from("enquiries").select("*").eq("id", claimed.enquiry_id).single(),
      admin
        .from("quotations")
        .select("total")
        .eq("enquiry_id", claimed.enquiry_id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (customerError || enquiryError || !customer || !enquiry) {
      throw new Error(customerError?.message || enquiryError?.message || "CRM sync source record not found");
    }

    const ids = await syncCustomerAndEnquiry({
      customer: customer as Customer,
      enquiry: enquiry as Enquiry,
      hubspotContactId: customer.hubspot_contact_id,
      hubspotDealId: enquiry.hubspot_deal_id,
      quotationAmount: quotation?.total ?? null,
    });

    const { error: contactLinkError } = await admin
      .from("customers")
      .update({ hubspot_contact_id: ids.contactId })
      .eq("id", customer.id);
    if (contactLinkError) throw new Error(`Could not save HubSpot contact ID: ${contactLinkError.message}`);

    const { error: dealLinkError } = await admin
      .from("enquiries")
      .update({ hubspot_deal_id: ids.dealId })
      .eq("id", enquiry.id);
    if (dealLinkError) throw new Error(`Could not save HubSpot deal ID: ${dealLinkError.message}`);

    const { error: completionError } = await admin
      .from("crm_sync_jobs")
      .update({
        status: "completed",
        attempts: claimed.attempts + 1,
        last_error: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    if (completionError) throw new Error(`Could not complete CRM sync job: ${completionError.message}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CRM sync error";
    const attempts = claimed.attempts + 1;
    const retryDelayMinutes = Math.min(60, 2 ** attempts);
    await admin
      .from("crm_sync_jobs")
      .update({
        status: "failed",
        attempts,
        last_error: message.slice(0, 2_000),
        available_at: new Date(Date.now() + retryDelayMinutes * 60_000).toISOString(),
        locked_at: null,
      })
      .eq("id", jobId);
    console.error(`[crm-sync] job ${jobId} failed:`, message);
  }
}
