-- Realistic sample content for Feyse Clothing Labels.
-- Customer/enquiry data uses walk-in (WhatsApp-sourced) customers with no
-- linked auth user, so this file has no dependency on auth.users and can be
-- run on any fresh database. Create your admin/production sign-in accounts
-- separately (see README) — the handle_new_user trigger will provision their
-- profiles automatically.

update business_settings set
  tagline = 'Woven, printed and leather labels for fashion brands — made in Lagos.',
  support_whatsapp_number = '2348012345678',
  support_email = 'feyseclothinglabels@gmail.com';

insert into bank_accounts (bank_name, account_name, account_number, currency, is_default, active) values
  ('Guaranty Trust Bank', 'Feyse Clothing Labels Ltd', '0123456789', 'NGN', true, true),
  ('Zenith Bank', 'Feyse Clothing Labels Ltd', '1012345678', 'NGN', false, true);

insert into products (label_type, name, description, base_unit_price, currency, min_quantity, sort_order) values
  ('woven_label', 'Woven Brand Label', 'Damask-woven label with your logo, ideal for premium ready-to-wear and denim. Soft or satin finish.', 85.00, 'NGN', 200, 1),
  ('printed_fabric_label', 'Printed Satin Label', 'Full-colour heat-transfer or screen print on satin ribbon — best for detailed logos and gradients.', 55.00, 'NGN', 200, 2),
  ('satin_label', 'Centre-Fold Satin Label', 'Classic centre-folded satin label for the back-neck, one or two colours.', 45.00, 'NGN', 300, 3),
  ('leather_patch', 'Genuine Leather Patch', 'Debossed or laser-engraved leather patch for denim, bags and outerwear.', 220.00, 'NGN', 100, 4),
  ('faux_leather_patch', 'Faux Leather Patch', 'Debossed PU leather patch — a budget-friendly alternative to genuine leather.', 140.00, 'NGN', 100, 5),
  ('care_label', 'Printed Care Label', 'Wash-care and composition label, printed satin or cotton twill.', 30.00, 'NGN', 300, 6),
  ('size_label', 'Woven Size Label', 'Small woven size tab (XS–XXL or custom sizing) sewn into the side seam.', 25.00, 'NGN', 300, 7),
  ('hang_tag', 'Kraft Card Hang Tag', 'Recycled kraft card swing tag with logo print and cotton string or safety pin.', 65.00, 'NGN', 200, 8);

insert into message_templates (key, title, channel, body_template) values
  ('enquiry_acknowledgement', 'Enquiry received', 'whatsapp',
   'Hi {{customer_name}}, thank you for contacting Feyse Clothing Labels! We''ve logged your enquiry {{enquiry_number}} for {{label_type}}. We''ll review your details and get back to you shortly. You can track everything here: {{portal_link}}'),
  ('quotation_sent', 'Quotation sent', 'whatsapp',
   'Hi {{customer_name}}, your quotation {{quotation_number}} is ready — {{quantity}} x {{label_type}} for {{total}}. View and accept it here: {{portal_link}}'),
  ('invoice_issued', 'Invoice issued', 'whatsapp',
   'Hi {{customer_name}}, invoice {{invoice_number}} for {{total}} is ready. Bank details and payment steps: {{portal_link}}'),
  ('payment_confirmed', 'Payment confirmed', 'whatsapp',
   'Hi {{customer_name}}, we''ve received and confirmed your payment for order {{order_number}}. Your labels are now queued for production 🎉'),
  ('payment_rejected', 'Payment evidence rejected', 'whatsapp',
   'Hi {{customer_name}}, we couldn''t verify the payment evidence for invoice {{invoice_number}}: {{reason}}. Please re-submit or contact us here: {{portal_link}}'),
  ('production_started', 'Production started', 'whatsapp',
   'Hi {{customer_name}}, production has started on order {{order_number}}. We''ll share progress photos as we go.'),
  ('production_completed', 'Production completed', 'whatsapp',
   'Hi {{customer_name}}, order {{order_number}} has passed quality control and is ready for dispatch.'),
  ('order_dispatched', 'Order dispatched', 'whatsapp',
   'Hi {{customer_name}}, order {{order_number}} is out for delivery with {{rider_name}} ({{rider_phone}}). Tracking ref: {{tracking_reference}}'),
  ('order_delivered', 'Order delivered', 'whatsapp',
   'Hi {{customer_name}}, order {{order_number}} has been delivered. Thank you for choosing Feyse Clothing Labels — we''d love to work with you again!');

