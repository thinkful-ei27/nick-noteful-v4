'use strict';
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {JWT_SECRET, JWT_EXPIRY} = require('../config');
//Below const is not referenced
const User = require('../models/user');
const router = express.Router();

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true});


function createAuthToken (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

router.post('/', localAuth, function (req, res, next) {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

module.exports = router;