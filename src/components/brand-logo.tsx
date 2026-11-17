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

/**
 * Source file is 1024×512 (2:1) with white padding.
 * Boxes are a bit wider than 2:1 so object-contain scales by height and stays readable.
 */
const SIZE = {
  sm: { height: 40, width: 120, className: "h-10 w-[7.5rem]" },
  md: { height: 48, width: 150, className: "h-12 w-[9.5rem]" },
  lg: { height: 56, width: 180, className: "h-14 w-[11rem]" },
  xl: { height: 72, width: 220, className: "h-[4.5rem] w-[14rem]" },
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
        unoptimized
        className={cn(dims.className, "max-w-none object-contain object-left")}
      />
      {caption ? (
        <span className="text-[10px] font-medium leading-none text-orange-500">
          {caption}
        </span>
      ) : null}
    </span>
  );
}
