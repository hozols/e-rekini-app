"use client";

import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import UploadZone from "@/components/UploadZone";
import RateLimitBanner from "@/components/RateLimitBanner";

export default function Home() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lastRemaining");
    if (stored !== null) {
      setRemaining(parseInt(stored, 10));
    } else {
      setRemaining(3);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <RateLimitBanner remaining={remaining} />

      {/* Header */}
      <header className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-slate-900">e-Rēķini</span>
          </div>
          <span className="text-xs text-slate-400">Peppol BIS 3.0</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto">
          <HeroSection />
          <UploadZone remaining={remaining} />
          <div className="mt-16 mb-8">
            <HowItWorks />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 px-6">
        <div className="max-w-5xl mx-auto text-center text-xs text-slate-400">
          <p>e-Rēķini — PDF uz Peppol BIS Billing 3.0 XML konvertētājs</p>
          <p className="mt-1">
            Atbalsta Latvijas PVN likmes: 21% (S), 12% (AA), 5% (AA), 0% (Z) ·
            Peppol shēmas ID: 9934
          </p>
        </div>
      </footer>
    </div>
  );
}
