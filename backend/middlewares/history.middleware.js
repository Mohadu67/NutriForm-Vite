
function guessMuscleGroup(name = "", type = "") {
  const n = String(name || "").toLowerCase();
  const t = String(type || "").toLowerCase();
  if (/mollet|calf/.test(n)) return "Mollets";
  if (/pompe|push[- ]?up|bench|développé|developpe|pec/.test(n)) return "Pectoraux";
  if (/traction|pull[- ]?up|row|tirage|dos/.test(n)) return "Dos";
  if (/squat|presse|leg|fente|deadlift|soulevé/.test(n)) return "Jambes";
  if (/curl|biceps/.test(n)) return "Biceps";
  if (/triceps|dip/.test(n)) return "Triceps";
  if (/épaule|epaule|shoulder|overhead|militaire|lateral/.test(n)) return "Épaules";
  if (/abdo|crunch|gainage|core|planche/.test(n)) return "Abdos";
  if (t === "cardio") return "Cardio";
  return null;
}

function enrichEntryMuscles(entry) {
  if (!entry || typeof entry !== 'object') return entry;

  const hasAny = (Array.isArray(entry.muscles) && entry.muscles.length)
    || entry.muscleGroup
    || entry.muscle;

  if (hasAny) {
    if (entry.muscleGroup && (!entry.muscles || entry.muscles.length === 0)) {
      entry.muscles = [entry.muscleGroup];
    }
    return entry;
  }

  const g = guessMuscleGroup(entry.exerciseName, entry.type);
  if (g) {
    entry.muscleGroup = entry.muscleGroup || g;
    entry.muscle = entry.muscle || g;
    if (!Array.isArray(entry.muscles) || entry.muscles.length === 0) entry.muscles = [g];
  }
  return entry;
}

function enrichEntriesMuscles(entries) {
  if (!Array.isArray(entries)) return entries;
  return entries.map(enrichEntryMuscles);
}


function enrichMuscles(req, _res, next) {
  try {
    if (Array.isArray(req.body)) {
      req.body = req.body.map((doc) => {
        if (doc && Array.isArray(doc.entries)) {
          doc.entries = enrichEntriesMuscles(doc.entries);
        }
        return doc;
      });
    } else if (req.body && Array.isArray(req.body.entries)) {
      req.body.entries = enrichEntriesMuscles(req.body.entries);
    }
  } catch (e) {
  }
  return next();
}

module.exports = {
  enrichMuscles,
  enrichEntryMuscles,
  enrichEntriesMuscles,
  guessMuscleGroup,
};