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
  sm: { height: 36, width: 120 },
  md: { height: 44, width: 148 },
  lg: { height: 52, width: 176 },
  xl: { height: 64, width: 220 },
} as const;

/** HomeCreww wordmark — constrained box so the JPG never blows layout. */
export function BrandLogo({
  size = "md",
  className,
  caption,
  priority = false,
}: BrandLogoProps) {
  const dims = SIZE[size];

  return (
    <span className={cn("inline-flex flex-col items-start gap-0.5", className)}>
      <span
        className="relative block overflow-hidden"
        style={{ width: dims.width, height: dims.height }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO_SRC}
          alt={BRAND_NAME}
          width={dims.width}
          height={dims.height}
          decoding="async"
          {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
          className="block h-full w-full object-contain object-left"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      </span>
      {caption ? (
        <span className="text-[10px] font-medium leading-none text-orange-500">
          {caption}
        </span>
      ) : null}
    </span>
  );
}