-- ---------------------------------------------------------------------
-- Sample customers (WhatsApp-sourced, no auth account yet)
-- ---------------------------------------------------------------------
insert into customers (id, full_name, business_name, email, whatsapp_number, delivery_phone, source, notes) values
  ('a1111111-1111-4111-8111-111111111101', 'Amaka Obiora', 'Amaka Studio', 'amaka.obiora@example.com', '2348023456701', '2348023456701', 'whatsapp', 'Repeat customer, prefers woven labels with gold thread.'),
  ('a1111111-1111-4111-8111-111111111102', 'Tunde Bakare', 'Bakare Denim Co.', 'tunde@bakaredenim.example.com', '2348023456702', '2348023456703', 'whatsapp', 'Denim brand, orders leather patches quarterly.'),
  ('a1111111-1111-4111-8111-111111111103', 'Chiamaka Eze', 'CE Atelier', 'chiamaka@ceatelier.example.com', '2348023456704', '2348023456704', 'website', null),
  ('a1111111-1111-4111-8111-111111111104', 'Segun Adeyemi', 'Adeyemi Menswear', 'segun.adeyemi@example.com', '2348023456705', '2348023456706', 'whatsapp', 'Needs help choosing label type — first-time customer.'),
  ('a1111111-1111-4111-8111-111111111105', 'Blessing Okafor', 'Blessing Kids Wear', 'blessing.okafor@example.com', '2348023456707', '2348023456707', 'website', null);

-- ---------------------------------------------------------------------
-- Enquiry 1 — full happy path, delivered & completed
-- ---------------------------------------------------------------------
insert into enquiries (
  id, enquiry_number, customer_id, status, label_type, material, width, height, measurement_unit,
  quantity, background_colour, text_colour, fold_type, additional_instructions,
  delivery_address, delivery_city, delivery_state, delivery_phone, required_date,
  submitted_at, reviewed_at
) values (
  'b2222222-2222-4222-8222-222222222201', 'ENQ-2026-0001', 'a1111111-1111-4111-8111-111111111101', 'completed',
  'woven_label', 'Damask woven, satin finish', 6, 2.5, 'cm', 500, 'Deep brown (#2B1B12)', 'Muted gold (#B08D3E)',
  'center_fold', 'Please use the gold metallic thread from our last order (Feb 2026). Logo file attached.',
  '14 Adeola Odeku Street, Victoria Island', 'Lagos', 'Lagos', '2348023456701', '2026-09-10',
  now() - interval '18 days', now() - interval '17 days'
);

insert into enquiry_revisions (enquiry_id, spec_snapshot, note, created_at) values
  ('b2222222-2222-4222-8222-222222222201', '{"width":6,"height":2.5,"quantity":500,"fold_type":"center_fold"}', 'Initial submission', now() - interval '18 days');

insert into whatsapp_notes (enquiry_id, direction, note, created_at) values
  ('b2222222-2222-4222-8222-222222222201', 'inbound', 'Customer sent logo as PDF and asked for the same gold thread as her last order.', now() - interval '18 days'),
  ('b2222222-2222-4222-8222-222222222201', 'outbound', 'Confirmed we still have the matching gold thread in stock. Proceeding to quote.', now() - interval '17 days');

insert into quotations (
  id, quotation_number, enquiry_id, status, spec_snapshot, unit_price, quantity, subtotal,
  delivery_fee, discount, total, valid_until, terms, sent_at, responded_at
) values (
  'c3333333-3333-4333-8333-333333333301', 'QUO-2026-0001', 'b2222222-2222-4222-8222-222222222201', 'accepted',
  '{"label_type":"woven_label","width":6,"height":2.5,"unit":"cm","quantity":500,"fold_type":"center_fold"}',
  95.00, 500, 47500.00, 3500.00, 0, 51000.00, current_date - interval '11 days', 'Valid for 7 days. 50% deposit not required for repeat customers.',
  now() - interval '16 days', now() - interval '15 days'
);

insert into invoices (
  id, invoice_number, enquiry_id, quotation_id, status, subtotal, delivery_fee, discount, total,
  bank_account_id, issue_date, due_date, terms
) values (
  'd4444444-4444-4444-8444-444444444401', 'INV-2026-0001', 'b2222222-2222-4222-8222-222222222201', 'c3333333-3333-4333-8333-333333333301',
  'payment_confirmed', 47500.00, 3500.00, 0, 51000.00,
  (select id from bank_accounts where is_default), current_date - interval '15 days', current_date - interval '12 days',
  'Payment is due within 3 days. Use ENQ-2026-0001 as your transfer narration.'
);

