export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "content-type": "application/json" } });
  } catch {
    throw new ApiError(0, "network", "Network error");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? "Request failed");
  return data as T;
}

export const api = {
  createRoom: (password: string) =>
    call<{ roomId: string; hostSecret: string }>("/api/rooms", { method: "POST", body: JSON.stringify({ password }) }),
  roomExists: (roomId: string) => call<{ exists: boolean }>(`/api/rooms/${roomId}`),
  token: (roomId: string, body: { name: string; clientId?: string; password?: string; hostSecret?: string }) =>
    call<{ token: string; url: string; role: "host" | "guest"; identity: string }>(`/api/rooms/${roomId}/token`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  endRoom: (roomId: string, hostSecret: string) =>
    call<{ ok: true }>(`/api/rooms/${roomId}`, { method: "DELETE", body: JSON.stringify({ hostSecret }) }),
};
