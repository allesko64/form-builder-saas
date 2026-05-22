import { db, eq } from "@repo/database";
import { formsTable } from "@repo/database/schema";
import type { Redis } from "ioredis";

import type { PublicForm } from "./model";

export const PUBLIC_FORM_CACHE_TTL_SECONDS = 60;

export function formSlugCacheKey(slug: string): string {
  return `form:slug:${slug}`;
}

export function formIdCacheKey(id: string): string {
  return `form:id:${id}`;
}

function revivePublicForm(raw: PublicForm): PublicForm {
  return {
    ...raw,
    fields: raw.fields.map((field) => ({
      ...field,
      createdAt: new Date(field.createdAt),
      updatedAt: new Date(field.updatedAt),
    })),
  };
}

export async function getCachedPublicForm(redis: Redis, key: string): Promise<PublicForm | null> {
  const cached = await redis.get(key);
  if (!cached) {
    return null;
  }

  try {
    return revivePublicForm(JSON.parse(cached) as PublicForm);
  } catch {
    await redis.del(key);
    return null;
  }
}

export async function setCachedPublicForm(redis: Redis, form: PublicForm): Promise<void> {
  const payload = JSON.stringify(form);
  await redis.setex(formSlugCacheKey(form.slug), PUBLIC_FORM_CACHE_TTL_SECONDS, payload);
  await redis.setex(formIdCacheKey(form.id), PUBLIC_FORM_CACHE_TTL_SECONDS, payload);
}

export async function invalidatePublicFormCache(
  redis: Redis | null,
  formId: string,
  slug?: string,
): Promise<void> {
  if (!redis) {
    return;
  }

  let resolvedSlug = slug;

  if (!resolvedSlug) {
    const [row] = await db
      .select({ slug: formsTable.slug })
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    resolvedSlug = row?.slug;
  }

  const keys = [formIdCacheKey(formId)];
  if (resolvedSlug) {
    keys.push(formSlugCacheKey(resolvedSlug));
  }

  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
