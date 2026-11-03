import { MessageCircle } from "lucide-react";

function toWaNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("91") && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function WhatsAppTraderLink({
  phone,
  jobTitle,
  className,
}: {
  phone?: string | null;
  jobTitle: string;
  className?: string;
}) {
  if (!phone) return null;
  const num = toWaNumber(phone);
  if (!num) return null;

  const text = encodeURIComponent(
    `Hi, I'm contacting you via BuildPro about: ${jobTitle}`
  );
  const href = `https://wa.me/${num}?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
      }
    >
      <MessageCircle className="h-3.5 w-3.5" />
      Chat on WhatsApp
    </a>
  );
}
