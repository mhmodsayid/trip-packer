import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { AdminTripsTable } from "@/components/admin/AdminTripsTable";
import { listTripsAdmin } from "@/lib/admin-data";

export default async function AdminDashboardPage() {
  const trips = await listTripsAdmin();

  return (
    <div>
      <AdminDashboardHeader />
      <AdminTripsTable trips={trips} />
    </div>
  );
}
