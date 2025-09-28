import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import OutilsCalcul from "./OutilsCalcul.jsx";
import AdSlot from "../../components/AdSlot/AdSlot.jsx";

export default function PageOutils() {
  return (
    <>
      <Header />
      <OutilsCalcul />
      <div style={{ margin: "20px auto", maxWidth: "300px", borderRadius: "10px", textAlign: "center" }}>
        <AdSlot slot="1234567890" />
      </div>
      <Footer />
    </>
  );
}