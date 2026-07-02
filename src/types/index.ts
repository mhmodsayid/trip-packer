export interface Trip {
  id: string;
  name: string;
  pin: string;
  trip_date: string | null;
  owner_person_id: string | null;
  created_at: string;
}

export interface Person {
  id: string;
  trip_id: string;
  name: string;
  active_session_id?: string | null;
  last_active_at?: string | null;
  is_admin?: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  trip_id: string;
  name: string;
  quantity: number;
  category: string | null;
  price: number | null;
  assigned_person_id: string | null;
  added_by_person_id: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  trip_id: string;
  person_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface ItemWithAssignee extends Item {
  assignee_name?: string | null;
}

export interface ParsedItemInput {
  name: string;
  quantity: number;
  category: string | null;
  price: number | null;
}

export interface StoredPerson {
  id: string;
  name: string;
  sessionId: string;
}

export interface TripHistoryEntry {
  id: string;
  name: string;
  pin: string;
  personName: string;
  lastVisited: number;
}

export type ItemFilter = "all" | "unclaimed" | "mine";
