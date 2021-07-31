var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var syncRouter = require('./routes/sync');

var app = express();

// app.use(logger('dev'));
app.use(express.json());

app.use('/', indexRouter);
app.use('/sync', syncRouter);

module.exports = app;
