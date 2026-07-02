import type { Person } from "@/types";

export function isAdminPerson(person: Pick<Person, "is_admin">): boolean {
  return person.is_admin === true;
}

export function visiblePeople(people: Person[]): Person[] {
  return people.filter((p) => !isAdminPerson(p));
}

export function adminPersonIds(people: Person[]): Set<string> {
  return new Set(people.filter(isAdminPerson).map((p) => p.id));
}

export function isAdminPersonId(
  people: Person[],
  personId: string | null | undefined
): boolean {
  if (!personId) return false;
  return people.some((p) => p.id === personId && isAdminPerson(p));
}
