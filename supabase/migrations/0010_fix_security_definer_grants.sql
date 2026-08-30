-- 0009 revoked EXECUTE from the "public" pseudo-role, which turned out to be
-- a no-op: Supabase grants EXECUTE on new public-schema functions directly
-- to anon/authenticated/service_role (via default privileges), not through
-- PUBLIC. Verified via information_schema.role_routine_grants after 0009
-- applied — every grant was still there. Revoking from each role by name
-- this time.

revoke execute on function next_document_number(text) from anon;
revoke execute on function is_production_staff() from anon;
revoke execute on function is_assigned_to_enquiry(uuid) from anon;

revoke execute on function handle_new_user() from anon, authenticated;
revoke execute on function current_profile_role() from anon, authenticated;
