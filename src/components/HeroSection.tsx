"use client";

export default function HeroSection() {
  return (
    <section className="text-center py-16 px-4">
      <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Bezmaksas — 3 konvertācijas dienā
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
        PDF rēķins → Peppol XML
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-2">
        Konvertējiet savus PDF rēķinus uz Peppol BIS Billing 3.0 (UBL 2.1) XML
        formātu dažu sekunžu laikā.
      </p>
      <p className="text-sm text-slate-500 max-w-xl mx-auto">
        Augšupielādējiet PDF, mēs automātiski atpazīsim datus un izveidosim
        standartam atbilstošu e-rēķinu.
      </p>
    </section>
  );
}
