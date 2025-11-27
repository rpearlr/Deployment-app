const express = require("express");
const cors = require("cors");
const simpleGit = require("simple-git");
const { generate } = require("./utils");
const { getAllFiles } = require("./file");
const path = require("path");
const { uploadFile } = require("./aws");
const { createClient } = require("redis");

const publisher = createClient();
publisher.connect();

const subscriber = createClient();
subscriber.connect();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/deploy", async (req, res) => {
  const repoUrl = req.body.repoUrl;
  const id = generate();
  await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

  const files = getAllFiles(path.join(__dirname, `output/${id}`));

  for (const file of files) {
    await uploadFile(file.slice(__dirname.length + 1), file);
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));
  await publisher.lPush("build-queue", id);
  await publisher.hSet("status", id, "uploaded");

  res.json({ id });
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const status = await subscriber.hGet("status", id);
  res.json({ status });
});

app.listen(3000);
