import { useEffect } from "react";

export default function usePageTitle(title) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | NutriForm`;
    } else {
      document.title = "NutriForm";
    }
  }, [title]);
}