insert into payments (invoice_id, amount_paid, payment_date, sender_account_name, sender_bank, evidence_file_path, status, reviewed_at) values
  ('d4444444-4444-4444-8444-444444444401', 51000.00, current_date - interval '14 days', 'Amaka Obiora', 'Access Bank', 'd4444444-4444-4444-8444-444444444401/proof-of-payment.jpg', 'confirmed', now() - interval '14 days');

insert into orders (id, order_number, enquiry_id, invoice_id, status, production_deadline, authorised_at) values
  ('e5555555-5555-4555-8555-555555555501', 'ORD-2026-0001', 'b2222222-2222-4222-8222-222222222201', 'd4444444-4444-4444-8444-444444444401', 'completed', current_date - interval '5 days', now() - interval '14 days');

insert into production_jobs (id, order_id, stage, started_at, completed_at, internal_notes) values
  ('f6666666-6666-4666-8666-666666666601', 'e5555555-5555-4555-8555-555555555501', 'completed', now() - interval '13 days', now() - interval '9 days', 'Used gold metallic thread batch #GT-22 as requested.');

insert into production_notes (production_job_id, note, created_at) values
  ('f6666666-6666-4666-8666-666666666601', 'Weaving started on Jacquard machine 2.', now() - interval '13 days'),
  ('f6666666-6666-4666-8666-666666666601', 'Cutting and folding complete, moving to QC.', now() - interval '10 days');

insert into qc_checklists (
  production_job_id, correct_artwork, correct_spelling, correct_dimensions, correct_colours,
  correct_material, correct_quantity, acceptable_quality, packaging_completed, overall_result, checked_at
) values (
  'f6666666-6666-4666-8666-666666666601', true, true, true, true, true, true, true, true, 'pass', now() - interval '9 days'
);

insert into dispatches (
  order_id, rider_name, rider_phone, dispatch_company, collection_at, dispatch_fee,
  delivery_address, tracking_reference, status, customer_confirmed_at
) values (
  'e5555555-5555-4555-8555-555555555501', 'Ibrahim Musa', '2348034567890', 'GIG Logistics', now() - interval '8 days', 3500.00,
  '14 Adeola Odeku Street, Victoria Island, Lagos', 'GIG-LG-88213', 'delivered', now() - interval '7 days'
);

-- ---------------------------------------------------------------------
-- Enquiry 2 — leather patches, currently in production
-- ---------------------------------------------------------------------
insert into enquiries (
  id, enquiry_number, customer_id, status, label_type, material, width, height, measurement_unit,
  quantity, background_colour, text_colour, fold_type, additional_instructions,
  delivery_address, delivery_city, delivery_state, delivery_phone, required_date, submitted_at, reviewed_at
) values (
  'b2222222-2222-4222-8222-222222222202', 'ENQ-2026-0002', 'a1111111-1111-4111-8111-111111111102', 'in_production',
  'leather_patch', 'Genuine full-grain leather, debossed', 8, 5, 'cm', 300, 'Tan leather', 'Debossed (no ink)', 'no_fold',
  'Debossed logo only, no colour fill. Two rivet holes pre-punched for denim waistband.',
  'Plot 5, Trans Amadi Industrial Layout', 'Port Harcourt', 'Rivers', '2348023456703', '2026-09-05',
  now() - interval '12 days', now() - interval '11 days'
);

insert into quotations (
  id, quotation_number, enquiry_id, status, spec_snapshot, unit_price, quantity, subtotal,
  delivery_fee, discount, total, valid_until, terms, sent_at, responded_at
) values (
  'c3333333-3333-4333-8333-333333333302', 'QUO-2026-0002', 'b2222222-2222-4222-8222-222222222202', 'accepted',
  '{"label_type":"leather_patch","width":8,"height":5,"unit":"cm","quantity":300,"fold_type":"no_fold"}',
  240.00, 300, 72000.00, 6000.00, 2000.00, 76000.00, current_date - interval '5 days', 'Valid for 7 days.',
  now() - interval '10 days', now() - interval '9 days'
);

insert into invoices (
  id, invoice_number, enquiry_id, quotation_id, status, subtotal, delivery_fee, discount, total,
  bank_account_id, issue_date, due_date, terms
) values (
  'd4444444-4444-4444-8444-444444444402', 'INV-2026-0002', 'b2222222-2222-4222-8222-222222222202', 'c3333333-3333-4333-8333-333333333302',
  'payment_confirmed', 72000.00, 6000.00, 2000.00, 76000.00,
  (select id from bank_accounts where is_default), current_date - interval '9 days', current_date - interval '6 days',
  'Payment is due within 3 days. Use ENQ-2026-0002 as your transfer narration.'
);

