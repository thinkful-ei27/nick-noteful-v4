'use strict';
const express = require('express');
const passport = require('passport');

//Below const is not referenced
const User = require('../models/user');
const router = express.Router();

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);

router.post('/', localAuth, function (req, res, next) {
  console.log("router.post in auth for /login ran");
  return res.json(req.user);
});

module.exports = router;