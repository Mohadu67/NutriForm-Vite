

import { idOf } from "./idOf";

export const sameIds = (a = [], b = []) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const A = a.map(idOf).sort();
  const B = b.map(idOf).sort();
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
  return true;
};

export const mergeById = (prev = [], next = []) => {
  const seen = new Set(prev.map(idOf));
  const merged = [...prev];
  for (const ex of next) {
    const k = idOf(ex);
    if (!seen.has(k)) {
      seen.add(k);
      merged.push(ex);
    }
  }
  return merged;
};