insert into payments (invoice_id, amount_paid, payment_date, sender_account_name, sender_bank, evidence_file_path, status, reviewed_at) values
  ('d4444444-4444-4444-8444-444444444402', 76000.00, current_date - interval '8 days', 'Tunde Bakare', 'GTBank', 'd4444444-4444-4444-8444-444444444402/proof-of-payment.jpg', 'confirmed', now() - interval '8 days');

insert into orders (id, order_number, enquiry_id, invoice_id, status, production_deadline, authorised_at) values
  ('e5555555-5555-4555-8555-555555555502', 'ORD-2026-0002', 'b2222222-2222-4222-8222-222222222202', 'd4444444-4444-4444-8444-444444444402', 'in_production', current_date + interval '2 days', now() - interval '8 days');

insert into production_jobs (id, order_id, stage, started_at, internal_notes) values
  ('f6666666-6666-4666-8666-666666666602', 'e5555555-5555-4555-8555-555555555502', 'in_production', now() - interval '6 days', 'Debossing plate confirmed with customer over WhatsApp before cutting.');

insert into production_notes (production_job_id, note, created_at) values
  ('f6666666-6666-4666-8666-666666666602', 'Leather cut to size, debossing plate mounted.', now() - interval '5 days'),
  ('f6666666-6666-4666-8666-666666666602', 'First batch of 100 debossed and rivet-punched — awaiting customer sign-off on sample.', now() - interval '2 days');

-- ---------------------------------------------------------------------
-- Enquiry 3 — quotation just sent, awaiting customer response
-- ---------------------------------------------------------------------
insert into enquiries (
  id, enquiry_number, customer_id, status, label_type, material, width, height, measurement_unit,
  quantity, background_colour, text_colour, fold_type, additional_instructions,
  delivery_address, delivery_city, delivery_state, delivery_phone, required_date, submitted_at, reviewed_at
) values (
  'b2222222-2222-4222-8222-222222222203', 'ENQ-2026-0003', 'a1111111-1111-4111-8111-111111111103', 'quotation_sent',
  'printed_fabric_label', 'Satin ribbon, heat transfer print', 5, 3, 'cm', 400, 'White', 'Full colour logo', 'straight_cut',
  'Logo has a gradient from terracotta to gold — please match Pantone reference sent on WhatsApp.',
  '9 Allen Avenue', 'Ikeja', 'Lagos', '2348023456704', '2026-09-20', now() - interval '4 days', now() - interval '3 days'
);

insert into quotations (
  id, quotation_number, enquiry_id, status, spec_snapshot, unit_price, quantity, subtotal,
  delivery_fee, discount, total, valid_until, terms, sent_at
) values (
  'c3333333-3333-4333-8333-333333333303', 'QUO-2026-0003', 'b2222222-2222-4222-8222-222222222203', 'sent',
  '{"label_type":"printed_fabric_label","width":5,"height":3,"unit":"cm","quantity":400,"fold_type":"straight_cut"}',
  60.00, 400, 24000.00, 3000.00, 0, 27000.00, current_date + interval '4 days', 'Valid for 7 days from issue date.',
  now() - interval '2 days'
);

-- ---------------------------------------------------------------------
-- Enquiry 4 — needs help choosing, still under review by admin
-- ---------------------------------------------------------------------
insert into enquiries (
  id, enquiry_number, customer_id, status, label_type, material, quantity, needs_help_choosing,
  additional_instructions, delivery_address, delivery_city, delivery_state, delivery_phone, required_date, submitted_at
) values (
  'b2222222-2222-4222-8222-222222222204', 'ENQ-2026-0004', 'a1111111-1111-4111-8111-111111111104', 'under_review',
  null, null, 250, true,
  'First time ordering labels for a new menswear line — not sure whether to go woven or printed. Attached two moodboard images.',
  '22 Awolowo Road', 'Ikoyi', 'Lagos', '2348023456706', '2026-10-01', now() - interval '1 day'
);

insert into whatsapp_notes (enquiry_id, direction, note, created_at) values
  ('b2222222-2222-4222-8222-222222222204', 'inbound', 'Customer unsure of label type — sent moodboard for a minimalist menswear brand.', now() - interval '1 day'),
  ('b2222222-2222-4222-8222-222222222204', 'outbound', 'Recommended woven label with tone-on-tone thread for a subtle look. Awaiting his decision.', now() - interval '20 hours');

