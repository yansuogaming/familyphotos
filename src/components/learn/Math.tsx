import katex from "katex";
import "katex/dist/katex.min.css";

/** TeX formula. `block` renders display math on its own line. */
export function Math({ tex, block = false, className = "" }: { tex: string; block?: boolean; className?: string }) {
  const html = katex.renderToString(tex, { displayMode: block, throwOnError: false, strict: "ignore" });
  const Tag = block ? "div" : "span";
  return <Tag className={`${block ? "my-4 overflow-x-auto" : ""} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Plain text with inline math between $...$, e.g. "Vẽ đường thẳng $ax + by = c$".
 * Lesson content from the API uses this convention.
 */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => (p.startsWith("$") && p.endsWith("$") && p.length > 2 ? <Math key={i} tex={p.slice(1, -1)} /> : p))}
    </span>
  );
}
