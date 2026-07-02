import { NextRequest, NextResponse } from "next/server";
import { existsSync, createReadStream, createWriteStream, promises as fs } from "fs";
import { join } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const CACHE_DIR = join('/tmp', '.video-cache');

async function fetchDriveFile(id: string, userAgent: string, confirmToken?: string, rangeHeader?: string | null): Promise<Response> {
  const url = confirmToken
    ? `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${id}`
    : `https://drive.google.com/uc?export=download&id=${id}`;

  const headers = new Headers();
  headers.set("User-Agent", userAgent);
  if (rangeHeader) {
    headers.set("Range", rangeHeader);
  }

  return fetch(url, {
    method: "GET",
    headers,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return new NextResponse("Missing file ID", { status: 400 });
  }

  try {
    // Ensure cache directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true });

    const filePath = join(CACHE_DIR, id);
    const metaPath = join(CACHE_DIR, `${id}.json`);
    const tempPath = join(CACHE_DIR, `${id}.tmp`);

    // 1. Serve from cache if available
    if (existsSync(filePath) && existsSync(metaPath)) {
      const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
      const contentType = meta.contentType || "video/mp4";
      const total = meta.contentLength;

      const headers = new Headers();
      headers.set("Content-Type", contentType);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      const rangeHeader = request.headers.get("range");
      if (rangeHeader && total) {
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
        const chunksize = end - start + 1;

        headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
        headers.set("Content-Length", chunksize.toString());

        const nodeStream = createReadStream(filePath, { start, end });
        // @ts-ignore
        const webStream = Readable.toWeb(nodeStream);

        return new NextResponse(webStream as any, {
          status: 206,
          headers,
        });
      }

      headers.set("Content-Length", total.toString());
      const nodeStream = createReadStream(filePath);
      // @ts-ignore
      const webStream = Readable.toWeb(nodeStream);

      return new NextResponse(webStream as any, {
        status: 200,
        headers,
      });
    }

    // 2. Fetch from Google Drive with range header if present
    const rangeHeader = request.headers.get("range");
    let driveResponse = await fetchDriveFile(
      id,
      request.headers.get("user-agent") || "",
      undefined,
      rangeHeader
    );

    if (!driveResponse.ok) {
      return new NextResponse(`Drive error: ${driveResponse.statusText}`, {
        status: driveResponse.status,
      });
    }

    let contentType = driveResponse.headers.get("content-type") || "video/mp4";

    // Handle Google Drive virus warning page if encountered
    if (contentType.includes("text/html")) {
      const html = await driveResponse.text();
      const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/) || html.match(/name="confirm"\s+value="([a-zA-Z0-9_-]+)"/);
      
      if (confirmMatch && confirmMatch[1]) {
        const confirmToken = confirmMatch[1];
        driveResponse = await fetchDriveFile(
          id,
          request.headers.get("user-agent") || "",
          confirmToken,
          rangeHeader
        );
        
        if (!driveResponse.ok) {
          return new NextResponse(`Drive error after confirmation: ${driveResponse.statusText}`, {
            status: driveResponse.status,
          });
        }
        
        contentType = driveResponse.headers.get("content-type") || "video/mp4";
      } else {
        console.error(
          `Google Drive proxy error for ID ${id}: Returned HTML page instead of video.`
        );
        return new NextResponse(
          "Google Drive permissions error or file not found.",
          { status: 403 }
        );
      }
    }

    const responseStream = driveResponse.body;
    if (!responseStream) {
      return new NextResponse("Empty response body from Google Drive", { status: 500 });
    }

    // Set headers to match Google Drive response
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Accept-Ranges", "bytes");

    const driveContentRange = driveResponse.headers.get("content-range");
    const driveContentLength = driveResponse.headers.get("content-length");
    if (driveContentRange) headers.set("Content-Range", driveContentRange);
    if (driveContentLength) headers.set("Content-Length", driveContentLength);

    // Trigger full caching in the background if it's not a range request or it's starting from 0
    if (!existsSync(filePath) && (!rangeHeader || rangeHeader === "bytes=0-")) {
      (async () => {
        try {
          const fullResponse = await fetchDriveFile(id, "Mozilla/5.0 Cache Worker");
          if (fullResponse.ok && fullResponse.body) {
            // @ts-ignore
            const nodeReadable = Readable.fromWeb(fullResponse.body);
            const writeStream = createWriteStream(tempPath);
            await pipeline(nodeReadable, writeStream);
            const stats = await fs.stat(tempPath);
            const contentLength = stats.size;
            await fs.writeFile(
              metaPath,
              JSON.stringify({ contentType, contentLength }),
              "utf-8"
            );
            await fs.rename(tempPath, filePath);
            console.log(`Successfully cached video ID ${id} in background.`);
          }
        } catch (err) {
          console.error(`Background caching failed for ID ${id}:`, err);
          try {
            if (existsSync(tempPath)) await fs.unlink(tempPath);
          } catch (_) {}
        }
      })();
    }

    return new NextResponse(responseStream as any, {
      status: driveResponse.status,
      headers,
    });
  } catch (error: any) {
    console.error("Google Drive proxy error:", error);
    // Clean up temp file on error
    try {
      const tempPath = join(CACHE_DIR, `${id}.tmp`);
      if (existsSync(tempPath)) {
        await fs.unlink(tempPath);
      }
    } catch (_) {}
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
