var mongoose = require('mongoose'); 

var BoxSchema = new mongoose.Schema({
	x : {type: Number, required:true}, 
	y : {type: Number, required:true},
	w : {type: Number, required:true},
	h: {type: Number, required:true},
	timestamp : {type: Number, required:true}
}); 

Box = mongoose.model('Box', BoxSchema);


function boxFromData(data, callback) {
  Box.create(data, function(err, box) {
    if (err) throw err;
    return callback(null, box);
  });
}


module.exports = {
	'Box'        : Box,
	'BoxSchema'  : BoxSchema,
  'boxFromData': boxFromData
};


