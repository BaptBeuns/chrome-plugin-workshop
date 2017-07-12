var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var SourceVideo = require('../models/SourceVideo.js').SourceVideo;
var Video = require('../models/Video.js').Video;
var oneTrackFromData = require('../models/Track.js').oneTrackFromData;
var crypto = require('crypto');
var PythonShell = require('python-shell');
var async = require('async');


var PATH_TO_SYNCHRO = '/home/antoine/Reminiz_Synchronization/'
var python_options = {
  mode: 'text', 
  pythonPath: 'python',
  pythonOptions: ['-u'],
  scriptPath: PATH_TO_SYNCHRO+'Train',
}

/* GET /sourcevideos listing. */
router.get('/', function(req, res, next) {
  SourceVideo.find(function (err, sourcevideos) {
    if (err) return next(err);
    res.json(sourcevideos);
  });
});


/* GET /sourcevideos/id */
router.get('/:id', function(req, res, next) {
  SourceVideo.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});


/* GET boxes for a sourcevideo with hash <hash> at time <timestamp> */
router.get('/:hash/whoisthere/:timestamp', function(req, res, next) {
  SourceVideo
    .findOne({'hash': req.params.hash})
    .populate('reminiz_video')
    .exec(function(err, source) {
    if (err) return next(err);
    if (!source || !source.reminiz_video) {
      // Return 404 when source does not exist, or is not linked to reminiz_video
      console.log('SourceVideo: '+JSON.stringify(source));
      res.sendStatus(404);
    } else {
      console.log('Video: ' + source.reminiz_video.title + ', id: ' + source.reminiz_video._id);
      // Get offset 
      var t = parseFloat(req.params.timestamp);
      var offset = 0.0;
      for (var i=0; i < source.offsets.length; i++){
        if (t >= source.offsets[i][0]) {
          offset = parseFloat(source.offsets[i][1]);
        } else {
          break;
        }
      }

      t = t + offset;
      var boxes = [];
      // Get the right tracks
      for (var i=0; i < source.reminiz_video.tracks.length; i++){
        var track = source.reminiz_video.tracks[i];
        if (track.start <= t && t <= track.end){

          var new_box = {'entity': track.entity};
          var start_box = track.boxes[0];
          var end_box;
          for(var j=0; j < track.boxes.length; j++){ 
            if (track.boxes[j].timestamp >= t){
              end_box = track.boxes[j];
              break;
            }
            start_box = track.boxes[j];
          }
          if (start_box.timestamp == end_box.timestamp) {
            // To avoid div by 0 errors.
            new_box.x = start_box.x;
            new_box.y = start_box.y;
            new_box.w = start_box.w;
            new_box.h = start_box.h;
          }else{
            // Interpolate the boxes
            var t0 = start_box.timestamp;
            var t1 = end_box.timestamp;
            new_box.x = (end_box.x - start_box.x) / (t1-t0) * (t - t0) + start_box.x
            new_box.y = (end_box.y - start_box.y) / (t1-t0) * (t - t0) + start_box.y
            new_box.w = (end_box.w - start_box.w) / (t1-t0) * (t - t0) + start_box.w
            new_box.h = (end_box.h - start_box.h) / (t1-t0) * (t - t0) + start_box.h
          }
          boxes.push(new_box);
        }
      }
      res.json(boxes);
    }
  });
});


/* POST /sourcevideos
POST a new source that does not need any synchronisation
The request body must contain the data in the following structure :

*/
router.post('/fromJSON', function(req, res, next) {
  var results = {}
  // The data is received as JSON
  // Parse the URL 
  var youtube_url = req.body.url;
  var http_pattern = new RegExp('https?://www.')
  var p = youtube_url.split(http_pattern);
  var short_url = p[p.length - 1];
  var hash = crypto.createHash('md5').update(short_url).digest('hex');
  var source_attr = {'hash': hash, 'source_url': short_url}
  SourceVideo.create(source_attr, function (err, source_vid) {
    if (err) return next(err);
    // Create the tracks objects we need a callback here
    async.map(req.body.tracks, oneTrackFromData, 
        function(err, tracks) {
      if (err) return next(err);
      var vid_attr = { 'title': req.body.title, 'tracks': req.body.tracks};

      console.log('------------------------------------------');
      console.log(JSON.stringify(tracks));
      console.log('------------------------------------------');

      Video.create(vid_attr, function(err, vid) {
        if (err) return next(err);
        source_vid.reminiz_video = vid.id;
        source_vid.save();
        results.video = vid;
        results.sourcevideo = source_vid;
        res.json(source_vid)
      });
    });
  });
});


/* POST /sourcevideos/sync/:video_id 
POST a new source that needs to be synced
Params:
* video_id: id of the Video to sync with 

Source URL must be in the request body.
Will work in 3 steps:
1. get the features and cuts from the ref video (indexed by <video_id>)
2. Send URL of the new video + ref_features + ref_cuts to the sync
3. Create a SourceVideo doc containing all the info + the offsets */
router.post('/sync/:video_id', function(req, res, next) {
  Video.findById(req.params.video_id, function(err, video) {
    if (err) return next(err);
    if (!video) {
      // Return 404 when source does not exist
      res.sendStatus(404);
    } else {

      console.log('Video title: '+ video.title);
      console.log(video.features);
      console.log(video.cuts);
      console.log(req.body);

      var hash = crypto.createHash('md5').update(req.body.source_url).digest('hex');

      SourceVideo.findOne({'hash': hash}, function(err, source) {
        if (err) return next(err);
        if (source) {
          // Exit if the source already exists
          console.log('Source already exists: ' + source.id);
          res.sendStatus(404);
        } else {
          // Update the args 
          python_options.args = [req.body.source_url, video.features, video.cuts, video.timestamps];
          // Call the python script 
          PythonShell.run('main.py', python_options, function(err, results) {
            if (err) {
              console.log(err.stack)
              return next(err);
            }

            // Offsets appear on the last line
            var offsets = JSON.parse(results[results.length - 1]);
            var hash = crypto.createHash('md5').update(req.body.source_url).digest('hex');
            var attributes = {
              offsets: offsets, hash: hash, reminiz_video: req.params.video_id, source_url: req.body.source_url
            };

            console.log(JSON.stringify(attributes));

            SourceVideo.create(attributes, function (err, source_vid) {
              if (err) return next(err);
              // Create the SourceVideo object
              res.json(source_vid);
            });
          });
        }
      });
    }
  });
});


/* PUT /sourcevideos/:id */
router.put('/:id', function(req, res, next) {
  SourceVideo.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});


/* DELETE /sourcevideos/:id */
router.delete('/:id', function(req, res, next) {
  SourceVideo.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
