var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var https = require('https');
var fs = require('fs');
// Custom modules
var routes = require('./routes/index');
var users = require('./routes/users');
var entities = require('./routes/entities');
var videos = require('./routes/videos');
var sourcevideos = require('./routes/sourcevideos');


//
var Promise = require("es6-promise").Promise
// load mongoose package
var mongoose = require('mongoose');
// Use native Node promises
mongoose.Promise = global.Promise;

var app = express();
// Use HTTPS on port 8000
options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
https.createServer(options, app).listen(8000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

// Parse JSON request bodies
// We limit to 3MB the JSON data for now.
app.use(bodyParser.json());
// Parse  x-ww-form-urlencoded request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Allow crossorigin requests
// TODO: limit to GET requests, and limit the types of origins
app.use(cors());

app.use('/', routes);
app.use('/users', users);
app.use('/entities', entities);
app.use('/videos', videos);
app.use('/sourcevideos', sourcevideos);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;


// connect to MongoDB
var conn = mongoose.connect('mongodb://localhost/plugin-api', function(err){
  if(err){
    console.error(err)
  }
  else{
    console.log('succesfully connected to mongodb')
  }
});

