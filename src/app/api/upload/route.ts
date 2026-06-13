import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { requireUser } from "@/lib/firebase/auth";
import { adminBucket } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/**
 * Server-side photo upload. The browser POSTs the image here; we verify the
 * session cookie, then write to Storage via the Admin SDK (bypasses client
 * Storage rules). The folder uid comes from the VERIFIED session — never the
 * client — so a user can only ever write to their own folder.
 */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  const angle = String(form.get("angle") ?? "photo").replace(/[^a-z0-9_-]/gi, "");
  const weekNumber = Number(form.get("weekNumber") ?? 0) || 0;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  // Accept generous raw input (phone photos / DSLR) — we compress before store.
  if (file.size > 30 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 30 MB per photo" }, { status: 413 });
  }

  // Always store COMPRESSED — resize to max 1600px long edge, re-encode JPEG.
  // Keeps Storage small and guarantees Claude stays under its 10 MB image cap.
  let compressed: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    compressed = await sharp(input)
      .rotate() // honor EXIF orientation
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch (e) {
    console.error("[/api/upload] compression failed:", e);
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  const path = `users/${user.id}/photos/w${weekNumber}/${angle}-${Date.now()}.jpg`;
  try {
    await adminBucket()
      .file(path)
      .save(compressed, {
        contentType: "image/jpeg",
        metadata: { cacheControl: "private,max-age=3600" },
      });
  } catch (e) {
    console.error("[/api/upload] save failed:", e);
    return NextResponse.json({ error: "Storage write failed" }, { status: 500 });
  }

  return NextResponse.json({
    storagePath: path,
    bytes: compressed.length,
  });
}
