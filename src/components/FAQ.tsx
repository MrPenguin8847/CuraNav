"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is CuraNav?",
    answer:
      "CuraNav is a transparent healthcare discovery platform that helps you search, compare, and navigate PM-JAY empanelled hospitals. Our AI-powered search understands plain-language queries and matches you with hospitals based on specialty, budget, and location — all backed by data from the National Health Authority.",
  },
  {
    question: "Is CuraNav free to use?",
    answer:
      "Yes. CuraNav is completely free for patients and caregivers. It is a prototype built for TECHNOVA 2026 under the Responsible AI theme, designed to demonstrate how transparent healthcare information systems should work.",
  },
  {
    question: "Where does CuraNav get its hospital data?",
    answer:
      "Our hospital index is sourced from the NHA Health Empanelment Module (hem.nha.gov.in) — the official PM-JAY hospital database. Every record includes its source type and verification status so you always know what's confirmed vs. estimated.",
  },
  {
    question: "Does CuraNav provide medical advice?",
    answer:
      "No. CuraNav is an information platform, not a medical service. We help you discover and compare hospitals — we do not diagnose conditions or recommend treatments. Always consult qualified medical professionals for health decisions.",
  },
  {
    question: "What hospitals and specialties does CuraNav cover?",
    answer:
      "CuraNav currently indexes PM-JAY empanelled hospitals with data across multiple specialties including Cardiology, Orthopedics, Oncology, Neurosurgery, Ophthalmology, and more. The exact count updates automatically as we expand our database.",
  },
  {
    question: "How does the AI search work?",
    answer:
      "Our AI parses your natural-language query to extract intent — specialty, budget, city, and required facilities. It then matches these parameters against our live hospital database. If AI providers are unavailable, a robust local fallback extracts filters using keyword matching.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-padding section-alt">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Everything you need to know about using CuraNav for your healthcare
            decisions.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`bg-white border rounded-2xl transition-all duration-300 ${
                  isOpen
                    ? "border-primary/20 shadow-md shadow-primary/5"
                    : "border-slate-100 shadow-sm"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      isOpen ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
