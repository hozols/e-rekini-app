"use client";

const steps = [
  {
    number: "1",
    title: "Augšupielādējiet PDF",
    description: "Ievelciet vai izvēlieties savu PDF rēķinu",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Automātiska atpazīšana",
    description: "AI nolasa pārdevēju, pircēju, PVN, rindas",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    number: "3",
    title: "Lejupielādējiet XML",
    description: "Peppol BIS 3.0 fails gatavs nosūtīšanai",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 px-4">
      <h2 className="text-center text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-8">
        Kā tas darbojas
      </h2>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 max-w-4xl mx-auto">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center gap-4">
            <div className="flex flex-col items-center text-center w-56">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                {step.icon}
              </div>
              <div className="text-xs font-bold text-indigo-500 mb-1">
                {step.number}. SOLIS
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500">{step.description}</p>
            </div>
            {i < steps.length - 1 && (
              <svg
                className="hidden md:block w-8 h-8 text-indigo-300 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
