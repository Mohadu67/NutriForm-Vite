import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import FormExo from "../../components/Exercice/FormExo/FormExo.jsx";
import AdSlot from "../../components/AdSlot/AdSlot.jsx";


export default function ExoPage () {
  usePageTitle("S'entraîner");

  return (
    <>
      <Header />
      <main>
        <AdSlot slot="1234567890" />
        <FormExo />
      </main>
      <Footer />
    </>
  );
}
