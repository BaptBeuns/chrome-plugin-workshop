var mongoose = require('mongoose'); 

var SourceVideoSchema = new mongoose.Schema({
	source_url: {type: String, required: true, unique: true}, 
  // make sure that the type of the ref is ObjectIw
	reminiz_video: {type: mongoose.Schema.Types.ObjectId, ref: 'Video'},
  // Offsets are [[start, cum_offset], [start, cum_offset], ...]
  offsets: {type: [[Number]]},
  // Hash is used to query the correct source video
  hash: {type: String, required: true, unique: true}
},
{ collection: 'sourcevideo'}); 

module.exports = {
	'SourceVideo':mongoose.model('SourceVideo', SourceVideoSchema), 
	'SourceVideoSchema' : SourceVideoSchema
};
