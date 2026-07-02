import { notFound } from "next/navigation";
import { AdminTripDetailView } from "@/components/admin/AdminTripDetailView";
import { getTripAdminDetail } from "@/lib/admin-data";

interface AdminTripPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function AdminTripPage({ params }: AdminTripPageProps) {
  const { tripId } = await params;
  const detail = await getTripAdminDetail(tripId);

  if (!detail) {
    notFound();
  }

  return <AdminTripDetailView detail={detail} />;
}
