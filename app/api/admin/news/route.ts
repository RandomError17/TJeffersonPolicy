import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { saveNewsPost } from "@/lib/services/news";
import { newsPostSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const input = await readJson(request, newsPostSchema);

  const post = await saveNewsPost({ ...input, authorId: actor.id });

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.NEWS_SAVED,
    targetType: "news",
    targetId: post.id,
    summary: `${actor.displayName} created the post "${post.title}" (${post.status.toLowerCase()})`,
    metadata: { status: post.status },
  });

  return jsonOk({ id: post.id, slug: post.slug, status: post.status }, 201);
});
