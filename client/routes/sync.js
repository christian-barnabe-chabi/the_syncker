const router = require("express").Router();
const { default: axios } = require("axios");
const fs = require("fs");
const path = require("path");
const { zip } = require("zip-a-folder");
const FormData = require("form-data");
const remoteSyncServer = "http://localhost:5000/sync";
const chokidar = require("chokidar");
const { request } = require("http");
const configFile = require(path.join(
  __dirname,
  "../config",
  "localSyncFolder.json"
));
let localSyncDir = path.normalize(configFile.folder);
let dirTree = require("directory-tree");

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
        localPath: localSyncDir,
      });
    })
    .catch((error) => {
      return res.status(500).json({
        message: "remote sync server is down - can't continue",
      });
    });
});

async function startSync(socket) {
  doUpdate(socket);
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
    enqueueChange(socket, changeData);
  });

  fsWatcher.on("error", () => {
    socket.emit("message", `An error occurs while watching - retrying`);
    startSync(socket);
  });

  socket.on("setSyncFolder", (folder) => {
    const configData = {
      folder: folder,
    };
    const configFilePath = path.join(
      __dirname,
      "../config",
      "localSyncFolder.json"
    );
    fs.writeFileSync(configFilePath, JSON.stringify(configData));
    localSyncDir = path.normalize(configFile.folder);
    startSync(socket);
    socket.emit("syncFolderChanged");
  });
}

async function enqueueChange(socket, changeData) {
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

  setTimeout(() => {
    syncWithServer(socket, changeData.path, formData);
  }, 2000);
}

async function syncWithServer(socket, path, formData) {
  if (!path) {
    return;
  }

  socket.emit("uploadingStart", `started syncing ${path}`);

  await axios
    .post(remoteSyncServer + "/upload", formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })
    .then((data) => {
      socket.emit("uploadingEnd", `${path} synced with remote server`);
    })
    .catch((error) => {
      socket.emit("uploadingError", `failled to sync ${path}`);
      socket.emit("uploadingError", error);
    });
}

function doUpdate(socket) {
  const paths = [];
  function recurse(pathObject) {
    if (pathObject.hasOwnProperty("children") && pathObject.children.length > 0) {
      pathObject.children.forEach((child) => {
        return recurse(child);
      });
    } else {
      if (pathObject.hasOwnProperty("path")) {
        paths.push(pathObject);
      }
    }
  }

  recurse(dirTree(localSyncDir));
  autoSync(socket, paths);
}

function autoSync(socket, paths) {
  let count = 0;
  const promises = [];
  paths.forEach(async (obj) => {
    const fullPath = obj.path;
    const path = obj.path.replace(localSyncDir, "");
    const type = obj.type == "directory" ? "dir" : "file";
    const event = obj.type == "directory" ? "addDir" : "add";

    const changeData = {
      path: path,
      fullPath: fullPath,
      event: event,
      type: type,
    };

    const promise = await axios
      .post(remoteSyncServer + "/autoCheck", changeData, {
        headers: { "Content-Type": "application/json" },
      })
      .then((reply) => {
        if (reply.status == "202") {
          count++;
          enqueueChange(socket, changeData);
          return changeData;
        }
      })
      .catch((error) => {
        socket.emit("message", error.message);
      });

      promises.push(promise);

  });

  Promise.all(promises).then((values) => {
    socket.emit('message', `${values.length} files have been synced to the remote server`);
  });

}

async function pullFromRemoteServer(socket) {
  socket.emit("message", "pulling from remote server");
} 

module.exports = { router, startSync };
