'use strict';

const { Strategy: LocalStrategy } = require('passport-local');
const User = require('../models/user');

const localStrategy = new LocalStrategy((username, password, done) => {
  let user;
  console.log('localStrategy ran');
  User.findOne( { username })
    .then(results => {
        console.log('local strategy ran');
        user = results;
        if(!user) {
            return Promise.reject({
                reason: 'LoginError',
                message: 'Incorrect username', 
                location: 'username'
            });
        }
        const isValid = user.validatePassword(password);
        if (!isValid) {
            return Promise.reject({
                reason: 'LoginError',
                message: 'Incorrect password',
                location: 'password'
            });
        }
        return done(null, user);
    })
    .catch(err => {
        if(err.reason === 'LoginError') {
            return done(null, false);
        }
        return done(err);
    });
});

//Should we export localStrategy?
module.exports = localStrategy;