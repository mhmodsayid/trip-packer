"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  adminConfigured,
  isAdminAuthenticated,
  secureCompare,
  signSessionToken,
} from "@/lib/admin-auth";
import {
  adminDeleteItem,
  adminDeletePerson,
  adminDeleteTrip,
  adminRegenerateTripPin,
  adminUpdateItem,
  adminUpdateTrip,
} from "@/lib/admin-data";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function adminLoginAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  if (!adminConfigured()) {
    return { error: "notConfigured" };
  }

  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";

  if (!password || !expected || !secureCompare(password, expected)) {
    return { error: "invalidPassword" };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, signSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  redirect("/admin");
}

export async function adminLogoutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function adminRenameTripAction(tripId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await adminUpdateTrip(tripId, { name });
  revalidatePath("/admin");
  revalidatePath(`/admin/trips/${tripId}`);
}

export async function adminSetPinAction(tripId: string, formData: FormData) {
  await requireAdmin();
  const pin = String(formData.get("pin") ?? "").trim().toUpperCase();
  if (!pin) return;
  await adminUpdateTrip(tripId, { pin });
  revalidatePath(`/admin/trips/${tripId}`);
}

export async function adminRegeneratePinAction(tripId: string) {
  await requireAdmin();
  await adminRegenerateTripPin(tripId);
  revalidatePath(`/admin/trips/${tripId}`);
}

export async function adminDeleteTripAction(tripId: string) {
  await requireAdmin();
  await adminDeleteTrip(tripId);
  redirect("/admin");
}

export async function adminUpdateItemAction(
  tripId: string,
  itemId: string,
  formData: FormData
) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const quantity = parseInt(String(formData.get("quantity") ?? "1"), 10);
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const assignee = String(formData.get("assigned_person_id") ?? "");
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? parseFloat(priceRaw.replace(",", ".")) : null;

  if (!name) return;

  await adminUpdateItem(itemId, {
    name,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    category: categoryRaw || null,
    price: price != null && Number.isFinite(price) && price >= 0 ? price : null,
    assigned_person_id: assignee || null,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/trips/${tripId}`);
}

export async function adminDeleteItemAction(tripId: string, itemId: string) {
  await requireAdmin();
  await adminDeleteItem(itemId);
  revalidatePath("/admin");
  revalidatePath(`/admin/trips/${tripId}`);
}

export async function adminDeletePersonAction(tripId: string, personId: string) {
  await requireAdmin();
  await adminDeletePerson(personId);
  revalidatePath("/admin");
  revalidatePath(`/admin/trips/${tripId}`);
}
