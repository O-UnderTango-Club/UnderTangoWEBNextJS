const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const catalog = require("../../app/860-multiversos/scene-videos.json");
const { SHOW_SCORE } = require("../../app/860-multiversos/show-score.ts");

const folder = path.resolve(process.argv[2] || "G:/00 - Inicio/860");
const write = process.argv.includes("--escribir");
const extensions = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi", ".mpg", ".mpeg", ".wmv", ".mts", ".m2ts", ".mxf", ".ogv", ".3gp", ".ts"]);
const scores = new Map(SHOW_SCORE.map(row => [row.number, row]));
const header = "860 MULTIVERSOS · REGISTRO DE CLIPS DEL PILOTO LOCAL";
const footer = "FIN DEL REGISTRO DE CLIPS DE 860";

async function listVideos(dir) {
  const found = [];
  for (const item of await fs.promises.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) found.push(...await listVideos(file));
    else if (item.isFile() && extensions.has(path.extname(file).toLowerCase())) found.push(file);
  }
  return found.sort((a, b) => a.localeCompare(b, "es"));
}

async function identify(file) {
  const hash = createHash("sha256");
  for await (const bytes of fs.createReadStream(file)) hash.update(bytes);
  return hash.digest("hex");
}

async function main() {
  const originals = new Map();
  for (const file of await listVideos(folder)) {
    const hash = await identify(file);
    const paths = originals.get(hash) || [];
    paths.push(path.relative(folder, file));
    originals.set(hash, paths);
  }

  const seen = new Set();
  const rows = [header, "", "Carpeta de originales", folder, "",
    "Las posiciones se cuentan desde la entrada de cada escena. Los clips entran visibles y con su audio silenciado.", ""];
  for (const clip of catalog) {
    const locations = originals.get(clip.sha256) || [];
    rows.push(clip.title, "Original registrado · " + clip.source);
    if (!locations.length) rows.push("Ubicación · el original registrado ya no coincide con el material de esta carpeta. El piloto conserva su copia.");
    else for (const location of locations.filter(name => name !== clip.source)) rows.push("También localizado en · " + location);
    rows.push("Imagen · " + clip.image,
      "Formato del original · " + clip.width + " × " + clip.height + " · " + clip.seconds + " s",
      "Audio del original · " + (clip.audio || "Sin pista de audio"));
    for (const use of clip.uses) {
      const scene = scores.get(use.scene);
      if (!scene || seen.has(use.scene)) throw Error("Revisá la asignación de la escena " + use.scene);
      seen.add(use.scene);
      rows.push("Escena " + scene.number + " · " + scene.title,
        "Uso · Desde 0 s de la escena hasta la salida. Tramo del original de 0 a " + clip.seconds + " s. " +
          (use.loop ? "Se repite desde el inicio." : "Una pasada. Si la escena dura más, sostiene el último fotograma."),
        "Criterio · " + use.reason);
    }
    rows.push("Huella SHA-256 · " + clip.sha256, "");
    originals.delete(clip.sha256);
  }

  rows.push("MATERIAL POR REVISAR");
  for (const [hash, paths] of originals) rows.push(paths.join(" / ") + " · " + hash);
  if (!originals.size) rows.push("Todos los videos encontrados tienen una asignación.");
  rows.push("", footer);
  const report = rows.join("\r\n");
  if (write) {
    const target = path.join(folder, "Registro de clips de 860.txt");
    const previous = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    const start = previous.indexOf(header), end = previous.indexOf(footer, start);
    // Keep any notes the operator has added outside the generated inventory.
    const next = start >= 0 && end >= start
      ? previous.slice(0, start) + report + previous.slice(end + footer.length)
      : (previous ? previous.trimEnd() + "\r\n\r\n" : "") + report + "\r\n";
    if (next !== previous) fs.writeFileSync(target, next, "utf8");
    console.log(target);
  }
  console.log(catalog.length + " clips en el piloto · " + originals.size + " materiales nuevos o modificados");
  for (const paths of originals.values()) console.log("Por revisar · " + paths.join(" / "));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
