import React, { useMemo } from "react";
import { TYPE_MAP, MUSCLE_MAP, EQUIP_MAP } from "./DataMap";

const LVL = { beginner: 1, easy: 1, intermediate: 2, medium: 2, advanced: 3, hard: 3 };

const SCORE_WEIGHTS = {
  type: 6,
  muscle: 5,
  equipment: 3,
  level: 1,
};

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

function toArray(val) {
  if (!val && val !== 0) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(/[,;|/]+/).map((s) => s.trim()).filter(Boolean);
  return [val];
}

function matchTypes(exo, tSet) {
  const exoTypes = toArray(exo.type);
  const exoTypesN = normArr(exoTypes);
  if (!tSet.size) return true;
  const crits = Array.from(tSet);
  return exoTypesN.some((t) => crits.some((crit) => t.includes(crit)));
}

function matchMuscles(exo, muscles, mSet, musclePolicy) {
  const exoMus = uniq(normArr([ ...toArray(exo.muscles), ...toArray(exo.primaryMuscle), ...toArray(exo.muscle) ]));
  const musMatches = mSet.size ? intersectCount(exoMus, muscles) : 0;
  if (!mSet.size) return { ok: true, count: 0 };
  if (musclePolicy === "all" && !muscles.every((m) => exoMus.some((em) => em.includes(m)))) {
    return { ok: false, count: 0 };
  }
  if (musclePolicy === "anyRequired" && musMatches === 0) {
    const hasSome = muscles.some((m) => exoMus.some((em) => em.includes(m)));
    if (!hasSome) return { ok: false, count: 0 };
  }
  return { ok: true, count: musMatches };
}

function matchEquipments(exo, eSet, equipmentPolicy) {
  const exoEq = normArr([ ...toArray(exo.equipments), ...toArray(exo.equipment) ]);
  const eqMatches = eSet.size ? intersectCount(exoEq, Array.from(eSet)) : 0;
  if (!eSet.size) return { ok: true, count: 0 };
  const equipArr = Array.from(eSet);
  if (equipmentPolicy === "all" && !equipArr.every((e) => exoEq.some((ee) => ee.includes(e)))) {
    return { ok: false, count: 0 };
  }
  if (equipmentPolicy === "anyRequired" && eqMatches === 0) {
    const hasSome = equipArr.some((e) => exoEq.some((ee) => ee.includes(e)));
    if (!hasSome) return { ok: false, count: 0 };
  }
  return { ok: true, count: eqMatches };
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
    if (!matchTypes(exo, tSet)) continue;

    const musResult = matchMuscles(exo, muscles, mSet, musclePolicy);
    if (!musResult.ok) continue;

    const eqResult = matchEquipments(exo, eSet, equipmentPolicy);
    if (!eqResult.ok) continue;

    const exBodyList = normArr(toArray(exo.bodyPart));
    if (bpSet.size && !Array.from(bpSet).some((bp) => exBodyList.some((b) => b.includes(bp)))) continue;

    const exTags = normArr(toArray(exo.tags));
    const excArr = Array.from(excTags);
    const incArr = Array.from(incTags);
    if (excTags.size && exTags.some((t) => excArr.some((crit) => t.includes(crit)))) continue;
    if (incTags.size && !exTags.some((t) => incArr.some((crit) => t.includes(crit)))) continue;

    const exLvl = parseLvl(exo.level);
    if (minLevel != null && exLvl != null && exLvl < minLevel) continue;
    if (maxLevel != null && exLvl != null && exLvl > maxLevel) continue;

    const ts = texteScore(exo, tokens);
    if (!ts.ok && tokens.length) continue;

    let score = 0;
    if (tSet.size) score += SCORE_WEIGHTS.type;
    score += musResult.count * SCORE_WEIGHTS.muscle;
    score += eqResult.count * SCORE_WEIGHTS.equipment;
    score += ts.score;
    if (exLvl != null) score += SCORE_WEIGHTS.level;

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

    scored.push({ ...exo, _score: score, _eq: eqResult.count, _mus: musResult.count });
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
    for (const m of toArray(e.muscles)) {
      const k = norm(m);
      facets.muscles[k] = (facets.muscles[k] || 0) + 1;
    }
    for (const eq of [...toArray(e.equipments), ...toArray(e.equipment)]) {
      const k = norm(eq);
      facets.equipments[k] = (facets.equipments[k] || 0) + 1;
    }
    for (const bp of toArray(e.bodyPart)) {
      const k = norm(bp);
      facets.bodyParts[k] = (facets.bodyParts[k] || 0) + 1;
    }
    for (const tp of toArray(e.type)) {
      const k = norm(tp);
      facets.types[k] = (facets.types[k] || 0) + 1;
    }
  }
  return { items: all.slice(0, criteria.limit || 24), total, facets };
}

export function useMoteurRecherche(criteria = {}, exercises) {
  return useMemo(() => rechercherExercices(criteria, exercises), [JSON.stringify(criteria), exercises]);
}
