import { getSupabase } from "./supabase";
import { AppError } from "./errors";
import {
  buildExistingNameSet,
  filterNewItems,
  type InsertItemsResult,
} from "./item-dedupe";
import { roundAmount } from "./format-amount";
import { generatePin } from "./pin";
import { TABLES } from "./tables";
import type { Item, Payment, Person, Trip } from "@/types";

function mapItem(row: Record<string, unknown>): Item {
  const item = row as unknown as Item;
  return {
    ...item,
    price: row.price != null && row.price !== "" ? Number(row.price) : null,
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  const payment = row as unknown as Payment;
  return {
    ...payment,
    amount: Number(row.amount),
  };
}

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

export async function renamePerson(
  personId: string,
  name: string
): Promise<Person> {
  const trimmed = name.trim();
  if (!trimmed) throw new AppError("emptyName");

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.people)
    .update({ name: trimmed })
    .eq("id", personId)
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
  return (data ?? []).map((row) => mapItem(row as Record<string, unknown>));
}

export async function insertItems(
  tripId: string,
  addedByPersonId: string,
  items: {
    name: string;
    quantity: number;
    category: string | null;
    price?: number | null;
  }[]
): Promise<InsertItemsResult> {
  if (items.length === 0) return { added: 0, skipped: 0 };

  const existing = await getItems(tripId);
  const existingNames = buildExistingNameSet(existing);
  const { toInsert, skippedDuplicates } = filterNewItems(items, existingNames);

  if (toInsert.length === 0) {
    return { added: 0, skipped: skippedDuplicates };
  }

  const supabase = getSupabase();
  const rows = toInsert.map((item) => ({
    trip_id: tripId,
    name: item.name.trim(),
    quantity: item.quantity,
    category: item.category,
    price: item.price ?? null,
    added_by_person_id: addedByPersonId,
  }));

  const { error } = await supabase.from(TABLES.items).insert(rows);
  if (error) throw error;
  return { added: rows.length, skipped: skippedDuplicates };
}

export async function updateItemPrice(
  itemId: string,
  price: number | null,
  personId: string
): Promise<void> {
  const supabase = getSupabase();
  const normalized = price != null ? roundAmount(price) : null;
  const { data, error } = await supabase
    .from(TABLES.items)
    .update({ price: normalized })
    .eq("id", itemId)
    .eq("added_by_person_id", personId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotUpdateItem");
}

export async function getPayments(tripId: string): Promise<Payment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.payments)
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapPayment(row as Record<string, unknown>));
}

export async function addPayment(
  tripId: string,
  personId: string,
  amount: number,
  note: string | null
): Promise<Payment> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.payments)
    .insert({
      trip_id: tripId,
      person_id: personId,
      amount: roundAmount(amount),
      note: note?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPayment(data as Record<string, unknown>);
}

export async function updatePayment(
  paymentId: string,
  personId: string,
  updates: { amount?: number; note?: string | null }
): Promise<void> {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = {};
  if (updates.amount != null) payload.amount = roundAmount(updates.amount);
  if (updates.note !== undefined) payload.note = updates.note?.trim() || null;

  const { data, error } = await supabase
    .from(TABLES.payments)
    .update(payload)
    .eq("id", paymentId)
    .eq("person_id", personId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotUpdatePayment");
}

export async function deletePayment(
  paymentId: string,
  personId: string
): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.payments)
    .delete()
    .eq("id", paymentId)
    .eq("person_id", personId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotDeletePayment");
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

export async function claimItems(
  itemIds: string[],
  personId: string
): Promise<number> {
  let claimed = 0;
  for (const itemId of itemIds) {
    try {
      await claimItem(itemId, personId);
      claimed++;
    } catch (err) {
      if (err instanceof AppError && err.code === "itemAlreadyClaimed") {
        continue;
      }
      throw err;
    }
  }
  return claimed;
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

export async function deleteItem(itemId: string, personId: string): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.items)
    .delete()
    .eq("id", itemId)
    .eq("added_by_person_id", personId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotDeleteItem");
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

export function subscribeToPayments(
  tripId: string,
  onChange: () => void
): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`payments:${tripId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLES.payments,
        filter: `trip_id=eq.${tripId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
