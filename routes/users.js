'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');

const router = express.Router();

//POST route to add new users to the database

router.post('/', (req, res, next) => {
    const {fullname, username, password} = req.body;
    // const newUser = {fullname, username, password};
    console.log('users router ran');
    if(!username){
        const err = new Error('User name is required');
        err.status = 400;
        return next(err);
    }

    if(!password){
        const err = new Error('Password is required');
        err.status = 400;
        return next(err);
    }

    return User.hashPassword(password)
      .then(digest => {
          const newUser = {
              username,
              password: digest,
              fullname
          };
          return User.create(newUser);
      })
      .then(result => {
          return res.status(201).location(`http://${req.headers.host}/api/users/${result.id}`).json(result);
      })
      .catch(err => {
          if(err.code === 11000) {
              err = new Error('The username already exists');
              err.status = 400;
          }
          next(err);
      });
});

module.exports = router;