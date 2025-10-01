import { useEffect } from "react";

export default function usePageTitle(title) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Harmonith`;
    } else {
      document.title = "Harmonith";
    }
  }, [title]);
}