const express = require("express");
const { S3 } = require("aws-sdk");

const s3 = new S3({
  accessKeyId: process.env.ACCESS_ID,
  secretAccessKey: process.env.SECRET_ACCESS,
  endpoint: process.env.ENDPOINT
});

const app = express();

app.get("/*", async (req, res) => {
  try {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path === "/" ? "/index.html" : req.path;

    const contents = await s3
      .getObject({
        Bucket: "vercel",
        Key: `dist/${id}${filePath}`
      })
      .promise();

    const type =
      filePath.endsWith(".html") ? "text/html" :
      filePath.endsWith(".css") ? "text/css" :
      filePath.endsWith(".svg") ? "image/svg+xml" :
      filePath.endsWith(".png") ? "image/png" :
      filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") ? "image/jpeg" :
      "application/javascript";

    res.set("Content-Type", type);
    res.send(contents.Body);
  } catch (err) {
    res.status(404).send("Not found");
  }
});

app.listen(3001);
