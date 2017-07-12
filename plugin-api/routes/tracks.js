var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Track = require('../models/Track.js').Track;
/* GET /tracks listing. */
router.get('/', function(req, res, next) {
  Track.find(function (err, tracks) {
    if (err) return next(err);
    res.json(tracks);
  });
});

/* GET /tracks/id */
router.get('/:id', function(req, res, next) {
  Track.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* POST /tracks */
router.post('/', function(req, res, next) {
  Track.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /tracks/:id */
router.put('/:id', function(req, res, next) {
  Track.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /tracks/:id */
router.delete('/:id', function(req, res, next) {
  Track.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;