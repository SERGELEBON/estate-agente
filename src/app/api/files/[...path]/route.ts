import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const UPLOAD_DIR = "/home/z/my-project/public/uploads";

// GET /api/files/[...path] - Serve uploaded files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;
    const filePath = path.join(UPLOAD_DIR, ...pathParts);

    // Security: ensure the resolved path is within the upload directory
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fileStat = await stat(resolved);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 404 });
    }

    const data = await readFile(resolved);

    // Determine content type based on extension
    const ext = path.extname(resolved).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".pdf": "application/pdf",
    };
    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
