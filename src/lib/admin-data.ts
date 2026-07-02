import { generatePin } from "./pin";
import { visiblePeople } from "./people";
import { getServerSupabase } from "./admin-supabase";
import { TABLES } from "./tables";
import type { Item, Person, Trip } from "@/types";

export interface AdminTripSummary extends Trip {
  item_count: number;
  people_count: number;
}

export interface AdminItemRow extends Item {
  assignee_name: string | null;
  added_by_name: string | null;
}

export interface AdminTripDetail {
  trip: Trip;
  items: AdminItemRow[];
  people: Person[];
}

export async function listTripsAdmin(): Promise<AdminTripSummary[]> {
  const supabase = getServerSupabase();

  const [{ data: trips, error: tripsError }, { data: items }, { data: people }] =
    await Promise.all([
      supabase.from(TABLES.trips).select("*").order("created_at", { ascending: false }),
      supabase.from(TABLES.items).select("trip_id"),
      supabase.from(TABLES.people).select("trip_id, is_admin"),
    ]);

  if (tripsError) throw tripsError;

  const itemCounts = new Map<string, number>();
  const peopleCounts = new Map<string, number>();

  for (const row of items ?? []) {
    itemCounts.set(row.trip_id, (itemCounts.get(row.trip_id) ?? 0) + 1);
  }
  for (const row of people ?? []) {
    if (row.is_admin) continue;
    peopleCounts.set(row.trip_id, (peopleCounts.get(row.trip_id) ?? 0) + 1);
  }

  return (trips ?? []).map((trip) => ({
    ...(trip as Trip),
    item_count: itemCounts.get(trip.id) ?? 0,
    people_count: peopleCounts.get(trip.id) ?? 0,
  }));
}

export async function getTripAdminDetail(tripId: string): Promise<AdminTripDetail | null> {
  const supabase = getServerSupabase();

  const [{ data: trip, error: tripError }, { data: items }, { data: people }] =
    await Promise.all([
      supabase.from(TABLES.trips).select("*").eq("id", tripId).maybeSingle(),
      supabase
        .from(TABLES.items)
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true }),
      supabase.from(TABLES.people).select("*").eq("trip_id", tripId).order("name"),
    ]);

  if (tripError) throw tripError;
  if (!trip) return null;

  const allPeople = (people ?? []) as Person[];
  const peopleMap = new Map(allPeople.map((p) => [p.id, p.name]));

  const enriched: AdminItemRow[] = (items ?? []).map((item) => ({
    ...(item as Item),
    price: item.price != null && item.price !== "" ? Number(item.price) : null,
    assignee_name: item.assigned_person_id
      ? peopleMap.get(item.assigned_person_id) ?? null
      : null,
    added_by_name: item.added_by_person_id
      ? peopleMap.get(item.added_by_person_id) ?? null
      : null,
  }));

  return {
    trip: trip as Trip,
    items: enriched,
    people: visiblePeople(allPeople),
  };
}

export async function adminUpdateTrip(
  tripId: string,
  updates: { name?: string; pin?: string }
): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from(TABLES.trips).update(updates).eq("id", tripId);
  if (error) throw error;
}

export async function adminRegenerateTripPin(tripId: string): Promise<string> {
  const pin = generatePin();
  await adminUpdateTrip(tripId, { pin });
  return pin;
}

export async function adminDeleteTrip(tripId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from(TABLES.trips).delete().eq("id", tripId);
  if (error) throw error;
}

export async function adminUpdateItem(
  itemId: string,
  updates: {
    name?: string;
    quantity?: number;
    category?: string | null;
    price?: number | null;
    assigned_person_id?: string | null;
  }
): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from(TABLES.items).update(updates).eq("id", itemId);
  if (error) throw error;
}

export async function adminDeleteItem(itemId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from(TABLES.items).delete().eq("id", itemId);
  if (error) throw error;
}

export async function adminDeletePerson(personId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from(TABLES.people).delete().eq("id", personId);
  if (error) throw error;
}
