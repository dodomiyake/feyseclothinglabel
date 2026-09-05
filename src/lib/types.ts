// Hand-maintained domain types mirroring the Supabase schema
// (supabase/migrations/0001_init.sql). Kept lightweight rather than
// generating a full Database type, since query shapes are select-specific.

export type UserRole = "customer" | "admin" | "production";

export type WorkflowStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "quotation_sent"
  | "quotation_accepted"
  | "quotation_declined"
  | "invoice_issued"
  | "awaiting_payment"
  | "payment_evidence_submitted"
  | "payment_under_review"
  | "payment_confirmed"
  | "production_authorised"
  | "in_production"
  | "quality_check"
  | "ready_for_dispatch"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "payment_rejected"
  | "on_hold"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "delivery_unsuccessful";

export type LabelType =
  | "woven_label"
  | "printed_fabric_label"
  | "satin_label"
  | "leather_patch"
  | "faux_leather_patch"
  | "care_label"
  | "size_label"
  | "hang_tag"
  | "main_brand_label"
  | "other";

export type MeasurementUnit = "cm" | "inch" | "mm";

export type FoldType =
  | "straight_cut"
  | "center_fold"
  | "end_fold"
  | "loop_fold"
  | "manhattan_fold"
  | "no_fold";

export type QuotationStatus = "draft" | "sent" | "accepted" | "declined" | "expired" | "superseded";

export type InvoiceStatus =
  | "issued"
  | "awaiting_payment"
  | "payment_evidence_submitted"
  | "payment_under_review"
  | "payment_confirmed"
  | "payment_rejected"
  | "cancelled";

export type PaymentStatus = "submitted" | "under_review" | "confirmed" | "rejected";

export type ProductionStage = "not_started" | "in_production" | "quality_check" | "ready_for_dispatch" | "completed";

export type QcResult = "pending" | "pass" | "fail";

export type DispatchStatus = "pending" | "collected" | "out_for_delivery" | "delivered" | "delivery_unsuccessful";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  whatsapp_number: string | null;
  delivery_phone: string | null;
  business_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string | null;
  full_name: string;
  business_name: string | null;
  email: string | null;
  whatsapp_number: string;
  delivery_phone: string | null;
  source: string;
  notes: string | null;
  hubspot_contact_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enquiry {
  id: string;
  enquiry_number: string;
  customer_id: string;
  status: WorkflowStatus;
  label_type: LabelType | null;
  material: string | null;
  width: number | null;
  height: number | null;
  measurement_unit: MeasurementUnit;
  quantity: number | null;
  background_colour: string | null;
  text_colour: string | null;
  fold_type: FoldType | null;
  needs_help_choosing: boolean;
  additional_instructions: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_phone: string | null;
  required_date: string | null;
  created_by: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  hubspot_deal_id: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface EnquiryFile {
  id: string;
  enquiry_id: string;
  file_path: string;
  file_kind: "logo" | "reference" | "final_artwork";
  original_name: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface WhatsappNote {
  id: string;
  enquiry_id: string;
  direction: "inbound" | "outbound";
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface StatusEvent {
  id: string;
  entity_type: "enquiry" | "order";
  entity_id: string;
  from_status: WorkflowStatus | null;
  to_status: WorkflowStatus;
  note: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  enquiry_id: string;
  version: number;
  status: QuotationStatus;
  spec_snapshot: Record<string, unknown>;
  unit_price: number;
  quantity: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  currency: string;
  valid_until: string;
  terms: string | null;
  customer_response_note: string | null;
  created_by: string | null;
  sent_at: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  enquiry_id: string;
  quotation_id: string;
  status: InvoiceStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  currency: string;
  bank_account_id: string | null;
  issue_date: string;
  due_date: string;
  terms: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount_paid: number;
  payment_date: string;
  sender_account_name: string;
  sender_bank: string | null;
  evidence_file_path: string;
  status: PaymentStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_by: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  enquiry_id: string;
  invoice_id: string;
  payment_id: string | null;
  status: WorkflowStatus;
  production_deadline: string | null;
  authorised_by: string | null;
  authorised_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionJob {
  id: string;
  order_id: string;
  assigned_to: string | null;
  stage: ProductionStage;
  started_at: string | null;
  completed_at: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductionNote {
  id: string;
  production_job_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface ProductionPhoto {
  id: string;
  production_job_id: string;
  file_path: string;
  caption: string | null;
  created_by: string | null;
  created_at: string;
}

export interface QcChecklist {
  id: string;
  production_job_id: string;
  correct_artwork: boolean;
  correct_spelling: boolean;
  correct_dimensions: boolean;
  correct_colours: boolean;
  correct_material: boolean;
  correct_quantity: boolean;
  acceptable_quality: boolean;
  packaging_completed: boolean;
  overall_result: QcResult;
  notes: string | null;
  checked_by: string | null;
  checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dispatch {
  id: string;
  order_id: string;
  rider_name: string | null;
  rider_phone: string | null;
  dispatch_company: string | null;
  collection_at: string | null;
  dispatch_fee: number;
  delivery_address: string;
  tracking_reference: string | null;
  status: DispatchStatus;
  proof_of_delivery_path: string | null;
  customer_confirmed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  label_type: LabelType;
  name: string;
  description: string;
  base_unit_price: number;
  currency: string;
  min_quantity: number;
  image_path: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  is_default: boolean;
  active: boolean;
  created_at: string;
}

export interface BusinessSettings {
  id: boolean;
  business_name: string;
  tagline: string;
  logo_path: string | null;
  registered_address: string;
  production_address: string;
  support_whatsapp_number: string;
  support_email: string;
  default_currency: string;
  default_quotation_validity_days: number;
  default_invoice_due_days: number;
  invoice_terms: string;
  quotation_terms: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  key: string;
  title: string;
  channel: string;
  body_template: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}
