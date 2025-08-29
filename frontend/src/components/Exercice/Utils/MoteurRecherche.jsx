

import { useEffect, useState } from "react";

function normalize(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export default function MoteurRecherche() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {

    fetch("/data/db.json")
      .then((r) => r.json())
      .then((json) => {
        setData(json.exercises || []);
      });
  }, []);

  function handleSearch(e) {
    const q = e.target.value;
    setQuery(q);
    const nq = normalize(q);
    if (!nq) {
      setResults([]);
      return;
    }
    const tokens = nq.split(/\s+/).filter(Boolean);

    const scored = data.map((exo) => {
      let score = 0;
      const fields = [
        exo.name,
        ...(exo.objectives || []),
        ...(exo.muscles || []),
        ...(exo.equipment || []),
        ...(exo.type || [])
      ].map(normalize);

      tokens.forEach((t) => {
        fields.forEach((f) => {
          if (f.includes(t)) score += 2;
        });
      });
      return { exo, score };
    });

    const filtered = scored.filter((s) => s.score > 0);
    filtered.sort((a, b) => b.score - a.score);
    setResults(filtered.map((s) => s.exo));
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <input
        type="text"
        placeholder="Rechercher un exercice (ex: bras haltères force)"
        value={query}
        onChange={handleSearch}
        style={{ padding: ".5rem", borderRadius: "8px", border: "1px solid #ccc" }}
      />

      <div style={{ display: "grid", gap: ".5rem" }}>
        {results.map((exo) => (
          <div
            key={exo.name}
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: ".6rem .8rem",
              background: "#fff",
            }}
          >
            <strong>{exo.name}</strong>
            <div style={{ fontSize: ".85rem", marginTop: ".25rem" }}>
              Objectifs: {exo.objectives?.join(", ")}
            </div>
            <div style={{ fontSize: ".85rem" }}>Muscles: {exo.muscles?.join(", ")}</div>
            <div style={{ fontSize: ".85rem" }}>Équipement: {exo.equipment?.join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}