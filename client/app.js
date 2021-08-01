const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const socketio = require('socket.io');

const indexRouter = require('./routes/index');
const {router:syncRouter, startSync, setSocketSync} = require('./routes/sync');

var app = express();

const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ['websocket'],
    upgrade: false
  },
});

// startSync();
io.on("connection", async (socket) => {
  socket.emit("message", `Host connected ${socket.id}`);
  setSocketSync(socket);
});

app.use(function (req, res, next) {
  req.io = io;
  next();
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/sync', syncRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).json({message: "ressource not found"});
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {app, server};
