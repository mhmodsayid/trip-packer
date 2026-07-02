import { TripPageClient } from "@/components/TripPageClient";

interface TripPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { tripId } = await params;
  return <TripPageClient tripId={tripId} />;
}
