const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { zipSync } = require("fflate");

const root = path.resolve(__dirname, "../..");
const destination = path.join(root, "public/860-multiversos");
const zipName = "860-Multiversos.zip";
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "860-materiales-"));
const score = path.join(temp, "partitura.html");
const mediaList = path.join(temp, "medios.json");
const partial = path.join(destination, "." + process.pid + ".zip.tmp");

try {
  execFileSync(process.execPath, [path.join(__dirname, "build.cjs"), "--publico", score, "", mediaList]);
  const guide = fs.readFileSync(path.join(destination, "materiales.html"), "utf8")
    .replace('href="./860-Multiversos.zip"', 'href="https://www.undertangoclub.com/860-multiversos/860-Multiversos.zip"');
  const files = { "860 Multiversos.html": fs.readFileSync(score), "Guia-de-montaje.html": Buffer.from(guide) };
  const inventory = ["860 Multiversos · Audiovisuales de la partitura", "", "Archivo · bytes · SHA-256"];
  // Only the audiovisual assets referenced by the public score belong in the download.
  for (const name of JSON.parse(fs.readFileSync(mediaList, "utf8"))) {
    const bytes = fs.readFileSync(path.join(root, "public/multiversos", name));
    files["Audiovisuales/" + name] = [bytes, {level: 0}];
    inventory.push(name + " · " + bytes.length + " · " + createHash("sha256").update(bytes).digest("hex"));
  }
  files["Inventario.txt"] = Buffer.from(inventory.join("\r\n") + "\r\n");
  const licenses = ["react", "react-dom"].map(name => fs.readFileSync(path.join(path.dirname(require.resolve(name + "/package.json")), "LICENSE"), "utf8"));
  files["Licencias.txt"] = Buffer.from(licenses.join("\n\n"));
  fs.writeFileSync(partial, zipSync(files, { level: 6, mtime: new Date(2020, 0, 1) }));
  fs.renameSync(partial, path.join(destination, zipName));
  console.log(zipName + " · " + (inventory.length - 3) + " audiovisuales");
} finally {
  for (const file of [score, mediaList, partial]) fs.rmSync(file, {force: true});
  fs.rmdirSync(temp);
}
