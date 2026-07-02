import { getSupabase } from "./supabase";
import { AppError } from "./errors";
import { generatePin } from "./pin";
import { TABLES } from "./tables";
import type { Item, Person, Trip } from "@/types";

export async function createTrip(name: string): Promise<Trip> {
  const supabase = getSupabase();
  const pin = generatePin();

  const { data, error } = await supabase
    .from(TABLES.trips)
    .insert({ name: name.trim(), pin })
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.trips)
    .select("*")
    .eq("id", tripId)
    .maybeSingle();

  if (error) throw error;
  return data as Trip | null;
}

export async function findOrCreatePerson(
  tripId: string,
  name: string
): Promise<Person> {
  const supabase = getSupabase();
  const trimmed = name.trim();

  const { data: existing } = await supabase
    .from(TABLES.people)
    .select("*")
    .eq("trip_id", tripId)
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return existing as Person;

  const { data, error } = await supabase
    .from(TABLES.people)
    .insert({ trip_id: tripId, name: trimmed })
    .select()
    .single();

  if (error) throw error;
  return data as Person;
}

export async function getPeople(tripId: string): Promise<Person[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.people)
    .select("*")
    .eq("trip_id", tripId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as Person[];
}

export async function getItems(tripId: string): Promise<Item[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.items)
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Item[];
}

export async function insertItems(
  tripId: string,
  items: { name: string; quantity: number; category: string | null }[]
): Promise<number> {
  if (items.length === 0) return 0;

  const supabase = getSupabase();
  const rows = items.map((item) => ({
    trip_id: tripId,
    name: item.name,
    quantity: item.quantity,
    category: item.category,
  }));

  const { error } = await supabase.from(TABLES.items).insert(rows);
  if (error) throw error;
  return rows.length;
}

export async function claimItem(
  itemId: string,
  personId: string
): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.items)
    .update({ assigned_person_id: personId })
    .eq("id", itemId)
    .is("assigned_person_id", null)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("itemAlreadyClaimed");
}

export async function unclaimItem(itemId: string, personId: string): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.items)
    .update({ assigned_person_id: null })
    .eq("id", itemId)
    .eq("assigned_person_id", personId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotUnclaim");
}

export async function deleteItem(itemId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLES.items).delete().eq("id", itemId);
  if (error) throw error;
}

export function subscribeToItems(
  tripId: string,
  onChange: () => void
): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`items:${tripId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLES.items,
        filter: `trip_id=eq.${tripId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToPeople(
  tripId: string,
  onChange: () => void
): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`people:${tripId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLES.people,
        filter: `trip_id=eq.${tripId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
