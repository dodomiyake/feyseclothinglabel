import type { WorkflowStatus, LabelType, FoldType, MeasurementUnit } from "@/lib/types";

interface StatusMeta {
  label: string;
  description: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
  stage: "enquiry" | "quotation" | "payment" | "production" | "delivery" | "closed";
}

export const STATUS_META: Record<WorkflowStatus, StatusMeta> = {
  draft: { label: "Draft", description: "Enquiry saved but not yet submitted.", tone: "neutral", stage: "enquiry" },
  submitted: { label: "Submitted", description: "Enquiry received and waiting for review.", tone: "info", stage: "enquiry" },
  under_review: { label: "Details under review", description: "Our team is reviewing your requirements.", tone: "info", stage: "enquiry" },
  changes_requested: { label: "Changes requested", description: "We need more information or corrections from you.", tone: "warning", stage: "enquiry" },
  quotation_sent: { label: "Quotation sent", description: "A quotation has been sent for your review.", tone: "info", stage: "quotation" },
  quotation_accepted: { label: "Quotation accepted", description: "You accepted the quotation. An invoice is being prepared.", tone: "success", stage: "quotation" },
  quotation_declined: { label: "Quotation declined", description: "The quotation was declined.", tone: "danger", stage: "quotation" },
  invoice_issued: { label: "Invoice issued", description: "Your invoice is ready.", tone: "info", stage: "payment" },
  awaiting_payment: { label: "Awaiting payment", description: "We're waiting for your bank transfer.", tone: "warning", stage: "payment" },
  payment_evidence_submitted: { label: "Payment evidence submitted", description: "Your proof of payment was received.", tone: "info", stage: "payment" },
  payment_under_review: { label: "Payment under review", description: "We're verifying your payment.", tone: "info", stage: "payment" },
  payment_confirmed: { label: "Payment confirmed", description: "Payment verified. Production will begin shortly.", tone: "success", stage: "payment" },
  payment_rejected: { label: "Payment rejected", description: "We couldn't verify your payment evidence.", tone: "danger", stage: "payment" },
  production_authorised: { label: "Production authorised", description: "Your order has been approved for production.", tone: "success", stage: "production" },
  in_production: { label: "In production", description: "Your labels are being made.", tone: "info", stage: "production" },
  quality_check: { label: "Quality check", description: "Your labels are being inspected for quality.", tone: "info", stage: "production" },
  ready_for_dispatch: { label: "Ready for dispatch", description: "Production is complete and passed quality control.", tone: "success", stage: "production" },
  out_for_delivery: { label: "Out for delivery", description: "Your order is with the dispatch rider.", tone: "info", stage: "delivery" },
  delivered: { label: "Delivered", description: "Your order has been delivered.", tone: "success", stage: "delivery" },
  completed: { label: "Order completed", description: "This order is complete.", tone: "success", stage: "closed" },
  on_hold: { label: "On hold", description: "This order is temporarily on hold.", tone: "warning", stage: "closed" },
  cancelled: { label: "Cancelled", description: "This order was cancelled.", tone: "danger", stage: "closed" },
  refund_pending: { label: "Refund pending", description: "A refund is being processed.", tone: "warning", stage: "closed" },
  refunded: { label: "Refunded", description: "This order was refunded.", tone: "neutral", stage: "closed" },
  delivery_unsuccessful: { label: "Delivery unsuccessful", description: "Delivery could not be completed.", tone: "danger", stage: "delivery" },
};

export const CUSTOMER_TIMELINE: WorkflowStatus[] = [
  "submitted",
  "under_review",
  "quotation_sent",
  "quotation_accepted",
  "invoice_issued",
  "awaiting_payment",
  "payment_confirmed",
  "production_authorised",
  "in_production",
  "quality_check",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
  "completed",
];

export const TONE_CLASSES: Record<StatusMeta["tone"], string> = {
  neutral: "bg-neutral-200 text-neutral-700",
  info: "bg-gold-400/25 text-gold-700",
  warning: "bg-terracotta-400/20 text-terracotta-700",
  success: "bg-sage-500/15 text-sage-600",
  danger: "bg-terracotta-600/15 text-terracotta-700",
};

export const LABEL_TYPE_META: Record<LabelType, { label: string; description: string }> = {
  woven_label: { label: "Woven Label", description: "Damask-woven label, soft or satin finish — durable and premium." },
  printed_fabric_label: { label: "Printed Satin Label", description: "Full-colour heat-transfer or screen print on satin ribbon." },
  satin_label: { label: "Centre-Fold Satin Label", description: "Classic centre-folded satin label, one or two colours." },
  leather_patch: { label: "Genuine Leather Patch", description: "Debossed or laser-engraved leather patch for denim and outerwear." },
  faux_leather_patch: { label: "Faux Leather Patch", description: "Debossed PU leather patch — budget-friendly alternative." },
  care_label: { label: "Care Label", description: "Wash-care and composition label, printed satin or cotton twill." },
  size_label: { label: "Size Label", description: "Small woven size tab sewn into the side seam." },
  hang_tag: { label: "Hang Tag", description: "Kraft or card swing tag with logo print and string or pin." },
  main_brand_label: { label: "Main Brand Label", description: "The primary back-neck brand label for a garment." },
  other: { label: "Other / Custom", description: "Something else — describe it and we'll advise." },
};

export const FOLD_TYPE_META: Record<FoldType, string> = {
  straight_cut: "Straight cut (no fold)",
  center_fold: "Centre fold",
  end_fold: "End fold",
  loop_fold: "Loop fold",
  manhattan_fold: "Manhattan fold",
  no_fold: "No fold",
};

export const MEASUREMENT_UNIT_META: Record<MeasurementUnit, string> = {
  cm: "Centimetres (cm)",
  inch: "Inches (in)",
  mm: "Millimetres (mm)",
};

export function isTerminalStatus(status: WorkflowStatus) {
  return ["completed", "cancelled", "refunded", "quotation_declined"].includes(status);
}
