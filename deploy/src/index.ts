const { createClient, commandOptions } = require("redis");
const { copyFinalDist, downloadS3Folder } = require("./aws");
const { buildProject } = require("./utils");

const subscriber = createClient();
const publisher = createClient();

async function start() {
  await subscriber.connect();
  await publisher.connect();

  while (true) {
    try {
      const res = await subscriber.brPop(
        commandOptions({ isolated: true }),
        "build-queue",
        0
      );

      const id = res?.element || res?.message || res?.value;
      if (!id) continue;

      await downloadS3Folder(`output/${id}`);
      await buildProject(id);
      await copyFinalDist(id);
      await publisher.hSet("status", id, "deployed");
    } catch (err) {
      console.error(err);
    }
  }
}

start();
