import type { UpdateUserInput } from "./validations";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function updateUser(data: UpdateUserInput) {
  return fetchJson("/api/user", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function createMonth(month: number, year: number) {
  return fetchJson("/api/months", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, year }),
  });
}

export async function uploadStatement(
  packageId: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/months/${packageId}/statements`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

export async function deleteStatement(packageId: string, statementId: string) {
  return fetchJson(`/api/months/${packageId}/statements/${statementId}`, {
    method: "DELETE",
  });
}

export async function submitPackage(packageId: string) {
  return fetchJson(`/api/months/${packageId}/submit`, {
    method: "POST",
  });
}
