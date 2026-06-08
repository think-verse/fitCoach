import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "physique-photos";

/**
 * Remove every photo a user has uploaded.
 *
 * Folder layout in the bucket is:
 *     <userId>/w0/front-….jpg
 *     <userId>/w0/side-….jpg
 *     <userId>/w1/back-….jpg
 *     ...
 *
 * Supabase storage `.list()` only returns one directory level at a time —
 * we walk every week-folder under the user's prefix and batch-delete all
 * paths in one `.remove()` call.
 */
export async function deleteAllUserPhotos(
  service: SupabaseClient,
  userId: string,
): Promise<{ deleted: number }> {
  const allPaths: string[] = [];

  const { data: topLevel } = await service.storage
    .from(BUCKET)
    .list(userId, { limit: 200, sortBy: { column: "name", order: "asc" } });

  if (!topLevel) return { deleted: 0 };

  for (const item of topLevel) {
    // Supabase marks folders by having no metadata block.
    if (!item.metadata) {
      const subPath = `${userId}/${item.name}`;
      const { data: files } = await service.storage
        .from(BUCKET)
        .list(subPath, { limit: 200 });
      if (files) {
        for (const f of files) {
          if (f.metadata) allPaths.push(`${subPath}/${f.name}`);
        }
      }
    } else {
      // Lone file at the root of the user's folder.
      allPaths.push(`${userId}/${item.name}`);
    }
  }

  if (allPaths.length === 0) return { deleted: 0 };

  const { error } = await service.storage.from(BUCKET).remove(allPaths);
  if (error) throw error;
  return { deleted: allPaths.length };
}
