const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const { zip } = require('zip-a-folder');

router.get("/init", (req, res, next) => {
  return res.json({
    message: "Init",
  });
});

async function startSync(socket) {
  socket.emit("message", `${socket.id} has started watching`);
  const dir = "C:/Users/Christian/Desktop/MyCloud";
  // const dir = path.join(__dirname, "../LocalCopy");
  console.log(dir);
  socket.emit("message", `target watched ${dir}`);
  const fsWatcher = fs.watch(dir, { persistent: false, recursive: true });

  fsWatcher.on("change", (eventType, fileName) => {
    socket.emit("message", `${fileName} has got ${eventType} event`);
    zipSyncFolder(dir, socket);
  });

  fsWatcher.on("error", () => {
    socket.emit("message", `An error occurs while watching - retrying`);
    startSync(socket);
  });

  fsWatcher.on("close", () => {
    socket.emit("message", `${socket.id} stoped watching`);
  });

  socket.on("stopSync", async () => {
    fsWatcher.close();
  });
}

async function zipSyncFolder(syncFolder, socket) {
  const output = path.join(__dirname, "../LocalCopy", "archive.zip");
  socket.emit("compressStart", "Compression started");
  await zip(syncFolder, output);
  socket.emit("compressEnd", "Compression completed");
}

module.exports = {router, startSync};
