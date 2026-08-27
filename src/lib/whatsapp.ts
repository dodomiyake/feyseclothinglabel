/** Builds a wa.me deep link with a pre-filled, URL-encoded message. */
export function buildWhatsAppLink(phoneNumber: string, message: string) {
  const digits = phoneNumber.replace(/[^\d]/g, "");
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${digits}?${params.toString()}`;
}

export function businessWhatsAppLink(supportNumber: string, message: string) {
  return buildWhatsAppLink(supportNumber, message);
}

export function enquiryWhatsAppMessage(enquiryNumber: string, labelName?: string) {
  return `Hi Feyse Clothing Labels, I'd like to follow up on my enquiry ${enquiryNumber}${
    labelName ? ` for ${labelName}` : ""
  }.`;
}

export function orderWhatsAppMessage(orderNumber: string) {
  return `Hi Feyse Clothing Labels, I'd like an update on my order ${orderNumber}.`;
}

export function generalEnquiryWhatsAppMessage() {
  return `Hi Feyse Clothing Labels, I'd like to ask about custom clothing labels for my brand.`;
}

/** Fills a {{placeholder}} message template with the given values. */
export function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => values[key] ?? "");
}
