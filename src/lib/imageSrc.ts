import { getImageProps, type StaticImageData } from "next/image";

/**
 * The optimised URL for a static image, as a plain string.
 *
 * The exploded assembly paints one decoded bitmap into every band through
 * `background-image`, which is the only way to slice a screen without
 * decoding it N times — but a CSS background cannot go through `next/image`.
 * `getImageProps` gives us the same optimised, correctly sized URL the
 * component would have used, so nothing is given up for it.
 *
 * Server only: call it in a page or section and hand the string to the client.
 */
export function optimizedSrc(image: StaticImageData, width: number, quality = 88): string {
  const { props } = getImageProps({
    src: image,
    alt: "",
    width,
    height: Math.round((width / image.width) * image.height),
    quality,
  });
  return props.src;
}
