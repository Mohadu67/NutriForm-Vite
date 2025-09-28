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
        <FormExo />
        <div style={{ margin: "20px auto", maxWidth: "300px", textAlign: "center", borderRadius: "10px", overflow: "hidden", border: "1px solid #eee" }}>
          <AdSlot slot="1234567890" />
        </div>
      </main>
      <Footer />
    </>
  );
}