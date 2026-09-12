import { getCollection, type CollectionEntry } from "astro:content";

/** Every published post -- excludes soft-deleted ("unpublished") entries.
 * Foundry has no way to delete an already-pushed file from GitHub
 * (github.js's putFile only ever creates or updates), so unpublishing a
 * previously-published post instead stamps `unpublished: true` on that
 * post's own frontmatter (a tombstone, still in git history) rather than
 * removing the file. Every page on this site must query posts through
 * here, never `getCollection("posts")` directly, or a tombstoned post
 * will still render. */
export async function getPublishedPosts(): Promise<CollectionEntry<"posts">[]> {
  return getCollection("posts", (entry) => !entry.data.unpublished);
}
