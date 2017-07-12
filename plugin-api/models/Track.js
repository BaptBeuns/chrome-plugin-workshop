var mongoose = require('mongoose'); 
var BoxSchema = require('./Box.js').BoxSchema;
var Box = require('./Box.js').Box;
var boxFromData = require('./Box.js').boxFromData;
var async = require('async');

var TrackSchema = new mongoose.Schema({
	start : {type: Number, required:true}, 
	end : {type: Number},
	boxes : [BoxSchema],
	entity: {type: mongoose.Schema.Types.ObjectId, ref : 'Entity'},
}); 

var Track = mongoose.model('Track', TrackSchema);


function oneTrackFromData(data, callback) {
  // Define start and end as min-max of the time stamps
  var faces = data.faces;
  var timestamps = [];
  for (i=0; i < faces.length; i++){
    timestamps.push(faces[i].timestamp);
  }
  var attributes = {
    'start' : Math.min.apply(null, timestamps), 
    'end'   : Math.max.apply(null, timestamps),
    'entity': data.annotation
  };
  console.log(attributes);

  // Create boxes from the faces
  async.map(faces, boxFromData, function(err, boxes) {
    attributes.boxes = boxes;
    console.log('Attributes:');
    console.log(attributes);

    Track.create(attributes, function(err, track) {
      // The track stays undefined here
      if (err) return callback(err, track);
      console.log('Track');
      console.log('*********************');
      console.log(track);
      return callback(null, track);
    });
  });
}


module.exports = {
	'Track'            : Track, 
	'TrackSchema'      : TrackSchema,
  'oneTrackFromData' : oneTrackFromData 
};
