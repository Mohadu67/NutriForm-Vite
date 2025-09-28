import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import OutilsCalcul from "./OutilsCalcul.jsx";
import AdSlot from "../../components/Ads/AdSlot.jsx";

export default function PageOutils() {
  return (
    <>
      <Header />
      <OutilsCalcul />
      <div style={{ margin: "20px auto", maxWidth: "300px", textAlign: "center" }}>
        <AdSlot slot="1234567890" />
      </div>
      <Footer />
    </>
  );
}