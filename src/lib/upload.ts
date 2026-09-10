import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function hasCloudinary() {
  return !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export type UploadedFile = {
  url: string;
  name: string;
  mime: string;
  size: number;
};

export function validateMessageFile(file: File): string | null {
  if (!file || file.size === 0) return "Empty file.";
  if (file.size > MAX_BYTES) return "File must be under 5 MB.";
  if (!ALLOWED_MIME.has(file.type)) {
    return "Only images, PDF, Word, Excel or text files are allowed.";
  }
  return null;
}

async function uploadToCloudinary(file: File, folder: string): Promise<UploadedFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: `${Date.now()}-${randomUUID().slice(0, 8)}`,
      },
      (err, res) => {
        if (err || !res) reject(err ?? new Error("Cloudinary upload failed"));
        else resolve(res);
      }
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    name: file.name,
    mime: file.type,
    size: file.size,
  };
}

async function uploadLocally(file: File, folder: string): Promise<UploadedFile> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return {
    url: `/uploads/${folder}/${filename}`,
    name: file.name,
    mime: file.type,
    size: file.size,
  };
}

export async function uploadMessageAttachment(
  file: File,
  requestId: string
): Promise<{ success: true; file: UploadedFile } | { success: false; message: string }> {
  const invalid = validateMessageFile(file);
  if (invalid) return { success: false, message: invalid };

  try {
    const folder = `messages/${requestId}`;
    const uploaded = hasCloudinary()
      ? await uploadToCloudinary(file, `buildpro/${folder}`)
      : await uploadLocally(file, folder);
    return { success: true, file: uploaded };
  } catch (err) {
    console.error("[UPLOAD_MESSAGE]", err);
    // Fallback to local if cloudinary fails
    try {
      const uploaded = await uploadLocally(file, `messages/${requestId}`);
      return { success: true, file: uploaded };
    } catch (localErr) {
      console.error("[UPLOAD_LOCAL]", localErr);
      return { success: false, message: "Failed to upload file. Please try again." };
    }
  }
}
