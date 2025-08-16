import usePageTitle from "../../hooks/usePagetitle.js";
import Footer from "../../components/Footer/Footer.jsx";
import Header from "../../components/Header/Header.jsx";
import Main from "./Main/Main.jsx";

export default function Home() {
  usePageTitle("Accueil");

  return (
    <>
      <Header />
      <Main />
      <Footer />
    </>
  );
}