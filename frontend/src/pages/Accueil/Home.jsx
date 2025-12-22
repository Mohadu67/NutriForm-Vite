import { Helmet } from "react-helmet-async";
import Footer from "../../components/Footer/Footer.jsx";
import Header from "../../components/Header/Header.jsx";
import Main from "./Main/Main.jsx";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Application Fitness Gratuite | 300+ Exercices & Programmes - Harmonith</title>
        <meta name="description" content="Application fitness 100% gratuite : 300+ exercices avec GIF, programmes musculation personnalisés, calculateurs IMC et calories, recettes healthy. Commence ta transformation aujourd'hui !" />
        <link rel="canonical" href="https://harmonith.fr/" />
      </Helmet>
      <Header />
      <Main />
      <Footer />
    </>
  );
}
