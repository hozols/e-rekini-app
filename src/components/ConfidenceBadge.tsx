"use client";

interface ConfidenceBadgeProps {
  score: number;
}

export default function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const getColor = () => {
    if (score >= 90) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    if (score >= 80) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  };

  const getLabel = () => {
    if (score >= 90) return "Augsta precizitāte";
    if (score >= 80) return "Vidēja precizitāte";
    return "Zema precizitāte";
  };

  const colors = getColor();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          score >= 90
            ? "bg-emerald-500"
            : score >= 80
            ? "bg-amber-500"
            : "bg-red-500"
        }`}
      />
      {getLabel()} — {score}%
    </span>
  );
}
