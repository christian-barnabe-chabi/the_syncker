const router = require("express").Router();
const { default: axios } = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const remoteSyncServer = "http://localhost:5000/sync";
const chokidar = require("chokidar");
const wget = require("node-wget");
const configFile = require(path.join(
  __dirname,
  "../config",
  "localSyncFolder.json"
));
let localSyncDir = path.normalize(configFile.folder);
const dirTree = require("directory-tree");
let socket = null;

const fsWatcher = chokidar.watch(localSyncDir, {
  awaitWriteFinish: false,
  persistent: true,
});

const uploadQueue = [];

router.get("/init", async (req, res, next) => {
  return res.json({
    message: "handshake successful",
    localPath: localSyncDir,
  });
});

async function startSync() {
  axios
    .get(remoteSyncServer + "/handshake")
    .then((data) => {
      doUpdate();
    })
    .catch((error) => {
      console.log("remote server is not running");
      return 0;
    });

  socket?.emit("syncStarted", `${socket?.id} has started watching`);
  socket?.emit("message", `target watched ${localSyncDir}`);

  fsWatcher.on("all", async (event, path) => {
    let type = ((event == "unlinkDir") || (event == "addDir")) ? "dir" : "file";

    const fileStat = fs.statSync(path);

    if (event == "add" || event == "addDir") {
      return syncWithCheck([
        {
          path: path,
          type: type == "dir" ? "directory" : "file",
          size: fileStat.size,
        },
      ]);
    }

    let fullPath = path;
    path = path.replace(localSyncDir, "");

    let changeData = {
      path: path,
      fullPath: fullPath,
      event: event,
      type: type,
      size: fileStat.size,
    };
    return enqueueChange(changeData);
  });

  fsWatcher.on("error", () => {
    socket?.emit("message", `An error occurs while watching - retrying`);
  });
}

async function enqueueChange(changeData) {
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
  formData.append("size", changeData.size);

  if (uploadQueue.length > 0) {
    if (uploadQueue[uploadQueue.length - 1] == formData) {
      return;
    }
  }

  syncWithServer(changeData.path, formData);
}

async function syncWithServer(path, formData) {
  if (!path) {
    return;
  }

  socket?.emit("uploadingStart", `started syncing ${path}`);

  await axios
    .post(remoteSyncServer + "/upload", formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })
    .then((data) => {
      socket?.emit("uploadingEnd", `${path} synced with remote server`);
    })
    .catch((error) => {
      socket?.emit("uploadingError", `failled to sync ${path}`);
      socket?.emit("uploadingError", error);
    });
}

function doUpdate() {
  const paths = [];
  function recurse(pathObject) {
    if (
      pathObject.hasOwnProperty("children") &&
      pathObject.children.length > 0
    ) {
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
  syncWithCheck(paths);
  pullFromRemoteServer();
}

function syncWithCheck(paths) {
  paths.forEach(async (pathObject) => {
    const fullPath = pathObject.path;
    const path = pathObject.path.replace(localSyncDir, "");
    const type = pathObject.type == "directory" ? "dir" : "file";
    const event = pathObject.type == "directory" ? "addDir" : "add";
    const size = pathObject.size || 0;

    const changeData = {
      path: path,
      fullPath: fullPath,
      event: event,
      type: type,
      size: size,
    };

    await axios
      .post(remoteSyncServer + "/autoCheck", changeData, {
        headers: { "Content-Type": "application/json" },
      })
      .then((reply) => {
        if (reply.status == "202") {
          enqueueChange(changeData);
          return changeData;
        }
      })
      .catch((error) => {
        socket?.emit("message", error.message);
      });
  });
}

async function pullFromRemoteServer() {
  await axios.get(remoteSyncServer + "/getTree").then((reply) => {
    const paths = reply.data;

    paths.forEach(async (pathObject) => {
      const fullPath = path.normalize(localSyncDir + pathObject.path);
      const url = remoteSyncServer + "/getFile?filePath=" + pathObject.path;
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      if (!fs.existsSync(fullPath)) {
        wget({ url: url, dest: fullPath });
      } else {
        const currentFileStat = fs.statSync(fullPath);
        if(pathObject.size > currentFileStat.size) {
          wget({ url: url, dest: fullPath });
        }
      }

    });
  });
}

function setSocketSync(s) {
  socket = s;

  socket?.on("setSyncFolder", (folder) => {
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
    startSync();
    console.log(`local sycned folder has changed to ${folder}`);
    socket?.emit(
      "syncFolderChanged",
      `local sycned folder has changed to ${folder}`
    );
  });
}

module.exports = { router, startSync, setSocketSync };
