import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadProductionJobByOrderId } from "@/lib/data/production";
import { ProductionJobDetail } from "@/components/domain/production-job-detail";

export const metadata: Metadata = { title: "Production job — Feyse Clothing Labels" };

export default async function ProductionJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadProductionJobByOrderId(id);
  if (!data) notFound();

  return (
    <ProductionJobDetail
      job={data.job}
      order={data.order}
      enquiry={data.enquiry}
      notes={data.notes}
      photoUrls={data.photoUrls}
      qc={data.qc}
      isAdmin={false}
      showFinance={false}
    />
  );
}
