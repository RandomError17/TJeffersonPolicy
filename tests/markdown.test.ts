import { describe, expect, it } from "vitest";
import { markdownToText, renderMarkdown } from "@/lib/utils/markdown";

/**
 * News bodies are officer-authored but still untrusted input: an officer
 * account could be compromised, and a paste from elsewhere can carry markup.
 * These tests pin the escaping behaviour that keeps stored XSS off the public
 * site.
 */
describe("renderMarkdown — escaping", () => {
  it("escapes raw HTML instead of rendering it", () => {
    const html = renderMarkdown('<script>alert("xss")</script>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes inline event-handler attributes", () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("drops javascript: links but keeps the visible text", () => {
    const html = renderMarkdown("[click me](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a ");
    expect(html).toContain("click me");
  });

  it("drops data: links", () => {
    const html = renderMarkdown("[x](data:text/html;base64,PHNjcmlwdD4=)");
    expect(html).not.toContain("data:");
    expect(html).not.toContain("<a ");
  });

  it("keeps http, https, mailto, and root-relative links", () => {
    expect(renderMarkdown("[a](https://tabroom.com)")).toContain('href="https://tabroom.com"');
    expect(renderMarkdown("[b](http://example.com)")).toContain('href="http://example.com"');
    expect(renderMarkdown("[c](mailto:team@example.com)")).toContain('href="mailto:team@example.com"');
    expect(renderMarkdown("[d](/news)")).toContain('href="/news"');
  });

  it("marks external links noopener noreferrer", () => {
    const html = renderMarkdown("[a](https://example.com)");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it("does not add target/rel to internal links", () => {
    const html = renderMarkdown("[a](/about)");
    expect(html).not.toContain("target=");
  });

  it("rejects protocol-relative links, which could leave the site silently", () => {
    const html = renderMarkdown("[a](//evil.example/x)");
    expect(html).not.toContain("<a ");
  });
});

describe("renderMarkdown — formatting", () => {
  it("renders headings starting at h2 so the page h1 stays unique", () => {
    expect(renderMarkdown("# Title")).toContain("<h2>Title</h2>");
    expect(renderMarkdown("## Sub")).toContain("<h3>Sub</h3>");
    expect(renderMarkdown("### Small")).toContain("<h4>Small</h4>");
  });

  it("renders bullet and numbered lists", () => {
    expect(renderMarkdown("- one\n- two")).toContain("<ul>\n<li>one</li>\n<li>two</li>\n</ul>");
    expect(renderMarkdown("1. one\n2. two")).toContain("<ol>");
  });

  it("renders bold, italic, and inline code", () => {
    expect(renderMarkdown("**b**")).toContain("<strong>b</strong>");
    expect(renderMarkdown("*i*")).toContain("<em>i</em>");
    expect(renderMarkdown("`c`")).toContain("<code>c</code>");
  });

  it("renders blockquotes and horizontal rules", () => {
    expect(renderMarkdown("> quoted")).toContain("<blockquote>");
    expect(renderMarkdown("---")).toContain("<hr />");
  });

  it("groups consecutive lines into one paragraph and splits on blank lines", () => {
    const html = renderMarkdown("line one\nline two\n\nsecond para");
    expect(html).toContain("<p>line one line two</p>");
    expect(html).toContain("<p>second para</p>");
  });

  it("handles an empty body without throwing", () => {
    expect(renderMarkdown("")).toBe("");
  });
});

describe("markdownToText", () => {
  it("strips markup and truncates with an ellipsis", () => {
    expect(markdownToText("**Bold** and [a link](https://x.com)")).toBe("Bold and a link");
    expect(markdownToText("a".repeat(300), 20)).toHaveLength(20);
  });
});
