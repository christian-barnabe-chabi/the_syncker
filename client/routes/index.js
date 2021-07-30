var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let serviceIsRunning = false;
  res.render('index', { title: 'The Syncker', serviceIsRunning: serviceIsRunning});
});

module.exports = router;
