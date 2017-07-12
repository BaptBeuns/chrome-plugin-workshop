var mongoose = require('mongoose'); 
var TrackSchema = require('./Track.js').TrackSchema;

var VideoSchema = new mongoose.Schema({
	title: {type: String, required:true}, 
	tracks: [TrackSchema],
  // name of the CSV file 
  features: {type: String},
  // name of the CSV file 
  cuts: {type: String},
  // name of the CSV file 
  timestamps: {type: String},
},
{ collection: 'video'}); 


module.exports = {
	'Video':mongoose.model('Video', VideoSchema), 
	'VideoSchema' : VideoSchema
};
