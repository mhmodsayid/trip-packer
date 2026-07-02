import { getSupabase } from "./supabase";
import { AppError } from "./errors";
import {
  buildExistingNameSet,
  filterNewItems,
  type InsertItemsResult,
} from "./item-dedupe";
import { ADMIN_PARTICIPANT_NAME } from "./constants";
import { roundAmount } from "./format-amount";
import { generatePin } from "./pin";
import { TABLES } from "./tables";
import type { Item, Payment, Person, Trip } from "@/types";

export const PRESENCE_TIMEOUT_MS = 2 * 60 * 1000;

export interface JoinResult {
  person: Person;
  sessionId: string;
}

function mapPerson(row: Record<string, unknown>): Person {
  const person = row as unknown as Person;
  return {
    ...person,
    is_admin: row.is_admin === true,
  };
}

function isSessionActive(row: {
  active_session_id?: string | null;
  last_active_at?: string | null;
}): boolean {
  if (!row.active_session_id || !row.last_active_at) return false;
  const lastActive = new Date(String(row.last_active_at)).getTime();
  if (Number.isNaN(lastActive)) return false;
  return Date.now() - lastActive < PRESENCE_TIMEOUT_MS;
}

function mapTrip(row: Record<string, unknown>): Trip {
  const trip = row as unknown as Trip;
  const rawDate = row.trip_date;
  const rawOwner = row.owner_person_id;
  return {
    ...trip,
    trip_date:
      rawDate != null && rawDate !== ""
        ? String(rawDate).slice(0, 10)
        : null,
    owner_person_id:
      rawOwner != null && rawOwner !== "" ? String(rawOwner) : null,
  };
}

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

export async function createTrip(
  name: string,
  tripDate?: string | null
): Promise<Trip> {
  const supabase = getSupabase();
  const pin = generatePin();
  const payload: { name: string; pin: string; trip_date?: string } = {
    name: name.trim(),
    pin,
  };
  if (tripDate) payload.trip_date = tripDate;

  const { data, error } = await supabase
    .from(TABLES.trips)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapTrip(data as Record<string, unknown>);
}

export async function setTripOwner(tripId: string, personId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: person, error: personError } = await supabase
    .from(TABLES.people)
    .select("id")
    .eq("id", personId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (personError) throw personError;
  if (!person) throw new AppError("actionFailed");

  const { data, error } = await supabase
    .from(TABLES.trips)
    .update({ owner_person_id: personId })
    .eq("id", tripId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("actionFailed");
}

async function verifyTripOwner(
  tripId: string,
  personId: string,
  sessionId: string
): Promise<void> {
  const supabase = getSupabase();

  const { data: person, error: personError } = await supabase
    .from(TABLES.people)
    .select("id, active_session_id")
    .eq("id", personId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (personError) throw personError;
  if (!person || person.active_session_id !== sessionId) {
    throw new AppError("sessionExpired");
  }

  const { data: trip, error: tripError } = await supabase
    .from(TABLES.trips)
    .select("owner_person_id")
    .eq("id", tripId)
    .maybeSingle();

  if (tripError) throw tripError;
  if (!trip || trip.owner_person_id !== personId) {
    throw new AppError("notTripOwner");
  }
}

export async function ownerDeleteItem(
  itemId: string,
  tripId: string,
  personId: string,
  sessionId: string
): Promise<void> {
  await verifyTripOwner(tripId, personId, sessionId);
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.items)
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotDeleteItem");
}

export async function ownerUpdateItemName(
  itemId: string,
  name: string,
  tripId: string,
  personId: string,
  sessionId: string
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new AppError("itemNameRequired");

  await verifyTripOwner(tripId, personId, sessionId);
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.items)
    .update({ name: trimmed })
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotEditItem");
}

export async function ownerUpdateItemPrice(
  itemId: string,
  price: number | null,
  tripId: string,
  personId: string,
  sessionId: string
): Promise<void> {
  await verifyTripOwner(tripId, personId, sessionId);
  const supabase = getSupabase();
  const normalized = price != null ? roundAmount(price) : null;
  const { data, error } = await supabase
    .from(TABLES.items)
    .update({ price: normalized })
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotUpdateItem");
}

export async function ownerRemoveMember(
  tripId: string,
  ownerPersonId: string,
  sessionId: string,
  targetPersonId: string
): Promise<void> {
  await verifyTripOwner(tripId, ownerPersonId, sessionId);
  if (targetPersonId === ownerPersonId) {
    throw new AppError("actionFailed");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.people)
    .delete()
    .eq("id", targetPersonId)
    .eq("trip_id", tripId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("failedRemovePerson");
}

export async function ownerUpdateTrip(
  tripId: string,
  personId: string,
  sessionId: string,
  updates: { name?: string; pin?: string; trip_date?: string | null }
): Promise<void> {
  await verifyTripOwner(tripId, personId, sessionId);
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLES.trips).update(updates).eq("id", tripId);
  if (error) throw error;
}

export async function ownerRegenerateTripPin(
  tripId: string,
  personId: string,
  sessionId: string
): Promise<string> {
  const pin = generatePin();
  await ownerUpdateTrip(tripId, personId, sessionId, { pin });
  return pin;
}

export async function ownerDeleteTrip(
  tripId: string,
  personId: string,
  sessionId: string
): Promise<void> {
  await verifyTripOwner(tripId, personId, sessionId);
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLES.trips).delete().eq("id", tripId);
  if (error) throw error;
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.trips)
    .select("*")
    .eq("id", tripId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapTrip(data as Record<string, unknown>) : null;
}

