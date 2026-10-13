import NextImage, { type ImageProps } from "next/image";
import { canOptimizeImage } from "@/lib/image-hosts";

/** next/image that also accepts any pasted URL: unknown hosts skip the optimiser. */
export default function Image(props: ImageProps) {
  return <NextImage {...props} unoptimized={props.unoptimized ?? !canOptimizeImage(props.src)} />;
}
