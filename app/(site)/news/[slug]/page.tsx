import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/site/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { breadcrumbSchema, newsArticleSchema } from "@/lib/schema";
import { pageMetadata, privateMetadata } from "@/lib/seo";
import { getPublishedPost, listPublishedNews, postTags } from "@/lib/services/news";
import { formatDate } from "@/lib/utils/format";
import { markdownToText, renderMarkdown } from "@/lib/utils/markdown";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  // An unknown slug renders the 404 below; keeping it out of the index means a
  // mistyped link cannot become a crawlable dead page.
  if (!post) return privateMetadata("Post not found");

  // A description is required for the social card, so fall back to the opening
  // of the body when an editor left the excerpt empty. Trimmed to roughly the
  // length search engines actually display.
  const description = post.excerpt || markdownToText(post.body).slice(0, 200).trimEnd();

  return pageMetadata({
    title: post.title,
    description,
    path: `/news/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function NewsPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  // A draft or a bad slug are indistinguishable from outside, by design.
  if (!post) notFound();

  const tags = postTags(post);
  const others = (await listPublishedNews(4)).filter((candidate) => candidate.slug !== post.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          newsArticleSchema({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            authorName: post.author?.displayName ?? null,
          }),
          breadcrumbSchema([
            { name: "News", path: "/news" },
            { name: post.title, path: `/news/${post.slug}` },
          ]),
        ]}
      />

      <section className="on-dark relative overflow-hidden bg-navy-900">
        <div className="c-grid-texture absolute inset-0" aria-hidden="true" />
        <div className="c-diagonal -right-24 top-[-30%] h-[180%] w-6 opacity-90" aria-hidden="true" />
        <div className="c-diagonal -right-2 top-[-30%] h-[180%] w-2 opacity-60" aria-hidden="true" />

        <div className="u-container relative pb-24 pt-[calc(var(--header-height)+80px)] md:pb-32 md:pt-[calc(var(--header-height)+120px)]">
          <div className="max-w-4xl">
            <Link
              href="/news"
              className="inline-block border-b-2 border-signal pb-1 font-display text-xs font-bold uppercase tracking-[0.16em] text-signal hover:bg-signal hover:text-ink"
            >
              ← All news
            </Link>
            <div className="mt-10 flex flex-wrap items-center gap-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
              {post.author ? (
                <>
                  <span className="h-3 w-0.5 bg-signal" aria-hidden="true" />
                  <span>{post.author.displayName}</span>
                </>
              ) : null}
            </div>
            <h1 className="t-h1 mt-8 text-white">{post.title}</h1>
            {post.excerpt ? <p className="t-body-lg mt-10 max-w-2xl text-white/70">{post.excerpt}</p> : null}
          </div>
        </div>

        <div className="c-rule-signal absolute inset-x-0 bottom-0" aria-hidden="true" />
      </section>

      <Section tone="raised">
        <div className="max-w-3xl">
          {/* Body is rendered from a restricted Markdown subset — see lib/utils/markdown.ts. */}
          <article className="prose-news" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />

          {tags.length > 0 ? (
            <ul className="mt-16 flex flex-wrap gap-2 border-t-2 border-rule pt-8">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="border-2 border-rule-faint px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink/70"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Section>

      {others.length > 0 ? (
        <Section tone="paper">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="t-h2 text-ink">More from the team</h2>
            <ButtonLink href="/news" variant="outline">
              All announcements
            </ButtonLink>
          </div>
          <ul className="mt-12 grid gap-px border-2 border-rule bg-rule sm:grid-cols-3">
            {others.map((other) => (
              <li key={other.id} className="bg-paper-raised">
                <Link href={`/news/${other.slug}`} className="group flex h-full flex-col p-8 hover:bg-paper-sunk">
                  <time className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink/55">
                    {formatDate(other.publishedAt)}
                  </time>
                  <span className="t-h3 mt-5 text-ink">{other.title}</span>
                  <span className="mt-auto pt-8 font-display text-xs font-bold uppercase tracking-[0.16em] text-navy-600">
                    Read →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
