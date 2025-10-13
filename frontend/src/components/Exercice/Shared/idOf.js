


export const canon = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

export const idOf = (ex) => {
  if (ex == null) return "";
  if (typeof ex === "string" || typeof ex === "number") return canon(String(ex));

  
  let raw = ex.id ?? ex._id ?? ex.slug;

  
  if (raw && typeof raw === "object") {
    const fromObj = raw.$oid || raw.oid || (typeof raw.toHexString === "function" && raw.toHexString()) || (typeof raw.toString === "function" && raw.toString());
    if (fromObj && typeof fromObj === "string") return canon(fromObj);
    
    raw = null;
  }

  if (typeof raw === "string" || typeof raw === "number") return canon(String(raw));

  
  const nameLike = ex.name ?? ex.title ?? "";
  return canon(String(nameLike));
};