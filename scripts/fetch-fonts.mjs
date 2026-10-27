// Optional maintenance helper. Fonts are checked in; normal builds need no network.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const directory = new URL("../fonts/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const [family, slug, weights] of [
  ["DM Sans", "dmsans", "400..700"],
  ["Manrope", "manrope", "400..800"],
]) {
  const response = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}:wght@${weights}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
    },
  );
  if (!response.ok) throw new Error(`Font request failed: ${response.status}`);
  const css = await response.text();
  const block = css.split("/* latin */").at(-1);
  const url = /url\((https:\/\/[^)]+)\)/.exec(block)?.[1];
  if (!url) throw new Error(`No font URL found for ${family}`);
  const font = await fetch(url);
  if (!font.ok) throw new Error(`Font download failed: ${font.status}`);
  await writeFile(
    new URL(`${slug}-latin.woff2`, directory),
    Buffer.from(await font.arrayBuffer()),
  );
  const license = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${slug}/OFL.txt`,
  );
  if (!license.ok) throw new Error(`License request failed: ${license.status}`);
  await writeFile(new URL(`${slug}-OFL.txt`, directory), await license.text());
  console.log(
    `Saved ${family} font and license in ${fileURLToPath(directory)}`,
  );
}
