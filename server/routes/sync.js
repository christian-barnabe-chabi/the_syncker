const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const syncedDir = "./public";
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./upload");
  },
  filename: (req, file, cb) => {
    cb(null, ""+new Date().getTime());
  }
});

const upload = multer({storage: storage});


router.post('/upload',  upload.single('file'), async (req, res, next) => {
  req.body.path = path.normalize(req.body.path || '');

  const requestData = req.body; 
  const fullPath = path.normalize(syncedDir+requestData.path);

  if(requestData.event == "unlink") {
    if(fs.existsSync(fullPath)) {
      await fs.unlinkSync(fullPath);
      return res.status(200).json({message: "file unlinked"});
    }
  }
  
  if(requestData.event == "unlinkDir") {
    if(fs.existsSync(fullPath)) {
      await fs.rmdirSync(fullPath, {recursive: true});
      return res.status(200).json({message: "folder unlinked"});
    }
  }

  if(requestData.event == "addDir") {
    if(!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, {recursive: true});
      return res.status(200).json({message: "folder created"});
    }
  }
  
  if(requestData.event == "add") {
    fs.renameSync(req.file.path, fullPath);
    return res.status(200).json({message: "file created"});
  }

  return res.status(200).json({message: "something went wrong"});

});

router.get('/handshake', (req, res, next) => {
  return res.status(200).json({message: "alive"});
})

module.exports = router;