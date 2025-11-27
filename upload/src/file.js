const fs = require("fs");
const path = require("path");

const getAllFiles = (folderPath) => {
  let response = [];

  const items = fs.readdirSync(folderPath);
  items.forEach((item) => {
    const full = path.join(folderPath, item);
    if (fs.statSync(full).isDirectory()) {
      response = response.concat(getAllFiles(full));
    } else {
      response.push(full);
    }
  });

  return response;
};

module.exports = { getAllFiles };
