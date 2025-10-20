import { useEffect } from "react";
import Footer from "../../components/Footer/Footer.jsx";
import Header from "../../components/Header/Header.jsx";
import Main from "./Main/Main.jsx";

export default function Home() {
  useEffect(() => {
    document.title = "Harmonith – Tu t'entraînes, je t'accompagne.";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "Calcule ton IMC, tes besoins caloriques et crée ton programme d'entraînement personnalisé avec Harmonith, progressé ca devient façile.");
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
