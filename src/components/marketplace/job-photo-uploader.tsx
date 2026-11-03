"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

export function JobPhotoUploader({
  name = "photos",
  max = 6,
}: {
  name?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const room = max - urls.length;
    const batch = Array.from(files).slice(0, room);
    if (!batch.length) {
      setError(`Max ${max} photos.`);
      return;
    }

    setUploading(true);
    const next = [...urls];
    try {
      for (const file of batch) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/upload/job-photo", { method: "POST", body: fd });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setError(data.error ?? "Upload failed");
          break;
        }
        next.push(data.url);
      }
      setUrls(next);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={urls.join("\n")} />
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setUrls((u) => u.filter((x) => x !== url))}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {urls.length < max && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px] font-semibold">Add</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
      <p className="text-[11px] text-slate-400">
        Up to {max} photos · JPG/PNG/WebP · max 5 MB each
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
