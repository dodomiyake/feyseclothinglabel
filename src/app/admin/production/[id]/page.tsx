import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadProductionJobByOrderId } from "@/lib/data/production";
import { ProductionJobDetail } from "@/components/domain/production-job-detail";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignStaffForm } from "@/components/domain/assign-staff-form";

export const metadata: Metadata = { title: "Production job — Feyse Clothing Labels" };

export default async function AdminProductionJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadProductionJobByOrderId(id);
  if (!data) notFound();

  const supabase = await createClient();
  const { data: staff } = await supabase.from("profiles").select("id, full_name").eq("role", "production");

  return (
    <div className="space-y-6">
      <ProductionJobDetail
        job={data.job}
        order={data.order}
        enquiry={data.enquiry}
        notes={data.notes}
        photoUrls={data.photoUrls}
        qc={data.qc}
        isAdmin
        showFinance
      />
      <div className="max-w-4xl">
        <Card>
          <CardHeader><CardTitle>Assignment</CardTitle></CardHeader>
          <CardBody>
            <AssignStaffForm jobId={data.job.id} currentStaffId={data.job.assigned_to} staff={staff ?? []} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