-- ---------------------------------------------------------------------
-- Enquiry 5 — payment evidence submitted, awaiting verification
-- ---------------------------------------------------------------------
insert into enquiries (
  id, enquiry_number, customer_id, status, label_type, material, width, height, measurement_unit,
  quantity, background_colour, text_colour, fold_type, delivery_address, delivery_city, delivery_state,
  delivery_phone, required_date, submitted_at, reviewed_at
) values (
  'b2222222-2222-4222-8222-222222222205', 'ENQ-2026-0005', 'a1111111-1111-4111-8111-111111111105', 'payment_under_review',
  'hang_tag', 'Kraft card, 350gsm', 9, 5, 'cm', 600, 'Natural kraft', 'Deep brown print', 'no_fold',
  '5 Woji Road', 'Port Harcourt', 'Rivers', '2348023456707', '2026-09-15', now() - interval '9 days', now() - interval '8 days'
);

insert into quotations (
  id, quotation_number, enquiry_id, status, spec_snapshot, unit_price, quantity, subtotal,
  delivery_fee, discount, total, valid_until, terms, sent_at, responded_at
) values (
  'c3333333-3333-4333-8333-333333333305', 'QUO-2026-0005', 'b2222222-2222-4222-8222-222222222205', 'accepted',
  '{"label_type":"hang_tag","width":9,"height":5,"unit":"cm","quantity":600,"fold_type":"no_fold"}',
  68.00, 600, 40800.00, 4000.00, 0, 44800.00, current_date - interval '2 days', 'Valid for 7 days.',
  now() - interval '7 days', now() - interval '6 days'
);

insert into invoices (
  id, invoice_number, enquiry_id, quotation_id, status, subtotal, delivery_fee, discount, total,
  bank_account_id, issue_date, due_date, terms
) values (
  'd4444444-4444-4444-8444-444444444405', 'INV-2026-0005', 'b2222222-2222-4222-8222-222222222205', 'c3333333-3333-4333-8333-333333333305',
  'payment_under_review', 40800.00, 4000.00, 0, 44800.00,
  (select id from bank_accounts where is_default), current_date - interval '6 days', current_date - interval '3 days',
  'Payment is due within 3 days. Use ENQ-2026-0005 as your transfer narration.'
);

insert into payments (invoice_id, amount_paid, payment_date, sender_account_name, sender_bank, evidence_file_path, status) values
  ('d4444444-4444-4444-8444-444444444405', 44800.00, current_date - interval '1 day', 'Blessing Okafor', 'Zenith Bank', 'd4444444-4444-4444-8444-444444444405/proof-of-payment.jpg', 'submitted');

-- ---------------------------------------------------------------------
-- Enquiry 6 — changes requested by admin (missing dimensions)
-- ---------------------------------------------------------------------
insert into enquiries (
  id, enquiry_number, customer_id, status, label_type, material, quantity,
  additional_instructions, delivery_address, delivery_city, delivery_state, delivery_phone, required_date, submitted_at, reviewed_at
) values (
  'b2222222-2222-4222-8222-222222222206', 'ENQ-2026-0006', 'a1111111-1111-4111-8111-111111111103', 'changes_requested',
  'care_label', 'Cotton twill', 350,
  'Need wash-care symbols for cotton and polyester blend.',
  '9 Allen Avenue', 'Ikeja', 'Lagos', '2348023456704', '2026-09-25', now() - interval '3 days', now() - interval '2 days'
);

insert into whatsapp_notes (enquiry_id, direction, note, created_at) values
  ('b2222222-2222-4222-8222-222222222206', 'outbound', 'Requested exact label dimensions and fibre composition percentages before quoting.', now() - interval '2 days');

-- ---------------------------------------------------------------------
-- Sync document_sequences with the hand-picked numbers used above, so
-- the next REAL enquiry/quotation/invoice/order created through the app
-- (which relies on next_document_number()'s default) doesn't collide
-- with one of these seeded document numbers.
-- ---------------------------------------------------------------------
insert into document_sequences (prefix, year, next_value)
select 'ENQ', extract(year from now())::int, coalesce(max(substring(enquiry_number from 10)::int), 0) + 1 from enquiries
union all
select 'QUO', extract(year from now())::int, coalesce(max(substring(quotation_number from 10)::int), 0) + 1 from quotations
union all
select 'INV', extract(year from now())::int, coalesce(max(substring(invoice_number from 10)::int), 0) + 1 from invoices
union all
select 'ORD', extract(year from now())::int, coalesce(max(substring(order_number from 10)::int), 0) + 1 from orders
on conflict (prefix) do update set year = excluded.year, next_value = excluded.next_value;
