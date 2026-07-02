export interface Trip {
  id: string;
  name: string;
  pin: string;
  created_at: string;
}

export interface Person {
  id: string;
  trip_id: string;
  name: string;
  created_at: string;
}

export interface Item {
  id: string;
  trip_id: string;
  name: string;
  quantity: number;
  category: string | null;
  assigned_person_id: string | null;
  created_at: string;
}

export interface ItemWithAssignee extends Item {
  assignee_name?: string | null;
}

export interface ParsedItemInput {
  name: string;
  quantity: number;
  category: string | null;
}

export interface StoredPerson {
  id: string;
  name: string;
}

export type ItemFilter = "all" | "unclaimed" | "mine";
