'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Folder = require('../models/folder');
const Note = require('../models/note');
const passport = require('passport');

const router = express.Router();



const validateFolderId = function(req, res, next){
  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  next();
};

//Below protects endpoints using JWT strategy
router.use('/', passport.authenticate('jwt', {session: false, failWithError: true}));
/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
const userId = req.user.id;
  Folder.find({userId: userId})
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', validateFolderId, (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  

  Folder.findOne({_id: id, userId: userId})
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
router.post('/', (req, res, next) => {
  const { name } = req.body;
  const userId = req.user.id;
  const newFolder = { name, userId };

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder.create(newFolder)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', validateFolderId, (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updateFolder = { name };

  Folder.findOneAndUpdate({_id: id, userId: userId}, updateFolder, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', validateFolderId, (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/

  // ON DELETE SET NULL equivalent
  const folderRemovePromise = Folder.findOneAndDelete({_id: id, userId: userId});
  // ON DELETE CASCADE equivalent
  // const noteRemovePromise = Note.deleteMany({ folderId: id });

  const noteRemovePromise = Note.updateMany(
    { folderId: id },
    { $unset: { folderId: '' } }
  );

  folderRemovePromise
    .then((result) => {
      if(result){
        noteRemovePromise
          .then(() => {
            res.sendStatus(204);
          })
          .catch((err) => {
            next(err);
          })
      } else {
        next();
      }
    })
    .catch((err) => {
      next(err);
    });
});

/*  const tagRemovePromise = Tag.findOneAndDelete({_id: id, userId: userId});

  const noteUpdatePromise = Note.updateMany(
    { tags: id },
    { $pull: { tags: id } }
  );

  tagRemovePromise
    .then((result) => {
      if(result){
        noteUpdatePromise
          .then(() => {
            res.sendStatus(204);
          })
          .catch((err) => {
            next(err);
          })
      }
      else {
        next();
      }
    })
    .catch((err) => {
      next(err);
    })*/

module.exports = router;
