"use client";

interface RateLimitBannerProps {
  remaining: number | null;
}

export default function RateLimitBanner({ remaining }: RateLimitBannerProps) {
  if (remaining === null) return null;

  if (remaining === 0) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center text-sm text-red-700">
        Dienas limits sasniegts (0/3). Mēģiniet rīt!
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 text-center text-sm text-indigo-700">
      Atlikušas <span className="font-semibold">{remaining}</span> no 3
      bezmaksas konvertācijām šodien
    </div>
  );
}
