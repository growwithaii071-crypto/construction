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
 * Source is 1024×512 with padding — use generous width so wordmark stays readable.
 */
const SIZE = {
  sm: { height: 44, width: 140, className: "h-11 w-[8.75rem]" },
  md: { height: 52, width: 170, className: "h-[3.25rem] w-[10.5rem]" },
  lg: { height: 60, width: 200, className: "h-[3.75rem] w-[12.5rem]" },
  xl: { height: 80, width: 260, className: "h-20 w-[16rem]" },
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
