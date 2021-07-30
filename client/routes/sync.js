const router = require("express").Router();
const { default: axios } = require("axios");
const fs = require("fs");
const path = require("path");
const { zip } = require("zip-a-folder");
const FormData = require("form-data");
const remoteSyncServer = "http://localhost:5000/sync";
const chokidar = require("chokidar");
const { request } = require("http");
const configFile = require(path.join(__dirname, "../config", "localSyncFolder.json"));
let localSyncDir = path.normalize(configFile.folder);

const fsWatcher = chokidar.watch(localSyncDir, {
  awaitWriteFinish: true,
  persistent: true,
});

const uploadQueue = [];
let isSyncing = false;

router.get("/init", async (req, res, next) => {
  await axios
    .get(remoteSyncServer + "/handshake")
    .then((data) => {
      return res.json({
        message: "handshake successful",
        localPath: localSyncDir
      });
    })
    .catch((error) => {
      return res.status(500).json({
        message: "remote sync server is down - can't continue",
      });
    });
});

async function startSync(socket) {
  socket.emit("syncStarted", `${socket.id} has started watching`);
  socket.emit("message", `target watched ${localSyncDir}`);

  fsWatcher.on("all", async (event, path) => {
    socket.emit("message", `${path} has got ${event} event`);
    let type = event == ("unlinkDir" || "addDir") ? "dir" : "file";

    let fullPath = path;
    path = path.replace(localSyncDir, "");

    let changeData = {
      path: path,
      fullPath: fullPath,
      event: event,
      type: type,
    };
    enqueueChange(localSyncDir, socket, changeData);
  });

  fsWatcher.on("error", () => {
    socket.emit("message", `An error occurs while watching - retrying`);
    startSync(socket);
  });

  socket.on("stopSync", async () => {
    fs.unwatchFile(localSyncDir, fsWatcher);
    socket.emit("syncStoped", `${socket.id} stoped watching`);
  });


  socket.on("setSyncFolder", (folder) => {
    const configData = {
      folder: folder
    };
    const configFilePath = path.join(__dirname, "../config", "localSyncFolder.json");
    fs.writeFileSync(configFilePath, JSON.stringify(configData));
    localSyncDir = path.normalize(configFile.folder);
    startSync(socket);
    socket.emit("syncFolderChanged");
  })
}

async function enqueueChange(syncFolder, socket, changeData) {
  changeData.path.replace(localSyncDir, "");

  let formData = new FormData();
  let fullPath = changeData.fullPath;
  delete changeData.fullPath;

  changeData.path = path.normalize(changeData.path);

  if (
    changeData.event != "unlink" &&
    changeData.type == "file" &&
    changeData.event != "addDir"
  ) {
    const file = fs.createReadStream(fullPath);
    formData.append("file", file);
    setTimeout(() => {
      file.close();
    }, 5000);
  }

  formData.append("path", changeData.path);
  formData.append("event", changeData.event);
  formData.append("type", changeData.type);

  if (uploadQueue.length > 0) {
    if (uploadQueue[uploadQueue.length - 1] == formData) {
      return;
    }
  }
  uploadQueue.push(formData);
  syncWithServer(socket, changeData.path);
}

async function syncWithServer(socket, path) {
  if(!path) return;
  if (uploadQueue.length > 0 && isSyncing == false) {
    isSyncing = true;
    let formData = uploadQueue.pop();

    socket.emit("uploadingStart", `started syncing ${path}`);

    await axios
      .post(remoteSyncServer + "/upload", formData, {
        headers: formData.getHeaders(),
      })
      .then((data) => {
        socket.emit("uploadingEnd", `${path} synced with remote server`);
        return syncWithServer(socket);
      })
      .catch((error) => {
        socket.emit("uploadingError", `failled to sync ${path}`);
        socket.emit("uploadingError", error.message);
      });
  } else {
    isSyncing = false;
  }
}

module.exports = { router, startSync };
