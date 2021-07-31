const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const syncedDir = "./sync";
const multer = require("multer");
const asynHandler = require("async-handler");
const { v4: uuidv4 } = require("uuid");
const dirTree = require("directory-tree");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./upload");
  },
  filename: (req, file, cb) => {
    cb(null, "" + uuidv4());
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), async (req, res, next) => {
  // req.body.path = path.normalize(req.body.path || "");
  const requestData = req.body;

  if(requestData.path == '.') return;

  const fullPath = path.normalize(syncedDir + requestData.path);

  if (requestData.event == "unlink") {
    if (fs.existsSync(fullPath)) {
      await fs.unlinkSync(fullPath);
      return res.status(200).json({ message: "file unlinked" });
    }
  }

  if (requestData.event == "unlinkDir") {
    if (fs.existsSync(fullPath)) {
      await fs.rmdirSync(fullPath, { recursive: true });
      return res.status(200).json({ message: "folder unlinked" });
    }
  }

  if (requestData.event == "addDir") {
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      return res.status(200).json({ message: "folder created" });
    }
  }

  if (requestData.event == "add") {
    const dirPath = path.dirname(fullPath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.renameSync(req.file.path, fullPath);
    return res.status(200).json({ message: "file created" });
  }

  return res.status(200).json({ message: "something went wrong" });
});

router.post("/autoCheck", (req, res, next) => {
  const requestData = req.body;
  const fullPath = path.normalize(syncedDir + requestData.path);

  if (fs.existsSync(fullPath)) {
    const currentFileStat = fs.statSync(fullPath);
    if(currentFileStat.size >= requestData.size) {
      return res.status(200).json({ message: "up to date" });
    }
  }

  return res.status(202).json({ message: "not up to date" });
});

router.get("/handshake", (req, res, next) => {
  if (!fs.existsSync(syncedDir)) {
    fs.mkdirSync(syncedDir);
  }

  if (!fs.existsSync("./upload")) {
    fs.mkdirSync("./upload");
  }

  return res.status(200).json({ message: "alive" });
});

router.get("/getTree", (req, res, next) => {
  const paths = [];
  function recurse(pathObject) {
    if(!pathObject) return;
    if (
      pathObject.hasOwnProperty("children") &&
      pathObject.children.length > 0
    ) {
      pathObject.children.forEach((child) => {
        return recurse(child);
      });
    } else {
      if (pathObject.hasOwnProperty("path")) {
        pathObject.path = pathObject.path.replace(
          path.normalize(syncedDir),
          ""
        );
        paths.push(pathObject);
      }
    }
  }

  router.get("/getFile", (req, res, next) => {
    const requestData = req.query;

    const fullPath = path.normalize(syncedDir + requestData.filePath);
    if (fs.existsSync(fullPath)) {
      return res.sendFile(path.resolve(fullPath));
    } else {
      return res.status(500).json({message: "file not found"});
    }
  });

  recurse(dirTree(path.normalize(syncedDir)));
  res.json(paths);
});

module.exports = router;
