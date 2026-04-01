const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7779";

export async function fetchDashboard() {
  const res = await fetch(`${API_URL}/api/dashboard`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function fetchTasks(status?: string) {
  const url = status
    ? `${API_URL}/api/tasks?status=${status}`
    : `${API_URL}/api/tasks`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(data: {
  title: string;
  status?: string;
  domain?: string;
  source?: string;
  notes?: string;
  task_id?: number | null;
}) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function fetchCorrections() {
  const res = await fetch(`${API_URL}/api/corrections`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch corrections");
  return res.json();
}

export async function fetchLog(limit = 50) {
  const res = await fetch(`${API_URL}/api/log?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch log");
  return res.json();
}

export { API_URL };
