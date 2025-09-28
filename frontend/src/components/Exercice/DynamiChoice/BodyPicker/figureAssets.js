
const FRONT_ZONE_SPECS = [
  { id: "pectoraux", label: "Pectoraux", svgIds: ["PECTORAUX"] },
  { id: "epaules", label: "Épaules", svgIds: ["EPAULES"] },
  { id: "biceps", label: "Biceps", svgIds: ["BICEPS"] },
  { id: "triceps", label: "Triceps", svgIds: ["TRICEPS"] },
  { id: "avant-bras", label: "Avant-bras", svgIds: ["AVANT_BRAS"] },
  { id: "abdos-centre", label: "Abdos (milieu)", svgIds: ["ABDOS_CENTRE"] },
  { id: "abdos-lateraux", label: "Abdos (latéraux)", svgIds: ["ABDOS_LATERAUX"] },
  { id: "dos-superieur", label: "Dos (haut)", svgIds: ["DOS_SUPERIEUR"] },
  { id: "dos-inferieur", label: "Dos (bas)", svgIds: ["DOS_INFERIEUR"] },
  { id: "fessiers", label: "Fessiers", svgIds: ["FESSIERS"] },
  { id: "cuisses-externes", label: "Cuisses externes", svgIds: ["CUISSES_EXTERNES"] },
  { id: "cuisses-internes", label: "Cuisses internes", svgIds: ["CUISSES_INTERNES"] },
  { id: "mollets", label: "Mollets", svgIds: ["MOLLETS"] },
];

export const FRONT_ZONE_METADATA = Object.freeze(
  FRONT_ZONE_SPECS.map(({ id, label }) => Object.freeze({ id, label }))
);

export const FRONT_SVG_ZONE_MAP = Object.freeze(
  FRONT_ZONE_SPECS.reduce((acc, spec) => {
    spec.svgIds.forEach((svgId) => {
      acc[svgId] = spec.id;
    });
    return acc;
  }, {})
);

export const FRONT_ZONE_LABELS = Object.freeze(
  FRONT_ZONE_SPECS.reduce((acc, spec) => {
    acc[spec.id] = spec.label;
    return acc;
  }, {})
);

export const FRONT_ZONE_IDS = Object.freeze(
  FRONT_ZONE_METADATA.map((zone) => zone.id)
);
