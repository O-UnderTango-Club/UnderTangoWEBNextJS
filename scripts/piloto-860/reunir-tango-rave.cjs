const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

module.exports = function assembleTangoRave(root) {
  const directory = path.join(__dirname,"media/tango-rave");
  const {parts,sha256} = JSON.parse(fs.readFileSync(path.join(directory,"manifest.json"),"utf8"));
  const output = path.join(root,"public/multiversos/tango-rave-overlay.mp4");
  const partial = `${output}.${process.pid}.tmp`;
  const digest = createHash("sha256");
  try {
    const file = fs.openSync(partial,"wx");
    try {
      for (const part of parts) {
        const bytes=fs.readFileSync(path.join(directory,part));
        fs.writeFileSync(file,bytes);
        digest.update(bytes);
      }
    } finally {
      fs.closeSync(file);
    }
    if (digest.digest("hex") !== sha256) throw new Error("El video de Ø Tango Rave está incompleto.");
    fs.renameSync(partial,output);
  } finally {
    fs.rmSync(partial,{force:true});
  }
};
