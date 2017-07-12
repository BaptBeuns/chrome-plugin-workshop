var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Box = require('../models/Box.js').Box;
/* GET /entities listing. */
router.get('/', function(req, res, next) {
  Box.find(function (err, entities) {
    if (err) return next(err);
    res.json(entities);
  });
});

/* GET /entities/id */
router.get('/:id', function(req, res, next) {
  Box.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* POST /entities */
router.post('/', function(req, res, next) {
  Box.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /entities/:id */
router.put('/:id', function(req, res, next) {
  Box.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /entities/:id */
router.delete('/:id', function(req, res, next) {
  Box.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;