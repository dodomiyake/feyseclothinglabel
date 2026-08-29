"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, FileText, Upload, X } from "lucide-react";
import { submitEnquiryAction, type EnquiryActionState } from "@/lib/actions/enquiries";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { LABEL_TYPE_META, FOLD_TYPE_META, MEASUREMENT_UNIT_META } from "@/lib/workflow";
import type { LabelType, FoldType, MeasurementUnit } from "@/lib/types";

const STEPS = ["Your details", "Label specification", "Artwork & delivery", "Review"];
const NIGERIAN_STATES = [
  "Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano", "Ogun", "Kaduna", "Delta", "Enugu", "Edo", "Anambra", "Other",
];

// Which step each server-validated field lives on, so a validation error
// can send the user back to the step where the problem actually is.
const FIELD_STEP: Record<string, number> = {
  full_name: 0,
  email: 0,
  whatsapp_number: 0,
  delivery_phone: 0,
  quantity: 1,
  delivery_address: 2,
  delivery_city: 2,
  delivery_state: 2,
};

const initialState: EnquiryActionState = {};

export function EnquiryForm({
  defaultValues,
  prefill,
  draftId,
}: {
  defaultValues?: Partial<Record<string, string>>;
  prefill?: { label_type?: string; help?: boolean };
  draftId?: string;
}) {
  const [state, formAction, pending] = useActionState(submitEnquiryAction, initialState);
  const [step, setStep] = useState(0);
  const [needsHelp, setNeedsHelp] = useState(prefill?.help ?? false);
  const [labelType, setLabelType] = useState(prefill?.label_type ?? defaultValues?.label_type ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [previewUrls]);
  const [values, setValues] = useState({
    full_name: defaultValues?.full_name ?? "",
    business_name: defaultValues?.business_name ?? "",
    email: defaultValues?.email ?? "",
    whatsapp_number: defaultValues?.whatsapp_number ?? "",
    delivery_phone: defaultValues?.delivery_phone ?? "",
    material: defaultValues?.material ?? "",
    width: defaultValues?.width ?? "",
    height: defaultValues?.height ?? "",
    quantity: defaultValues?.quantity ?? "",
    background_colour: defaultValues?.background_colour ?? "",
    text_colour: defaultValues?.text_colour ?? "",
    fold_type: defaultValues?.fold_type ?? "",
    additional_instructions: defaultValues?.additional_instructions ?? "",
    delivery_address: defaultValues?.delivery_address ?? "",
    delivery_city: defaultValues?.delivery_city ?? "",
    delivery_state: defaultValues?.delivery_state ?? "",
    required_date: defaultValues?.required_date ?? "",
  });

  function set<K extends keyof typeof values>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  const canGoNext = useMemo(() => {
    if (step === 0) return values.full_name.trim().length > 1 && values.whatsapp_number.trim().length > 5 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
    if (step === 1) return needsHelp || Number(values.quantity) > 0;
    if (step === 2) return values.delivery_address.trim().length > 4 && values.delivery_city.trim() && values.delivery_state.trim();
    return true;
  }, [step, values, needsHelp]);

  // If the server rejects the submission, jump back to whichever step the
  // invalid field actually lives on — otherwise the error can land on a
  // step the user has already moved past and never becomes visible.
  const [lastFieldErrors, setLastFieldErrors] = useState(state.fieldErrors);
  if (state.fieldErrors !== lastFieldErrors) {
    setLastFieldErrors(state.fieldErrors);
    const steps = Object.keys(state.fieldErrors ?? {}).map((f) => FIELD_STEP[f] ?? 0);
    if (steps.length) setStep(Math.min(...steps));
  }

  return (
    <div>
      <ol className="mb-8 grid grid-cols-4 gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full font-medium ${
                i < step ? "bg-sage-600 text-cream-50" : i === step ? "bg-gold-500 text-ink-950" : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={i === step ? "text-ink-900" : "text-neutral-500"}>{label}</span>
          </li>
        ))}
      </ol>

      <form action={formAction} noValidate className="space-y-6">
        <input type="hidden" name="needs_help_choosing" value={needsHelp ? "on" : ""} />
        {draftId && <input type="hidden" name="draft_id" value={draftId} />}

        {/* Step 0 — Your details */}
        <div className={step === 0 ? "space-y-4" : "hidden"}>
          <Field label="Your name or business name" required error={state.fieldErrors?.full_name}>
            <Input name="full_name" required value={values.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Amaka Obiora" />
          </Field>
          <Field label="Business / brand name" hint="Optional">
            <Input name="business_name" value={values.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Amaka Studio" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email address" required error={state.fieldErrors?.email}>
              <Input type="email" name="email" required value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="you@brand.com" />
            </Field>
            <Field label="WhatsApp number" required error={state.fieldErrors?.whatsapp_number}>
              <Input name="whatsapp_number" required value={values.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="2348012345678" />
            </Field>
          </div>
          <Field label="Delivery phone number" required error={state.fieldErrors?.delivery_phone} hint="If different from WhatsApp">
            <Input name="delivery_phone" required value={values.delivery_phone} onChange={(e) => set("delivery_phone", e.target.value)} placeholder="2348012345678" />
          </Field>
        </div>

        {/* Step 1 — Label specification */}
        <div className={step === 1 ? "space-y-4" : "hidden"}>
          <div className="rounded-xl border border-gold-500/30 bg-gold-400/10 p-4">
            <Checkbox
              label="I need help choosing — I'm not sure which label type or specification is right for me."
              checked={needsHelp}
              onChange={(e) => setNeedsHelp(e.target.checked)}
            />
          </div>

          <Field label="Label type" required={!needsHelp}>
            <Select name="label_type" value={labelType} onChange={(e) => setLabelType(e.target.value)} disabled={needsHelp}>
              <option value="">Select a label type…</option>
              {(Object.entries(LABEL_TYPE_META) as [LabelType, { label: string }][]).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </Select>
          </Field>

          {!needsHelp && (
            <>
              <Field label="Material" hint="e.g. satin, cotton twill, leather">
                <Input name="material" value={values.material} onChange={(e) => set("material", e.target.value)} placeholder="Damask woven, satin finish" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Width">
                  <Input type="number" step="0.1" name="width" value={values.width} onChange={(e) => set("width", e.target.value)} placeholder="6" />
                </Field>
                <Field label="Height">
                  <Input type="number" step="0.1" name="height" value={values.height} onChange={(e) => set("height", e.target.value)} placeholder="2.5" />
                </Field>
                <Field label="Unit">
                  <Select name="measurement_unit" defaultValue="cm">
                    {(Object.entries(MEASUREMENT_UNIT_META) as [MeasurementUnit, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Background colour">
                  <Input name="background_colour" value={values.background_colour} onChange={(e) => set("background_colour", e.target.value)} placeholder="Deep brown" />
                </Field>
                <Field label="Text / logo colour">
                  <Input name="text_colour" value={values.text_colour} onChange={(e) => set("text_colour", e.target.value)} placeholder="Muted gold" />
                </Field>
              </div>
              <Field label="Fold / finishing type">
                <Select name="fold_type" value={values.fold_type} onChange={(e) => set("fold_type", e.target.value)}>
                  <option value="">Select…</option>
                  {(Object.entries(FOLD_TYPE_META) as [FoldType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
            </>
          )}

          <Field label="Quantity required" required={!needsHelp} error={state.fieldErrors?.quantity} hint={needsHelp ? "Optional — we'll help you decide" : undefined}>
            <Input type="number" name="quantity" min={1} value={values.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="500" />
          </Field>
        </div>

        {/* Step 2 — Artwork & delivery */}
        <div className={step === 2 ? "space-y-4" : "hidden"}>
          <Field label="Logo, artwork or reference images" hint="PNG, JPG, SVG or PDF — up to 6 files, 15MB each">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 px-4 py-8 text-center hover:border-gold-500">
              <Upload className="h-6 w-6 text-neutral-400" />
              <span className="text-sm text-neutral-600">Click to upload or drag files here</span>
              <input
                type="file"
                name="files"
                multiple
                accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {files.map((f, i) => (
                  <li key={i} className="group relative">
                    <a
                      href={previewUrls[i]}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`View ${f.name}`}
                      className="flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 hover:border-gold-500"
                    >
                      {f.type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrls[i]} alt={f.name} className="h-full w-full object-cover" />
                      ) : (
                        <>
                          <FileText className="h-6 w-6 text-neutral-400" />
                          <span className="px-1 text-center text-[10px] text-neutral-500">PDF</span>
                        </>
                      )}
                    </a>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      title={`Remove ${f.name}`}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-cream-50 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="mt-1 truncate text-[11px] text-neutral-500">{f.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          <Field label="Additional production instructions" hint="Optional">
            <Textarea
              name="additional_instructions"
              value={values.additional_instructions}
              onChange={(e) => set("additional_instructions", e.target.value)}
              placeholder="Any details about thread colour, packaging, or previous orders to match."
            />
          </Field>

          <Field label="Delivery address" required error={state.fieldErrors?.delivery_address}>
            <Input name="delivery_address" required value={values.delivery_address} onChange={(e) => set("delivery_address", e.target.value)} placeholder="14 Adeola Odeku Street, Victoria Island" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" required error={state.fieldErrors?.delivery_city}>
              <Input name="delivery_city" required value={values.delivery_city} onChange={(e) => set("delivery_city", e.target.value)} placeholder="Lagos" />
            </Field>
            <Field label="State" required error={state.fieldErrors?.delivery_state}>
              <Select name="delivery_state" required value={values.delivery_state} onChange={(e) => set("delivery_state", e.target.value)}>
                <option value="">Select…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Required by date" hint="Optional">
            <Input type="date" name="required_date" value={values.required_date} onChange={(e) => set("required_date", e.target.value)} />
          </Field>
        </div>

        {/* Step 3 — Review */}
        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <div className="rounded-xl border border-ink-900/8 bg-cream-200/50 p-5 text-sm">
            <p className="font-serif text-lg text-ink-950">Ready to submit</p>
            <dl className="mt-3 space-y-1.5 text-ink-800">
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">Name</dt><dd>{values.full_name || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">Label type</dt><dd>{needsHelp ? "Need help choosing" : (labelType ? LABEL_TYPE_META[labelType as LabelType]?.label : "—")}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">Quantity</dt><dd>{values.quantity || "To be discussed"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">Delivery to</dt><dd className="text-right">{[values.delivery_city, values.delivery_state].filter(Boolean).join(", ") || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">Reference files</dt><dd>{files.length} attached</dd></div>
            </dl>
            <p className="mt-4 text-xs text-neutral-500">
              Submitting this enquiry does not place an order or charge you. Our team will review it and send a
              quotation for your approval.
            </p>
          </div>
        </div>

        {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}

        <div className="flex items-center justify-between border-t border-ink-900/8 pt-5">
          <Button type="button" variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} className={step === 0 ? "invisible" : ""}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button type="submit" name="intent" value="draft" formNoValidate variant="outline" size="sm" disabled={pending}>
              Save draft
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" size="sm" disabled={!canGoNext} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" name="intent" value="submit" size="sm" disabled={pending}>
                {pending ? "Submitting…" : "Submit enquiry"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
