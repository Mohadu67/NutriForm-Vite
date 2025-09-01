import React, { useMemo } from "react";
import { TYPE_MAP, MUSCLE_MAP, EQUIP_MAP } from "./DataMap";

const LVL = { beginner: 1, easy: 1, intermediate: 2, medium: 2, advanced: 3, hard: 3 };

function norm(v) {
  if (!v && v !== 0) return "";
  return String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normArr(arr) {
  return (arr || []).map(norm);
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function intersectCount(a, b) {
  if (!a || !b) return 0;
  const sb = new Set(b);
  let n = 0;
  for (const x of a) if (sb.has(x)) n++;
  return n;
}

function hasEvery(a, b) {
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

function parseLvl(l) {
  if (typeof l === "number") return l;
  return LVL[norm(l)] || null;
}

function tokeniser(q) {
  return uniq(norm(q).split(/[^a-z0-9]+/).filter(t => t.length > 1));
}

function texteScore(exo, tokens) {
  if (!tokens.length) return { ok: true, score: 0 };
  const name = norm(exo.name || "");
  const aliases = (exo.aliases || []).map(norm);
  const desc = norm(exo.description || "");
  let hits = 0;
  let bonus = 0;
  for (const t of tokens) {
    const inName = name.includes(t);
    const inAlias = aliases.some(a => a.includes(t));
    const inDesc = desc.includes(t);
    if (inName || inAlias || inDesc) {
      hits++;
      if (inName) bonus += 2;
      if (inAlias) bonus += 2;
    }
  }
  if (!hits) return { ok: false, score: 0 };
  const coverage = hits / tokens.length;
  return { ok: true, score: Math.round(coverage * 8) + bonus };
}

function expandTypes(typeIds) {
  const ids = Array.isArray(typeIds) ? typeIds : [typeIds].filter(Boolean);
  const res = [];
  for (const id of ids) {
    const m = TYPE_MAP?.[id];
    if (Array.isArray(m) && m.length) res.push(...m);
    else if (id) res.push(id);
  }
  return uniq(res.map(norm));
}

function expandMuscles(muscleIds) {
  const ids = Array.isArray(muscleIds) ? muscleIds : [muscleIds].filter(Boolean);
  const res = [];
  for (const id of ids) {
    const m = MUSCLE_MAP?.[id];
    if (Array.isArray(m) && m.length) res.push(...m);
    else if (id) res.push(id);
  }
  return uniq(res.map(norm));
}

function expandEquipments(equipIds) {
  const ids = Array.isArray(equipIds) ? equipIds : [equipIds].filter(Boolean);
  const res = [];
  for (const id of ids) {
    const k = norm(id).replace(/\s+/g, "-");
    const m = EQUIP_MAP?.[k];
    if (Array.isArray(m) && m.length) res.push(...m);
    else if (id) res.push(id);
  }
  return uniq(res.map(norm));
}

function baseList(exercises) {
  if (Array.isArray(exercises) && exercises.length) return exercises;
  return [];
}

export function rechercherExercices(criteria = {}, exercises) {
  const {
    q = "",
    typeId = null,
    typeIds = [],
    muscleIds = [],
    equipIds = [],
    bodyParts = [],
    includeTags = [],
    excludeTags = [],
    requireAllMuscles = false,
    requireAllEquipments = false,
    equipmentPolicy = "anyRequired",
    musclePolicy = "anyRequired",
    minLevel = null,
    maxLevel = null,
    limit = 24,
    offset = 0,
    sortBy = "pertinence",
  } = criteria;

  const list = baseList(exercises);
  const types = expandTypes(typeId ? [typeId, ...typeIds] : typeIds);
  const muscles = expandMuscles(muscleIds);
  const tokens = tokeniser(q);
  const tSet = new Set(types.map(norm));
  const mSet = new Set(muscles.map(norm));
  const eSet = new Set(expandEquipments(equipIds));
  const bpSet = new Set((bodyParts || []).map(norm));
  const incTags = new Set((includeTags || []).map(norm));
  const excTags = new Set((excludeTags || []).map(norm));

  const scored = [];

  for (const exo of list) {
    const exoTypes = Array.isArray(exo.type) ? exo.type : [exo.type];
    const exoTypesN = normArr(exoTypes);
    if (tSet.size && !exoTypesN.some((t) => tSet.has(t))) continue;

    const exoMus = uniq(normArr([...(exo.muscles || []), ...(exo.primaryMuscle ? [exo.primaryMuscle] : [])]));
    const musMatches = mSet.size ? intersectCount(exoMus, muscles) : 0;
    if (mSet.size) {
      if (musclePolicy === "all" && !hasEvery(exoMus, muscles)) continue;
      if (musclePolicy === "anyRequired" && musMatches === 0) continue;
    }

    const exoEq = normArr(exo.equipments || exo.equipment || []);
    const eqMatches = eSet.size ? intersectCount(exoEq, Array.from(eSet)) : 0;
    if (eSet.size) {
      const equipArr = Array.from(eSet);
      if (equipmentPolicy === "all" && !hasEvery(exoEq, equipArr)) continue;
      if (equipmentPolicy === "anyRequired" && eqMatches === 0) continue;
    }

    const exBody = norm(exo.bodyPart);
    if (bpSet.size && !bpSet.has(exBody)) continue;

    const exTags = normArr(exo.tags || []);
    if (excTags.size && exTags.some(t => excTags.has(t))) continue;
    if (incTags.size && !exTags.some(t => incTags.has(t))) continue;

    const exLvl = parseLvl(exo.level);
    if (minLevel != null && exLvl != null && exLvl < minLevel) continue;
    if (maxLevel != null && exLvl != null && exLvl > maxLevel) continue;

    const ts = texteScore(exo, tokens);
    if (!ts.ok && tokens.length) continue;

    let score = 0;
    if (tSet.size) score += 6;
    score += musMatches * 5;
    score += eqMatches * 3;
    score += ts.score;
    if (exLvl != null) score += 1;

    if (exo.popularity != null) {
      const p = Number(exo.popularity) || 0;
      score += Math.min(Math.max(p, 0), 100) / 20;
    }

    if (exo.addedAt) {
      const d = new Date(exo.addedAt).getTime();
      if (!Number.isNaN(d)) {
        const days = (Date.now() - d) / 86400000;
        if (days > 0) score += Math.max(0, 3 - Math.log10(1 + days));
      }
    }

    scored.push({ ...exo, _score: score, _eq: eqMatches, _mus: musMatches });
  }

  let out = scored;
  if (sortBy === "nom") out = out.sort((a, b) => norm(a.name).localeCompare(norm(b.name)));
  else if (sortBy === "difficulte") out = out.sort((a, b) => (parseLvl(a.level) || 0) - (parseLvl(b.level) || 0));
  else out = out.sort((a, b) => b._score - a._score || norm(a.name).localeCompare(norm(b.name)));

  const sliced = out.slice(offset, offset + limit).map(({ _score, _eq, _mus, ...rest }) => rest);
  return sliced;
}

export function rechercherAvecMeta(criteria = {}, exercises) {
  const all = rechercherExercices({ ...criteria, limit: Number.MAX_SAFE_INTEGER, offset: 0 }, exercises);
  const total = all.length;
  const facets = { muscles: {}, equipments: {}, bodyParts: {}, types: {} };
  for (const e of all) {
    for (const m of e.muscles || []) facets.muscles[m] = (facets.muscles[m] || 0) + 1;
    for (const eq of e.equipments || e.equipment || []) facets.equipments[eq] = (facets.equipments[eq] || 0) + 1;
    if (e.bodyPart) facets.bodyParts[e.bodyPart] = (facets.bodyParts[e.bodyPart] || 0) + 1;
    if (e.type) facets.types[e.type] = (facets.types[e.type] || 0) + 1;
  }
  return { items: all.slice(0, criteria.limit || 24), total, facets };
}

export function useMoteurRecherche(criteria = {}, exercises) {
  return useMemo(() => rechercherExercices(criteria, exercises), [JSON.stringify(criteria), exercises]);
}
