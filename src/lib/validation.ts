import { z } from "zod";

export const enquirySchema = z
  .object({
    full_name: z.string().min(2, "Please enter your name or business name."),
    email: z.email("Enter a valid email address."),
    whatsapp_number: z.string().min(8, "Enter a valid WhatsApp number."),
    delivery_phone: z.string().min(8, "Enter a valid delivery phone number."),
    business_name: z.string().optional(),

    needs_help_choosing: z.coerce.boolean().optional().default(false),
    label_type: z.string().optional(),
    material: z.string().optional(),
    width: z.coerce.number().positive().optional(),
    height: z.coerce.number().positive().optional(),
    measurement_unit: z.enum(["cm", "inch", "mm"]).default("cm"),
    quantity: z.coerce.number().int().positive().optional(),
    background_colour: z.string().optional(),
    text_colour: z.string().optional(),
    fold_type: z.string().optional(),
    additional_instructions: z.string().optional(),

    delivery_address: z.string().min(5, "Enter the delivery address."),
    delivery_city: z.string().min(2, "Enter the delivery city."),
    delivery_state: z.string().min(2, "Enter the delivery state."),
    required_date: z.string().optional(),
  })
  .refine((data) => data.needs_help_choosing || !!data.quantity, {
    message: "Enter the quantity you need.",
    path: ["quantity"],
  });

export type EnquiryFormValues = z.infer<typeof enquirySchema>;

export const paymentEvidenceSchema = z.object({
  amount_paid: z.coerce.number().positive("Enter the amount you transferred."),
  payment_date: z.string().min(1, "Select the payment date."),
  sender_account_name: z.string().min(2, "Enter the name on the sending account."),
  sender_bank: z.string().optional(),
});

export const quotationSchema = z.object({
  unit_price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive(),
  delivery_fee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  valid_until: z.string().min(1),
  terms: z.string().optional(),
});

export const dispatchSchema = z.object({
  rider_name: z.string().min(2),
  rider_phone: z.string().min(8),
  dispatch_company: z.string().optional(),
  collection_at: z.string().min(1),
  dispatch_fee: z.coerce.number().min(0).default(0),
  tracking_reference: z.string().optional(),
});
