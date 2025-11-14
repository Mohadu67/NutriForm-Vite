
import { useTranslation } from "react-i18next";
import IntroOutils from "./IntrOutils";
import OutilsCards from "./OutilsCards";
import InfoSection from "./InfoSection";
import styles from "./Main.module.css";

export default function Main() {
  const { t } = useTranslation();

  return (
    <main className={styles.main}>
      <IntroOutils
        title={t('home.mainTitle')}
        text={t('home.mainSubtitle')}
      />

      <IntroOutils
        title={t('home.toolsTitle')}
      >
        <OutilsCards />
      </IntroOutils>

      <InfoSection />
    </main>
  );
}