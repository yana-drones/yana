import http from "node:http";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const types = {
  ".ico": "image/x-icon",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".vtt": "text/vtt; charset=utf-8",
  ".woff2": "font/woff2",
};
export function startServer(port = Number(process.env.PORT || 4173)) {
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      const pathname = decodeURIComponent(url.pathname);
      const file = path.resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!file.startsWith(root + path.sep)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }
      const info = await stat(file);
      if (!info.isFile()) throw new Error("Not a file");
      const headers = {
        "Content-Type":
          types[path.extname(file).toLowerCase()] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      };
      const range = request.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        const suffix = match && !match[1];
        const start = match
          ? suffix
            ? Math.max(0, info.size - Number(match[2]))
            : Number(match[1])
          : -1;
        const end = match
          ? suffix || !match[2]
            ? info.size - 1
            : Math.min(Number(match[2]), info.size - 1)
          : -1;
        if (start < 0 || start > end || start >= info.size) {
          response.writeHead(416, { "Content-Range": `bytes */${info.size}` });
          response.end();
          return;
        }
        response.writeHead(206, {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${info.size}`,
          "Content-Length": end - start + 1,
        });
        if (request.method === "HEAD") response.end();
        else
          createReadStream(file, { start, end })
            .on("error", () => response.destroy())
            .pipe(response);
      } else {
        response.writeHead(200, { ...headers, "Content-Length": info.size });
        if (request.method === "HEAD") response.end();
        else
          createReadStream(file)
            .on("error", () => response.destroy())
            .pipe(response);
      }
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`YANA is ready at http://localhost:${port}`),
  );
  return server;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  startServer();
