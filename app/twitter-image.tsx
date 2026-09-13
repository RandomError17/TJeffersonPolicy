/**
 * Twitter/X uses the same card as Open Graph.
 *
 * Next does not fall back from `twitter-image` to `opengraph-image`, so the
 * generator is re-exported here rather than duplicated — one drawing, two
 * routes.
 */
export { default, alt, size, contentType } from "./opengraph-image";
