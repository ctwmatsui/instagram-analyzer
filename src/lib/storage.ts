import { Account } from "@/types";

const STORAGE_KEY = "instagram-analyzer-accounts";

export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function addAccount(account: Account): void {
  const accounts = getAccounts();
  accounts.push(account);
  saveAccounts(accounts);
}

export function updateAccount(updated: Account): void {
  const accounts = getAccounts();
  const index = accounts.findIndex((a) => a.id === updated.id);
  if (index !== -1) {
    accounts[index] = updated;
    saveAccounts(accounts);
  }
}

export function deleteAccount(id: string): void {
  const accounts = getAccounts().filter((a) => a.id !== id);
  saveAccounts(accounts);
}

export function getAccountById(id: string): Account | undefined {
  return getAccounts().find((a) => a.id === id);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
