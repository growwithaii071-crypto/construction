import Image from "next/image";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "HomeCreww";
export const BRAND_TAGLINE = "Your Home. Our Crew.";
export const BRAND_LOGO_SRC = "/images/homecreww-logo.jpg";

type BrandLogoProps = {
  /** Visual size preset */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Extra label under the logo (e.g. portal name) */
  caption?: string;
  priority?: boolean;
};

const SIZE = {
  sm: { height: 28, width: 120, className: "h-7 w-auto" },
  md: { height: 36, width: 154, className: "h-9 w-auto" },
  lg: { height: 48, width: 206, className: "h-12 w-auto" },
  xl: { height: 72, width: 308, className: "h-[4.5rem] w-auto" },
} as const;

/** HomeCreww wordmark — use in headers, sidebars, auth, and footers. */
export function BrandLogo({
  size = "md",
  className,
  caption,
  priority = false,
}: BrandLogoProps) {
  const dims = SIZE[size];

  return (
    <span className={cn("inline-flex flex-col items-start gap-0.5", className)}>
      <Image
        src={BRAND_LOGO_SRC}
        alt={BRAND_NAME}
        width={dims.width}
        height={dims.height}
        priority={priority}
        className={cn(dims.className, "object-contain object-left")}
      />
      {caption ? (
        <span className="text-[10px] font-medium leading-none text-orange-500">
          {caption}
        </span>
      ) : null}
    </span>
  );
}
