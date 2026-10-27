import { watch } from "node:fs";
import path from "node:path";
import { build, root } from "./build.mjs";
import { startServer } from "./server.mjs";

await build();
const server = startServer();
let timer,
  running = false,
  pending = false;
async function rebuild() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  try {
    await build();
    console.log("Updated. Refresh your browser to see the changes.");
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
  } finally {
    running = false;
    if (pending) {
      pending = false;
      await rebuild();
    }
  }
}
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 250);
}
const watchers = [
  watch(root, (_, name) => {
    if (["styles.css", "hero.css", "app.js"].includes(String(name))) schedule();
  }),
  watch(path.join(root, "assets"), { recursive: true }, schedule),
  watch(path.join(root, "src"), { recursive: true }, schedule),
];
function stop() {
  clearTimeout(timer);
  watchers.forEach((watcher) => watcher.close());
  server.close();
}
process.on("SIGINT", () => {
  stop();
  process.exit();
});
process.on("SIGTERM", () => {
  stop();
  process.exit();
});
