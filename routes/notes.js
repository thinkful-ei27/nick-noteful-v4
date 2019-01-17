'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const passport = require('passport');
const router = express.Router();
//Below protects endpoints using JWT strategy
router.use('/', passport.authenticate('jwt', {session: false, failWithError: true}));

const validateFolderId = function(req, res, next){
  if(req.body.folderId && !mongoose.Types.ObjectId.isValid(req.body.folderId)){
    const err = new Error('The `folderId` is not a valid id');
    err.status = 400;
    return next(err);
  }
  next();
};

const validateFolderUser = function(req, res, next) {
  const { folderId } = req.body;
  const userId = req.user.id;

  //This is searching through the folder collection, counting folders with that userId AND folderId
  if(folderId){
    Folder.find({ userId: userId, _id: folderId}).count()
      .then((count) => {
        if(count === 0) {
          const err = new Error('The `folderId` is not valid');
          err.status = 400;
          return next(err);
        } else {
          next();
        }
      }
      )
    }
  next();
  };

const validateTagProperty = function(req, res, next) {
  if(req.body.tags){
    if(!Array.isArray(req.body.tags)){
      const err = new Error(`The 'tags' property must be an array`);
      err.status = 400;
      next(err);
    }
    next();
  }
  next();
}

const validateTagIds = function(req, res, next) {
  if(req.body.tags){
    const badIds = req.body.tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if(badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
    next();
  }
  next();
}

const validateTagUser = function(req, res, next) {
  if(req.body.tags){
    req.body.tags.forEach((tagg) => {
      Tag.find({ userId: req.body.userId, _id: tagg}).count()
        .then((count) => {
          if(count === 0){
            const err = new Error(`'${tagg}' is not a valid tag`);
            err.status = 400;
            return next(err);
          }
        })
      })
    next();
  }
  next();
}

// if (toUpdate.tags) {
//   const badIds = toUpdate.tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
//   if (badIds.length) {
//     const err = new Error('The `tags` array contains an invalid `id`');
//     err.status = 400;
//     return next(err);
//   }
// }

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', validateFolderId, validateFolderUser, validateTagProperty, validateTagIds, (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;
  let filter = { userId };

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({_id: id, userId: userId})
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});



/* ========== POST/CREATE AN ITEM ========== */
router.post('/', validateFolderId, validateFolderUser, validateTagProperty, validateTagIds, validateTagUser, (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (tags) {
    const badIds = tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  }

  const newNote = { title, content, folderId, tags, userId };
  if (newNote.folderId === '') {
    delete newNote.folderId;
  }

  Note.create(newNote)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', validateFolderId, validateFolderUser, validateTagProperty, validateTagIds, (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const toUpdate = {};
  const updateableFields = ['title', 'content', 'folderId', 'tags'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.folderId && !mongoose.Types.ObjectId.isValid(toUpdate.folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.tags) {
    const badIds = toUpdate.tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  }

  if (toUpdate.folderId === '') {
    delete toUpdate.folderId;
    toUpdate.$unset = {folderId : 1};
  }

  Note.findOneAndUpdate({_id: id, userId}, toUpdate, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Note.findOneAndDelete({_id: id, userId})
    .then((result) => {
      if(result){
      res.sendStatus(204);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
