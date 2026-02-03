// lib/clientId.ts
// Generates and stores a unique client ID in localStorage for identifying users locally

export function getClientId(): string | null {
  if (typeof window === "undefined") return null;

  const KEY = "ri_client_id";
  let id = window.localStorage.getItem(KEY);
  
  if (!id) {
    // crypto.randomUUID is supported in modern browsers
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  
  return id;
}
