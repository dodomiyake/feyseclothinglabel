import { FOLD_TYPE_META, LABEL_TYPE_META } from "@/lib/workflow";
import type { Enquiry } from "@/lib/types";

export function describeSpec(enquiry: Pick<Enquiry, "label_type" | "width" | "height" | "measurement_unit" | "fold_type" | "background_colour" | "text_colour" | "material">) {
  const parts: string[] = [];
  parts.push(enquiry.label_type ? LABEL_TYPE_META[enquiry.label_type].label : "Label type to be confirmed");
  if (enquiry.width && enquiry.height) {
    parts.push(`${enquiry.width} x ${enquiry.height} ${enquiry.measurement_unit}`);
  }
  if (enquiry.material) parts.push(enquiry.material);
  if (enquiry.fold_type) parts.push(FOLD_TYPE_META[enquiry.fold_type]);
  if (enquiry.background_colour) parts.push(`Background: ${enquiry.background_colour}`);
  if (enquiry.text_colour) parts.push(`Text/logo: ${enquiry.text_colour}`);
  return parts.join(" · ");
}
