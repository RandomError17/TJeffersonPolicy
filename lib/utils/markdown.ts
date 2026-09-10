/**
 * Minimal, deliberately restrictive Markdown renderer for news bodies.
 *
 * Officer-authored content is still user input, so this escapes the source
 * first and only then re-introduces a fixed set of tags. There is no raw-HTML
 * passthrough and no way to emit an attribute other than a vetted href, which
 * is what keeps stored XSS out of the public site without pulling in a
 * sanitiser dependency.
 *
 * Supported: # / ## / ### headings, - and 1. lists, > quotes, **bold**,
 * *italic*, `code`, [text](https-or-mailto-link), paragraphs, --- rules.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (/^(https?:|mailto:)/i.test(value)) return value.replace(/["'\s<>]/g, "");
  if (value.startsWith("/") && !value.startsWith("//")) return value.replace(/["'\s<>]/g, "");
  return null;
}

/** Inline spans. Input must already be HTML-escaped. */
function renderInline(escaped: string): string {
  let out = escaped;

  // Links first, so their text cannot be re-parsed into another link.
  out = out.replace(/\[([^\]]{1,200})\]\(([^)\s]{1,500})\)/g, (match, text: string, href: string) => {
    const url = safeHref(href);
    if (!url) return text;
    const external = /^https?:/i.test(url);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${url}"${attrs}>${text}</a>`;
  });

  out = out.replace(/`([^`]{1,200})`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]{1,300})\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]{1,300})\*/g, "$1<em>$2</em>");
  return out;
}

export function renderMarkdown(source: string): string {
  const lines = escapeHtml(source.replace(/\r\n/g, "\n")).split("\n");
  const html: string[] = [];

  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];
  let quote: string[] = [];

  const closeParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };
  const closeQuote = () => {
    if (quote.length) {
      html.push(`<blockquote><p>${renderInline(quote.join(" "))}</p></blockquote>`);
      quote = [];
    }
  };
  const closeAll = () => {
    closeParagraph();
    closeList();
    closeQuote();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeAll();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      closeAll();
      const level = heading[1].length + 1; // h1 is reserved for the page title
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      closeAll();
      html.push("<hr />");
      continue;
    }

    // The source is escaped before this loop runs, so a blockquote marker
    // arrives here as "&gt;", not ">".
    const quoted = /^&gt;\s?(.*)$/.exec(trimmed);
    if (quoted) {
      closeParagraph();
      closeList();
      quote.push(quoted[1]);
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (bullet || numbered) {
      closeParagraph();
      closeQuote();
      const wanted = bullet ? "ul" : "ol";
      if (listType !== wanted) {
        closeList();
        listType = wanted;
        html.push(`<${wanted}>`);
      }
      html.push(`<li>${renderInline((bullet ?? numbered)![1])}</li>`);
      continue;
    }

    closeList();
    closeQuote();
    paragraph.push(trimmed);
  }

  closeAll();
  return html.join("\n");
}

/** Plain-text preview, e.g. for meta descriptions. */
export function markdownToText(source: string, maxLength = 200): string {
  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`_]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
