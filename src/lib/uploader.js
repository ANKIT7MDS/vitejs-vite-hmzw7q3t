// src/lib/uploader.js
import { UPLOAD_URL } from './config';

/** File -> dataURL (base64) */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** एक फाइल अपलोड करें */
export async function uploadFile({ file, uid, collectionId, eventId }) {
  if (!file) throw new Error("No file");
  if (!uid || !collectionId || !eventId) throw new Error("Missing uid/collectionId/eventId");

  const dataUrl = await fileToDataURL(file);

  const payload = {
    uid,
    collectionId,
    eventId,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    dataUrl
  };

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json; // { ok, path, downloadURL }
}
