const { exec } = require("child_process");
const path = require("path");

function buildProject(id) {
  return new Promise((resolve) => {
    const projectPath = path.join(__dirname, `output/${id}`);
    const child = exec(`cd ${projectPath} && npm install && npm run build`);

    child.stdout && child.stdout.on("data", (data) => {
      console.log("stdout: " + data);
    });

    child.stderr && child.stderr.on("data", (data) => {
      console.log("stderr: " + data);
    });

    child.on("close", () => {
      resolve("");
    });
  });
}

module.exports = { buildProject };
