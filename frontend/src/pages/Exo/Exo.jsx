import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import FormExo from "../../components/Exercice/FormExo/FormExo.jsx";
import AdSlot from "../../components/Ads/AdSlot.jsx";


export default function ExoPage () {
  usePageTitle("S'entraîner");

  return (
    <>
      <Header />
      <main>
        <FormExo />
        <div style={{ margin: "20px auto", maxWidth: "300px", textAlign: "center" }}>
          <AdSlot slot="1234567890" />
        </div>
      </main>
      <Footer />
    </>
  );
}