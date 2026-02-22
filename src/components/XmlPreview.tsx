"use client";

import { useMemo } from "react";

interface XmlPreviewProps {
  xml: string;
}

export default function XmlPreview({ xml }: XmlPreviewProps) {
  const highlighted = useMemo(() => {
    // Escape HTML entities for display, then apply syntax highlighting
    const escaped = xml
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    return escaped
      // XML declaration
      .replace(
        /(&lt;\?xml.*?\?&gt;)/g,
        '<span class="declaration">$1</span>'
      )
      // Attribute values
      .replace(
        /([\w:]+)(=)(&quot;)(.*?)(&quot;)/g,
        '<span class="attr-name">$1</span>$2<span class="attr-value">$3$4$5</span>'
      )
      // Self-closing and closing tags
      .replace(
        /(&lt;\/?)([\w:]+)/g,
        '$1<span class="tag">$2</span>'
      );
  }, [xml]);

  return (
    <div className="overflow-auto max-h-[calc(100vh-14rem)] bg-slate-950 rounded-xl">
      <pre className="xml-highlight p-4 text-slate-300 whitespace-pre-wrap break-all">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
