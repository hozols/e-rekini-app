"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ConvertResponse, ExtractedInvoice } from "@/lib/types";
import { generatePeppolXml } from "@/lib/xml-generator";
import { mapToPeppol } from "@/lib/peppol-mapper";
import EditableFields from "@/components/EditableFields";
import XmlPreview from "@/components/XmlPreview";
import ConfidenceBadge from "@/components/ConfidenceBadge";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [editedData, setEditedData] = useState<ExtractedInvoice | null>(null);
  const [xml, setXml] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("convertResult");
    if (!stored) {
      router.push("/");
      return;
    }

    const data: ConvertResponse = JSON.parse(stored);
    setResult(data);
    setEditedData(data.extractedData);
    setXml(data.xml);

    // Store remaining for rate limit banner
    sessionStorage.setItem("lastRemaining", String(data.remaining));
  }, [router]);

  const handleDataChange = useCallback(
    (updated: ExtractedInvoice) => {
      setEditedData(updated);
      // Regenerate XML from edited data
      const mapped = mapToPeppol(updated);
      const newXml = generatePeppolXml(mapped);
      setXml(newXml);
    },
    []
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [xml]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const invoiceNum = editedData?.invoiceNumber || "rekins";
    a.download = `${invoiceNum.replace(/[^a-zA-Z0-9-_]/g, "_")}_peppol.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [xml, editedData]);

  if (!result || !editedData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Atpakaļ
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
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
              <span className="font-bold text-sm text-slate-900">
                e-Rēķini
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConfidenceBadge score={result.confidenceScore} />

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Nokopēts!
                </>
              ) : (
                <>
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Kopēt XML
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Lejupielādēt .xml
            </button>
          </div>
        </div>
      </header>

      {/* Two-panel layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Editable fields */}
        <div className="w-1/2 border-r border-slate-200 p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Rēķina dati
            </h2>
            <span className="text-xs text-slate-400">
              (rediģējiet, lai atjaunotu XML)
            </span>
          </div>
          <EditableFields data={editedData} onChange={handleDataChange} />
        </div>

        {/* Right: XML preview */}
        <div className="w-1/2 p-6 bg-slate-50">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Peppol BIS 3.0 XML
            </h2>
            <span className="text-xs text-slate-400">UBL 2.1</span>
          </div>
          <XmlPreview xml={xml} />
        </div>
      </main>
    </div>
  );
}
