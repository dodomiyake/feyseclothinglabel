"use client";

import { assignProductionStaffAction } from "@/lib/actions/production";
import { Select } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";

export function AssignStaffForm({
  jobId,
  currentStaffId,
  staff,
}: {
  jobId: string;
  currentStaffId: string | null;
  staff: { id: string; full_name: string }[];
}) {
  return (
    <form action={assignProductionStaffAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="job_id" value={jobId} />
      <Select name="staff_id" defaultValue={currentStaffId ?? ""} className="sm:flex-1">
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>{s.full_name}</option>
        ))}
      </Select>
      <Button type="submit" size="sm" variant="outline">Save assignment</Button>
    </form>
  );
}
