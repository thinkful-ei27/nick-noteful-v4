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
    const requiredFields = ['username', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));
    if (missingField) {
        const err = new Error(`Missing '${missingField}' in request body`);
        err.status = 422;
        return next(err);
    }
    
    const stringFields = ['username', 'password', 'fullname'];
    const nonStringField = stringFields.find(field => field in req.body && typeof req.body[field] !== 'string');
    if(nonStringField){
        const err = new Error(`'${nonStringField}' must be a string`);
        err.status = 422;
        return next(err);
    }
    
    const hasWhiteSpace = requiredFields.find(field => req.body[field][0] === ' ' || req.body[field][req.body[field].length - 1] === ' ');
    if(hasWhiteSpace){
        const err = new Error(`'${hasWhiteSpace}' must not begin or end with an empty space`);
        err.status = 422;
        return next(err);
    }

    if(username.length < 1){
        const err = new Error(`'username' must be at least 1 character`);
        err.status = 422;
        return next(err);
    }

    if(password.length > 72 || password.length < 8){
        const err = new Error(`'password' must be between 8 and 72 characters in length`);
        err.status = 422;
        return next(err);
    }

    return User.hashPassword(password)
      .then(digest => {
          const newUser = {
              username,
              password: digest,
              fullname: fullname.trim()
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