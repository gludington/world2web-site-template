import type { CollectionEntry } from "astro:content";

// Shared between the homepage (the "root level" -- depth 0, no root prefix
// at all) and every section page (pages/blogs/[world]/[...blog].astro,
// deeper levels) so there's exactly one implementation of "walk every
// blog's root path and figure out what lives at each level," not two
// independently-maintained copies.
// Deliberately no author fields here: a blog's posts can each have their
// own author (Post Settings' author override, see the Foundry module's
// collector.js), so there's no single reliable "the blog's author" to
// aggregate -- and this used to pick one arbitrarily (whichever post
// toBlogInfos() below happened to see first for a given blogUuid), which
// silently stopped being representative once that override existed.
// Author is shown per-post everywhere instead (already accurate); a blog
// itself just isn't attributed to anyone in blog-level listings.
export interface BlogInfo {
  blogUuid: string;
  world: string;
  blogSlug: string;
  blogTitle: string;
  root: string | null;
  postOrder: "newest" | "oldest" | "manual";
}

export interface SectionInfo {
  world: string;
  slug: string;
  label: string;
}

export interface SectionNode {
  label: string;
  blogs: BlogInfo[];
  childSlugs: Set<string>;
}

/** Groups a flat post list into one BlogInfo per blogUuid (posts.length
 * copies of otherwise-identical blog metadata collapse into one entry). */
export function toBlogInfos(posts: CollectionEntry<"posts">[]): BlogInfo[] {
  const byUuid = new Map<string, BlogInfo>();
  for (const post of posts) {
    if (byUuid.has(post.data.blogUuid)) continue;
    byUuid.set(post.data.blogUuid, {
      blogUuid: post.data.blogUuid,
      world: post.data.world,
      blogSlug: post.data.blogSlug,
      blogTitle: post.data.blogTitle,
      root: post.data.root,
      postOrder: post.data.postOrder,
    });
  }
  return Array.from(byUuid.values());
}

/** A blog's posts in the same order its own archive page displays them --
 * shared so that order (which drives that archive's pagination) and prev/
 * next post navigation never silently disagree with each other. Mutates
 * nothing; returns a new array. */
export function sortPostsForBlog<T extends CollectionEntry<"posts">>(posts: T[], postOrder: BlogInfo["postOrder"]): T[] {
  return [...posts].sort((a, b) => {
    if (postOrder === "oldest") return a.data.publishedAt - b.data.publishedAt;
    if (postOrder === "manual") return a.data.sortIndex - b.data.sortIndex;
    return b.data.publishedAt - a.data.publishedAt;
  });
}

/** Builds, per world, a map of every root-prefix slug -> {label, blogs,
 * childSlugs}, by walking every blog's root path. A blog with no root at
 * all contributes nothing here (it belongs at the root/depth-0 level,
 * which this map doesn't represent -- callers handle that case directly by
 * filtering for `root === null`). Label is first-seen-wins if two blogs
 * disagree on a segment's spelling/casing. */
export function buildSectionTree(blogs: BlogInfo[]): Map<string, Map<string, SectionNode>> {
  const sectionsByWorld = new Map<string, Map<string, SectionNode>>();

  for (const blog of blogs) {
    if (!blog.root) continue;
    const labels = blog.root
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);
    if (labels.length === 0) continue;
    const slugParts = blog.blogSlug.split("/").slice(0, labels.length);

    if (!sectionsByWorld.has(blog.world)) sectionsByWorld.set(blog.world, new Map());
    const sections = sectionsByWorld.get(blog.world)!;

    for (let depth = 1; depth <= labels.length; depth++) {
      const prefixSlug = slugParts.slice(0, depth).join("/");
      if (!sections.has(prefixSlug)) {
        sections.set(prefixSlug, { label: labels[depth - 1], blogs: [], childSlugs: new Set() });
      }
      if (depth === labels.length) {
        sections.get(prefixSlug)!.blogs.push(blog);
      } else {
        sections.get(prefixSlug)!.childSlugs.add(slugParts.slice(0, depth + 1).join("/"));
      }
    }
  }

  return sectionsByWorld;
}

/** The top-level (depth-1) sections across every world -- what the
 * "sections one level down" widget shows on the homepage, i.e. the root
 * level's own children. */
export function topLevelSections(sectionsByWorld: Map<string, Map<string, SectionNode>>): SectionInfo[] {
  const result: SectionInfo[] = [];
  for (const [world, sections] of sectionsByWorld) {
    for (const [slug, info] of sections) {
      if (!slug.includes("/")) result.push({ world, slug, label: info.label });
    }
  }
  return result;
}

export interface BlogWithSubPath {
  blog: BlogInfo;
  /** Labels of the sections between the queried level and this blog --
   * empty when the blog sits directly at the queried level. E.g. querying
   * "pcs" for a blog rooted at "PCs/Act 1" yields subPath: ["Act 1"]. */
  subPath: string[];
}

/** Every blog at the given section prefix *or in any section beneath it*,
 * recursively -- unlike a section's own `blogs` (exact level only), this
 * is what actually answers "what's in this category, including
 * sub-categories," which is usually the more useful view on a section
 * page: a section with real nesting (e.g. "PCs" containing "PCs/Act 1",
 * "PCs/Act 2") often has few or no blogs directly on it, with everything
 * actually living one or more levels deeper. */
export function blogsInSubtree(sections: Map<string, SectionNode>, prefixSlug: string): BlogWithSubPath[] {
  const node = sections.get(prefixSlug);
  if (!node) return [];

  const direct: BlogWithSubPath[] = node.blogs.map((blog) => ({ blog, subPath: [] }));
  const nested: BlogWithSubPath[] = Array.from(node.childSlugs).flatMap((childSlug) => {
    const childLabel = sections.get(childSlug)?.label ?? childSlug.split("/").pop()!;
    return blogsInSubtree(sections, childSlug).map(({ blog, subPath }) => ({
      blog,
      subPath: [childLabel, ...subPath],
    }));
  });
  return [...direct, ...nested];
}
