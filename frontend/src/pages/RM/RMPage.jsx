import { useState, useEffect } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import FormRM from "./FormRM/FormRM.jsx";
import ResultatsRM from "./ResultatsRM/ResultatsRM.jsx";
import TableauCharges from "./TableauCharges/TableauCharges.jsx";
import ArticlesRM from "./ArticlesRM/ArticlesRM.jsx";

export default function RMPage() {
  usePageTitle("Calculateur 1RM");
  const [rmData, setRmData] = useState(null);

  useEffect(() => {
    if (rmData !== null) {
      setTimeout(() => {
        const element = document.getElementById('rm-results');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [rmData]);

  return (
    <>
      <main>
        <FormRM onResult={(data) => setRmData(data)} />
        {rmData && (
          <>
            <ResultatsRM data={rmData} />
            <TableauCharges rm={rmData.rm} />
          </>
        )}
        <ArticlesRM />
      </main>
    </>
  );
}