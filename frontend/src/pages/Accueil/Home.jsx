import { useEffect } from "react";
import Footer from "../../components/Footer/Footer.jsx";
import Header from "../../components/Header/Header.jsx";
import Main from "./Main/Main.jsx";

export default function Home() {
  useEffect(() => {
    document.title = "Harmonith – Ton coach fitness gratuit | 300+ exercices, programmes et recettes";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "Plateforme fitness 100% gratuite : 300+ exercices avec suivi intelligent, programmes personnalisés, recettes healthy et calculateurs (IMC, calories, 1RM). Commence ta transformation dès maintenant.");
    }
  }, []);

  return (
    <>
      <Header />
      <Main />
      <Footer />
    </>
  );
}
