var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Video = require('../models/Video.js').Video;
var SourceVideo = require('../models/SourceVideo.js').SourceVideo;
var vsprintf = require('sprintf-js').vsprintf;
var path = require('path');
var multer = require('multer');
var fs = require('fs');
var PythonShell = require('python-shell');


var PATH_TO_SYNCHRO = '/home/antoine/Reminiz_Synchronization/'
var TEMP_SYNCHRO = '/home/antoine/Reminiz_Synchronization/Train/temp'
var python_options = {
  mode: 'text', 
  pythonPath: 'python',
  pythonOptions: ['-u'],
  scriptPath: PATH_TO_SYNCHRO+'Train',
}

/* GET /videos listing. */
router.get('/', function(req, res, next) {
  console.log(req.query);
  Video.find(req.query, function (err, videos) {
    if (err) return next(err);
    for (var i=0; i < videos.length; i++){
      //Reduce the footprint
      console.log(JSON.stringify(videos[i]));
    }
    res.json(videos);
  });
});



/* GET /videos/id */
router.get('/:id', function(req, res, next) {
  Video.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});


/* POST /videos */
router.post('/', function(req, res, next) {
  Video.create(req.body, function (err, post) {
    // Set a flag when the features are given
    console.log(JSON.stringify(post));
    post.save();

    if (err) return next(err);
    res.json(post);
  });
});


/* PUT /videos/:id */
router.put('/:id', function(req, res, next) {
  Video.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});


// Middleware that automatically upload the file to the correct dir
var feats_storage = multer.diskStorage({
  // Define the dirname
  destination: function(req, file, callback) {
    var dir = path.join('data', req.params.id);
    console.log(dir);
    // Check if path is accessible for execution
    fs.exists(dir, function(exists){
      if (!exists) {
        console.log('Creating the dir');
        fs.mkdirSync(dir);
      }
      callback(null, dir);
    });
  },
  // Define the basename
  filename: function(req, file, callback) {
    callback(null, 'feats.csv');
  }
});
var feats_upload = multer({storage: feats_storage})

//TODO SECURITY ! TODO
/* POST features as a CSV file
The file will be stored at ./data/<video_hash>/features.csv
*/
router.post('/:id/features/upload', feats_upload.single('features'), function(req, res, next) {
  Video.findById(req.params.id, function (err, video) {
    if (err) return next(err);
    video.features = path.join(req.file.destination, req.file.filename);
    video.save();
    console.log(JSON.stringify(video));
    console.log('Done.');
    res.json(video);
  });
});


// Middleware that automatically upload the file to the correct dir
var cuts_storage = multer.diskStorage({
  // Define the dirname
  destination: function(req, file, callback) {
    var dir = path.join('data', req.params.id);
    console.log(dir);
    // Check if path is accessible for execution
    fs.exists(dir, function(exists){
      if (!exists) {
        console.log('Creating the dir');
        fs.mkdirSync(dir);
      }
      callback(null, dir);
    });
  },
  // Define the basename
  filename: function(req, file, callback) {
    callback(null, 'cuts.csv');
  }
});
var cuts_upload = multer({storage: cuts_storage})

//TODO SECURITY ! TODO
/* POST features as a CSV file
The file will be stored at ./data/<video_hash>/features.csv
*/
router.post('/:id/cuts/upload', cuts_upload.single('cuts'), function(req, res, next) {
  Video.findById(req.params.id, function (err, video) {
    if (err) return next(err);
    video.cuts = path.join(req.file.destination, req.file.filename);
    video.save();
    console.log(JSON.stringify(video));
    console.log('Done.');
    res.json(video);
  });
});


function move_files(source){
  /* Move the features and cuts files after computing happened.
  Args:
  * source_url: String, URL of the source video
  * id        : String, id of the video
  */
  var words = source.source_url.split('=');
  var movie_dir = words[words.length - 1];
  var cuts_file       = path.join(TEMP_SYNCHRO, movie_dir, 'jpeg', 'cuts_EMD.csv');
  var features_file   = path.join(TEMP_SYNCHRO, movie_dir, 'jpeg', 'features.csv');
  var timestamps_file = path.join(TEMP_SYNCHRO, movie_dir, 'jpeg', 'timestamps.csv');

  var new_movie_dir = path.join('data', source.reminiz_video.id);
  var new_cuts_file       = path.join(new_movie_dir, 'cuts.csv');
  var new_features_file   = path.join(new_movie_dir, 'features.csv');
  var new_timestamps_file = path.join(new_movie_dir, 'timestamps.csv');
  fs.exists(new_movie_dir, function(exists){
    if (!exists) {
      console.log('Creating the dir', new_movie_dir);
      fs.mkdirSync(new_movie_dir);
    }
    fs.rename(cuts_file, new_cuts_file, function(err){
      if (err) throw err;
    });
    fs.rename(features_file, new_features_file, function(err){
      if (err) throw err;
    });
    fs.rename(timestamps_file, new_timestamps_file, function(err){
      if (err) throw err;
    });
    // Update the Video object
    source.reminiz_video.features   = new_features_file;
    source.reminiz_video.cuts       = new_cuts_file;
    source.reminiz_video.timestamps = new_timestamps_file;
    source.reminiz_video.save()
  });
  return 0
}


// Compute features and cuts for a new video
router.post('/:id/compute', function(req, res, next) {
  Video.findById(req.params.id, function (err, video) {
    if (err) return next(err);
    if (!video) {
      console.log('Video Id not found: ' + req.params.id);
      res.sendStatus(404);
    } else {
      console.log(video.id);
      // Get the URL of the first source
      SourceVideo
        .findOne({'reminiz_video': video.id})
        .populate('reminiz_video')
        .exec(function(err, source) {
          python_options.args = [source.source_url];
          // Launch the script to compute the features and cuts
          console.log('Launching the script');
          PythonShell.run('main.py', python_options, function(err, results) {
            if (err) {
              console.log(err.stack)
              return next(err);
            }
            console.log('Done computing.');
            // Get the temp files: features and cuts
            // WARNING: only handles Youtube URLs
            move_files(source);
            res.json(video);
        });
      });
    }
  });
});


/* DELETE /videos/:id */
router.delete('/:id', function(req, res, next) {
  Video.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
