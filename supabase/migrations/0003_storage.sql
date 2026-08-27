-- Private storage buckets. Every bucket except business-assets is private;
-- access is enforced by RLS on storage.objects, mirroring the table policies,
-- and app code always serves files through short-lived signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('artwork', 'artwork', false, 15728640, array['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf']),
  ('payment-evidence', 'payment-evidence', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf']),
  ('production-photos', 'production-photos', false, 10485760, array['image/png','image/jpeg','image/webp']),
  ('dispatch-proof', 'dispatch-proof', false, 10485760, array['image/png','image/jpeg','image/webp']),
  ('business-assets', 'business-assets', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- artwork: path = {enquiry_id}/{filename}
create policy "artwork_select" on storage.objects for select
  using (
    bucket_id = 'artwork'
    and (
      is_admin()
      or exists (
        select 1 from enquiries e join customers c on c.id = e.customer_id
        where e.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()
      )
      or exists (
        select 1 from production_jobs pj join orders o on o.id = pj.order_id
        where o.enquiry_id::text = (storage.foldername(name))[1] and pj.assigned_to = auth.uid()
      )
    )
  );

create policy "artwork_insert" on storage.objects for insert
  with check (
    bucket_id = 'artwork'
    and (
      is_admin()
      or exists (
        select 1 from enquiries e join customers c on c.id = e.customer_id
        where e.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()
      )
    )
  );

create policy "artwork_delete" on storage.objects for delete
  using (
    bucket_id = 'artwork'
    and (
      is_admin()
      or exists (
        select 1 from enquiries e join customers c on c.id = e.customer_id
        where e.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid() and e.status = 'draft'
      )
    )
  );

-- payment-evidence: path = {invoice_id}/{filename}
create policy "payment_evidence_select" on storage.objects for select
  using (
    bucket_id = 'payment-evidence'
    and (
      is_admin()
      or exists (
        select 1 from invoices i join enquiries e on e.id = i.enquiry_id join customers c on c.id = e.customer_id
        where i.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()
      )
    )
  );

create policy "payment_evidence_insert" on storage.objects for insert
  with check (
    bucket_id = 'payment-evidence'
    and (
      is_admin()
      or exists (
        select 1 from invoices i join enquiries e on e.id = i.enquiry_id join customers c on c.id = e.customer_id
        where i.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()
      )
    )
  );

-- production-photos: path = {production_job_id}/{filename}
create policy "production_photos_bucket_select" on storage.objects for select
  using (
    bucket_id = 'production-photos'
    and (
      is_admin()
      or exists (
        select 1 from production_jobs pj where pj.id::text = (storage.foldername(name))[1] and pj.assigned_to = auth.uid()
      )
      or exists (
        select 1 from production_jobs pj
        join orders o on o.id = pj.order_id
        join enquiries e on e.id = o.enquiry_id
        join customers c on c.id = e.customer_id
        where pj.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()
      )
    )
  );

create policy "production_photos_bucket_insert" on storage.objects for insert
  with check (
    bucket_id = 'production-photos'
    and (
      is_admin()
      or exists (
        select 1 from production_jobs pj where pj.id::text = (storage.foldername(name))[1] and pj.assigned_to = auth.uid()
      )
    )
  );

-- dispatch-proof: path = {order_id}/{filename}
create policy "dispatch_proof_select" on storage.objects for select
  using (
    bucket_id = 'dispatch-proof'
    and (
      is_admin()
      or exists (
        select 1 from orders o join enquiries e on e.id = o.enquiry_id join customers c on c.id = e.customer_id
        where o.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()
      )
    )
  );

create policy "dispatch_proof_insert" on storage.objects for insert
  with check (bucket_id = 'dispatch-proof' and is_admin());

-- business-assets: public read, admin write
create policy "business_assets_public_select" on storage.objects for select
  using (bucket_id = 'business-assets');

create policy "business_assets_admin_insert" on storage.objects for insert
  with check (bucket_id = 'business-assets' and is_admin());

create policy "business_assets_admin_update" on storage.objects for update
  using (bucket_id = 'business-assets' and is_admin());
