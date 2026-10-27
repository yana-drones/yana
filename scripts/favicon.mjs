import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

// Resize the actual supplied artwork; no replacement or generated logo is used.
export async function writeFavicons(source, output) {
  const artwork = await sharp(source)
    .trim({ background: "#ffffff", threshold: 12 })
    .toBuffer();
  const sizes = [16, 32, 48];
  const images = await Promise.all(
    sizes.map((size) =>
      sharp(artwork)
        .resize(size, size, { fit: "contain", background: "#ffffff" })
        .png()
        .toBuffer(),
    ),
  );
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index];
    header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  await writeFile(
    path.join(output, "favicon.ico"),
    Buffer.concat([header, ...images]),
  );
  await writeFile(path.join(output, "favicon-32.png"), images[1]);
  await sharp(artwork)
    .resize(180, 180, { fit: "contain", background: "#ffffff" })
    .png()
    .toFile(path.join(output, "apple-touch-icon.png"));
}
