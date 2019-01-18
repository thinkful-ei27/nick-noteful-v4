
'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';
  
  let token;
  let user;

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
      .then(() => User.deleteMany());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return User.deleteMany();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('POST /api/users', function () {

    it('Should create a new user', function () {
      let res;
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, fullname })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'fullname');
          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(username);
          expect(res.body.fullname).to.equal(fullname);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.exist;
          expect(user.id).to.equal(res.body.id);
          expect(user.fullname).to.equal(fullname);
          return user.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });

    it('Should reject users with missing username', function() {
      let res;
      return chai
        .request(app)
        .post('/api/users')
        .send({ password, fullname })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal(`Missing 'username' in request body`)
        });
    });
    it('Should reject users with missing password', function() {
        let res;
        return chai
          .request(app)
          .post('/api/users')
          .send({ username, fullname })
          .then(_res => {
            res = _res;
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal(`Missing 'password' in request body`)
          });
    });
    it('Should reject users with non-string username', function() {
        let res;
        let newUser = { username: 1231231, password: "hello", fullname: "heyo"};
        return chai
          .request(app)
          .post('/api/users')
          .send(newUser)
          .then(_res => {
              res = _res;
              expect(res).to.have.status(422);
              expect(res.body.message).to.equal(`'username' must be a string`);
          });
    });
    it('Should reject users with non-string password', function() {
        let res;
        let newUser = { username: "sup", password: 12345678, fullname: "supsup"};
        return chai
          .request(app)
          .post('/api/users')
          .send(newUser)
          .then(_res => {
              res = _res;
              expect(res).to.have.status(422);
              expect(res.body.message).to.equal(`'password' must be a string`);
          })
    });
    it('Should reject users with non-trimmed username', function() {
        let res;
        let newUser = { username: " sup ", password: "12345678", fullname: "supsup"};
        return chai
          .request(app)
          .post('/api/users')
          .send(newUser)
          .then(_res => {
              res = _res;
              expect(res).to.have.status(422);
              expect(res.body.message).to.equal(`'username' must not begin or end with an empty space`);
          })
    });
    it('Should reject users with non-trimmed password', function() {
        let res;
        let newUser = { username: "sup", password: " 12345678", fullname: "supsup"};
        return chai
          .request(app)
          .post('/api/users')
          .send(newUser)
          .then(_res => {
              res = _res;
              expect(res).to.have.status(422);
              expect(res.body.message).to.equal(`'password' must not begin or end with an empty space`);
          })
    });
    it('Should reject users with empty username', function() {
        let res;
        let newUser = { username: "", password: "12345678", fullname: "supsup"};
        return chai
          .request(app)
          .post('/api/users')
          .send(newUser)
          .then(_res => {
              res = _res;
              expect(res).to.have.status(422);
              expect(res.body.message).to.equal(`'username' must be at least 1 character`);
          })
    });
    it('Should reject users with password less than 8 characters', function() {
        let res;
        let newUser = { username: "hello", password: "isitme", fullname: "supsup"};
        return chai
          .request(app)
          .post('/api/users')
          .send(newUser)
          .then(_res => {
              res = _res;
              expect(res).to.have.status(422);
              expect(res.body.message).to.equal(`'password' must be between 8 and 72 characters in length`);
          })
    });
    it('Should reject users with password greater than 72 characters', function() {
        let res;
        let newUser = { username: "hello", password: "1234567890123456789012345678901234567890123456789012345678901234567890123", fullname: "heeeello"};
        return chai
          .request(app)
          .post('/api/users')
          .send(newUser)
          .then(_res => {
              res = _res;
              expect(res).to.have.status(422);
              expect(res.body.message).to.equal(`'password' must be between 8 and 72 characters in length`);
          })
    });
    it('Should reject users with duplicate username', function() {
        let res;
        let newUser = { username: "hello", password: "12345678", fullname: "hellogoodbye"};
        let copyUser = { username: "hello", password: "87654321", fullname: "goodbyehello"};
        return User.create(newUser)
          .then(() => {
              return chai.request(app)
                .post('/api/users')
                .send(copyUser)
                .then(_res => {
                    res = _res;
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.equal('The username already exists');
                })
          })

    });
    it('Should trim fullname', function() {
        let res;
        let newUser = { username: "nontrimmed", password: "nontrimmed", fullname: " nontrimmed " };
        return chai.request(app)
          .post('/api/users')
          .send(newUser)
          .then(_res => {
              res = _res;
              expect(res).to.have.status(201);
              expect(res.body.fullname).to.equal("nontrimmed");
          })
    });

  });
});