export async function joinTrip(
  tripId: string,
  name: string,
  options?: { takeOver?: boolean }
): Promise<JoinResult> {
  const supabase = getSupabase();
  const trimmed = name.trim();
  const takeOver = options?.takeOver === true;

  if (trimmed.toLowerCase() === ADMIN_PARTICIPANT_NAME.toLowerCase()) {
    throw new AppError("nameTaken");
  }

  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from(TABLES.people)
    .select("*")
    .eq("trip_id", tripId)
    .ilike("name", trimmed)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const row = existing as Record<string, unknown>;
    if (row.is_admin === true) {
      throw new AppError("nameTaken");
    }
  }

  if (!existing) {
    const { data, error } = await supabase
      .from(TABLES.people)
      .insert({
        trip_id: tripId,
        name: trimmed,
        active_session_id: sessionId,
        last_active_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return { person: mapPerson(data as Record<string, unknown>), sessionId };
  }

  const row = existing as Record<string, unknown>;
  if (
    !takeOver &&
    isSessionActive({
      active_session_id: row.active_session_id as string | null,
      last_active_at: row.last_active_at as string | null,
    })
  ) {
    throw new AppError("nameInUse");
  }

  const { data, error } = await supabase
    .from(TABLES.people)
    .update({ active_session_id: sessionId, last_active_at: now })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) throw error;
  return { person: mapPerson(data as Record<string, unknown>), sessionId };
}

export async function resumeTripSession(
  tripId: string,
  personId: string,
  sessionId: string
): Promise<JoinResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.people)
    .select("*")
    .eq("id", personId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError("sessionExpired");

  const person = mapPerson(data as Record<string, unknown>);
  if (person.active_session_id !== sessionId) {
    throw new AppError("sessionExpired");
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from(TABLES.people)
    .update({ last_active_at: now })
    .eq("id", personId)
    .eq("active_session_id", sessionId)
    .select()
    .single();

  if (updateError) throw updateError;
  if (!updated) throw new AppError("sessionExpired");

  return { person: mapPerson(updated as Record<string, unknown>), sessionId };
}

export async function joinTripAsAdmin(tripId: string): Promise<JoinResult> {
  const supabase = getSupabase();
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data: adminRow, error: adminError } = await supabase
    .from(TABLES.people)
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_admin", true)
    .maybeSingle();

  if (adminError) throw adminError;

  let existing = adminRow;

  if (!existing) {
    const { data: byName, error: nameError } = await supabase
      .from(TABLES.people)
      .select("*")
      .eq("trip_id", tripId)
      .ilike("name", ADMIN_PARTICIPANT_NAME)
      .maybeSingle();

    if (nameError) throw nameError;
    existing = byName;
  }

  if (!existing) {
    const { data, error } = await supabase
      .from(TABLES.people)
      .insert({
        trip_id: tripId,
        name: ADMIN_PARTICIPANT_NAME,
        is_admin: true,
        active_session_id: sessionId,
        last_active_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return { person: mapPerson(data as Record<string, unknown>), sessionId };
  }

  const { data, error } = await supabase
    .from(TABLES.people)
    .update({
      name: ADMIN_PARTICIPANT_NAME,
      is_admin: true,
      active_session_id: sessionId,
      last_active_at: now,
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) throw error;
  return { person: mapPerson(data as Record<string, unknown>), sessionId };
}

export async function logout(personId: string, sessionId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLES.people)
    .update({ active_session_id: null })
    .eq("id", personId)
    .eq("active_session_id", sessionId);

  if (error) throw error;
}

export async function touchPresence(
  personId: string,
  sessionId: string
): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.people)
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", personId)
    .eq("active_session_id", sessionId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("sessionExpired");
}

export async function renamePerson(
  personId: string,
  name: string
): Promise<Person> {
  const trimmed = name.trim();
  if (!trimmed) throw new AppError("emptyName");

  const supabase = getSupabase();

  const { data: current, error: currentError } = await supabase
    .from(TABLES.people)
    .select("*")
    .eq("id", personId)
    .single();

  if (currentError) throw currentError;
  const currentPerson = mapPerson(current as Record<string, unknown>);

  if (currentPerson.is_admin) {
    throw new AppError("failedRename");
  }

  if (trimmed.toLowerCase() === ADMIN_PARTICIPANT_NAME.toLowerCase()) {
    throw new AppError("nameTaken");
  }

  if (currentPerson.name.toLowerCase() === trimmed.toLowerCase()) {
    const { data, error } = await supabase
      .from(TABLES.people)
      .update({ name: trimmed })
      .eq("id", personId)
      .select()
      .single();

    if (error) throw error;
    return mapPerson(data as Record<string, unknown>);
  }

  const { data: conflict, error: conflictError } = await supabase
    .from(TABLES.people)
    .select("id")
    .eq("trip_id", currentPerson.trip_id)
    .ilike("name", trimmed)
    .neq("id", personId)
    .maybeSingle();

  if (conflictError) throw conflictError;
  if (conflict) throw new AppError("nameTaken");

  const { data, error } = await supabase
    .from(TABLES.people)
    .update({ name: trimmed })
    .eq("id", personId)
    .select()
    .single();

  if (error) throw error;
  return mapPerson(data as Record<string, unknown>);
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
    .or(
      `added_by_person_id.eq.${personId},assigned_person_id.eq.${personId}`
    )
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotUpdateItem");
}

export async function updateItemName(
  itemId: string,
  name: string,
  personId: string
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new AppError("itemNameRequired");

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.items)
    .update({ name: trimmed })
    .eq("id", itemId)
    .eq("added_by_person_id", personId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new AppError("couldNotEditItem");
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
