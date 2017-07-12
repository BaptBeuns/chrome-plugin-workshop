var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Entity = require('../models/Entity.js').Entity;
/* GET /entities listing. */
router.get('/', function(req, res, next) {
  Entity.find(function (err, entities) {
    if (err) return next(err);
    res.json(entities);
  });
});

/* GET /entities/id */
router.get('/:id', function(req, res, next) {
  Entity.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* Search by name. The results are sorted by relevance 
 * The search is case insensitive in Mongo 3.0.
 * Starting with Mongo 3.2, we will need to indicate case sensitivity as a param.
 * */
router.get('/search/:name', function(req, res, next) {
  Entity.find(
      { $text : { $search: req.params.name } },
      { score : { $meta: "textScore" } }
      )
    .sort({ score: { $meta: "textScore" } })
    .exec(function (err, post) {
      if (err) return next(err);
      res.json(post);
    });
});


/* POST /entities */
router.post('/', function(req, res, next) {
  Entity.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /entities/:id */
router.put('/:id', function(req, res, next) {
  Entity.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /entities/:id */
router.delete('/:id', function(req, res, next) {
  Entity.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
