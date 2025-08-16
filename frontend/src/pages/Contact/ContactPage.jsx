
import React, { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import styles from "./ContactPage.module.css";
import Faq from "./Faq/Faq.jsx";
import FormContact from "./FormContact/FormContact.jsx";

export default function ContactPage() {
  usePageTitle("Contact");

  return (
    <>
      <Header />
      <main className={styles.wrapper}>
        <Faq />
        <FormContact />
      </main>
      <Footer />
    </>
  );
}