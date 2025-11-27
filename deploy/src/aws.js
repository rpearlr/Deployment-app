const express = require("express");
const { S3 } = require("aws-sdk");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const s3 = new S3({
  accessKeyId: process.env.ACCESS_ID,
  secretAccessKey: process.env.SECRET_ACCESS,
  endpoint: process.env.ENDPOINT,
});


async function downloadS3Folder(prefix) {
  const allFiles = await s3
    .listObjectsV2({
      Bucket: "vercel",
      Prefix: prefix,
    })
    .promise();

  const promises = (allFiles.Contents || []).map(({ Key }) => {
    return new Promise((resolve) => {
      if (!Key) return resolve("");

      const localPath = path.join(__dirname, Key);
      const dirName = path.dirname(localPath);

      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      const fileStream = fs.createWriteStream(localPath);
      s3.getObject({ Bucket: "vercel", Key })
        .createReadStream()
        .pipe(fileStream)
        .on("finish", () => resolve(""));
    });
  });

  await Promise.all(promises);
}

async function uploadFileToS3(fileName, localPath) {
  const data = fs.readFileSync(localPath);

  return s3
    .upload({
      Bucket: "vercel",
      Key: fileName,
      Body: data,
    })
    .promise();
}

function getAllFiles(folderPath) {
  let output = [];

  const entries = fs.readdirSync(folderPath);

  entries.forEach((entry) => {
    const fullPath = path.join(folderPath, entry);

    if (fs.statSync(fullPath).isDirectory()) {
      output = output.concat(getAllFiles(fullPath));
    } else {
      output.push(fullPath);
    }
  });

  return output;
}

async function uploadDistFolder(id) {
  const folderPath = path.join(__dirname, `output/${id}/dist`);
  const files = getAllFiles(folderPath);

  for (const file of files) {
    const s3Key = `dist/${id}/` + file.slice(folderPath.length + 1);
    console.log("Uploading:", s3Key);
    await uploadFileToS3(s3Key, file);
  }
}


app.get("/download/:prefix", async (req, res) => {
  try {
    const { prefix } = req.params;
    await downloadS3Folder(prefix);
    res.json({ status: "success", message: `Downloaded: ${prefix}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Download failed" });
  }
});

app.post("/upload-dist/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await uploadDistFolder(id);
    res.json({ status: "success", message: `Uploaded dist for ID: ${id}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
