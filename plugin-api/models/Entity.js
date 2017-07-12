var mongoose = require('mongoose'); 

var EntitySchema = new mongoose.Schema({
  // Twitter, Instagram, Facebook -> ID 
  // Biography 
  // 1 Picture
  //
	name      : {type:String, required:true}, 
  image_url : {type:String},
	accounts  : {}, 
	infos     : {}, 
	links     : {}
}, 
// Specify the base name for compatibility with Python Mongoengine
{ collection: 'entity'}); 

// Define the name as index to search for them using text search
EntitySchema.index({name: 'text'});

module.exports = {
	'Entity' : mongoose.model('Entity', EntitySchema), 
	'EntitySchema' : EntitySchema};
