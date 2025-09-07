


export const canon = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

export const idOf = (ex) => {
  if (ex == null) return "";
  if (typeof ex === "string" || typeof ex === "number") return canon(String(ex));

  // Try explicit fields first
  let raw = ex.id ?? ex._id ?? ex.slug;

  // If id/_id is an object (e.g., Mongo ObjectId), try common shapes
  if (raw && typeof raw === "object") {
    const fromObj = raw.$oid || raw.oid || (typeof raw.toHexString === "function" && raw.toHexString()) || (typeof raw.toString === "function" && raw.toString());
    if (fromObj && typeof fromObj === "string") return canon(fromObj);
    // fall through if we couldn't stringify meaningfully
    raw = null;
  }

  if (typeof raw === "string" || typeof raw === "number") return canon(String(raw));

  // Fallback to name/title when no explicit id present
  const nameLike = ex.name ?? ex.title ?? "";
  return canon(String(nameLike));
};