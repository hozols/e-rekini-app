"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

interface UploadZoneProps {
  remaining: number | null;
}

export default function UploadZone({ remaining }: UploadZoneProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setFileName(file.name);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/convert", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Kļūda konvertējot rēķinu");
          setUploading(false);
          return;
        }

        // Store result in sessionStorage for the result page
        sessionStorage.setItem("convertResult", JSON.stringify(data));
        router.push("/result");
      } catch {
        setError("Neizdevās savienoties ar serveri. Mēģiniet vēlreiz.");
        setUploading(false);
      }
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxFiles: 1,
    disabled: uploading || remaining === 0,
  });

  return (
    <div className="max-w-xl mx-auto px-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? "border-indigo-500 bg-indigo-50 dropzone-active"
              : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
          ${remaining === 0 ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-600">
              Apstrādā <span className="font-medium">{fileName}</span>...
            </p>
            <p className="text-xs text-slate-400">
              Tas var aizņemt līdz 20 sekundēm
            </p>
          </div>
        ) : remaining === 0 ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-10 h-10 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <p className="text-sm text-slate-500 font-medium">
              Dienas limits sasniegts
            </p>
            <p className="text-xs text-slate-400">
              Mēģiniet vēlreiz rīt
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
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
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {isDragActive
                  ? "Nometiet failu šeit..."
                  : "Ievelciet rēķinu šeit (PDF vai attēls)"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, PNG, JPG, WEBP — vai noklikšķiniet, lai izvēlētos
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
