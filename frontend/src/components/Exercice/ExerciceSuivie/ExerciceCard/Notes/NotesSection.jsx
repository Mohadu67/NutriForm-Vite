

import { memo } from "react";

function NotesSection({ notes = "", onChange, classes = {} }) {
  const { container = "" } = classes;

  return (
    <div className={container}>
      <label htmlFor="notes">Notes</label>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder="Ajouter des notes..."
      />
    </div>
  );
}

export default memo(NotesSection);