import { roundAmount } from "./format-amount";
import type { Item, Payment, Person } from "@/types";

export interface PersonBalance {
  personId: string;
  personName: string;
  paid: number;
  fairShare: number;
  balance: number;
}

export interface SettlementTransfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface SettlementSummary {
  totalCost: number;
  outstandingItems: number;
  fairShare: number;
  balances: PersonBalance[];
  transfers: SettlementTransfer[];
}

function itemPrice(item: Item): number {
  return item.price != null ? roundAmount(Number(item.price)) : 0;
}

export function computeSettlement(
  people: Person[],
  items: Item[],
  payments: Payment[]
): SettlementSummary {
  const claimedItemsTotal = items
    .filter((i) => i.assigned_person_id)
    .reduce((sum, i) => sum + itemPrice(i), 0);

  const paymentsTotal = payments.reduce(
    (sum, p) => sum + roundAmount(Number(p.amount)),
    0
  );

  const totalCost = roundAmount(claimedItemsTotal + paymentsTotal);

  const outstandingItems = roundAmount(
    items
      .filter((i) => !i.assigned_person_id)
      .reduce((sum, i) => sum + itemPrice(i), 0)
  );

  const paidByPerson = new Map<string, number>();
  for (const person of people) {
    paidByPerson.set(person.id, 0);
  }

  for (const item of items) {
    if (!item.assigned_person_id) continue;
    const price = itemPrice(item);
    if (price <= 0) continue;
    paidByPerson.set(
      item.assigned_person_id,
      roundAmount((paidByPerson.get(item.assigned_person_id) ?? 0) + price)
    );
  }

  for (const payment of payments) {
    paidByPerson.set(
      payment.person_id,
      roundAmount((paidByPerson.get(payment.person_id) ?? 0) + Number(payment.amount))
    );
  }

  const participantCount = people.length;
  const fairShare =
    participantCount > 0 ? roundAmount(totalCost / participantCount) : 0;

  const balances: PersonBalance[] = people.map((person) => {
    const paid = paidByPerson.get(person.id) ?? 0;
    return {
      personId: person.id,
      personName: person.name,
      paid,
      fairShare,
      balance: roundAmount(paid - fairShare),
    };
  });

  const transfers = computeMinTransfers(balances);

  return { totalCost, outstandingItems, fairShare, balances, transfers };
}

export function computeMinTransfers(
  balances: PersonBalance[]
): SettlementTransfer[] {
  const creditors = balances
    .filter((b) => b.balance > 0.005)
    .map((b) => ({ personId: b.personId, personName: b.personName, balance: b.balance }))
    .sort((a, b) => b.balance - a.balance);

  const debtors = balances
    .filter((b) => b.balance < -0.005)
    .map((b) => ({
      personId: b.personId,
      personName: b.personName,
      balance: roundAmount(-b.balance),
    }))
    .sort((a, b) => b.balance - a.balance);

  const transfers: SettlementTransfer[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const amount = roundAmount(Math.min(debtors[di].balance, creditors[ci].balance));
    if (amount > 0.005) {
      transfers.push({
        fromId: debtors[di].personId,
        fromName: debtors[di].personName,
        toId: creditors[ci].personId,
        toName: creditors[ci].personName,
        amount,
      });
    }
    debtors[di].balance = roundAmount(debtors[di].balance - amount);
    creditors[ci].balance = roundAmount(creditors[ci].balance - amount);
    if (debtors[di].balance < 0.005) di++;
    if (creditors[ci].balance < 0.005) ci++;
  }

  return transfers;
}
