
import React, { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Faq from "./Faq/Faq.jsx";
import FormContact from "./FormContact/FormContact.jsx";
import AdSlot from "../../components/AdSlot/AdSlot.jsx";

export default function ContactPage() {
  usePageTitle("Contact");

  return (
    <>
      <Header />
      <main>
        <Faq />
        <FormContact />
        <div style={{ margin: "20px auto", borderRadius: "10px", maxWidth: "300px", textAlign: "center" }}>
          <AdSlot slot="1234567890" />
        </div>
      </main>
      <Footer />
    </>
  );
}