'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const express = require('express');
const sinon = require('sinon');

const app = require('../server');
const Tag = require('../models/tag');
const Note = require('../models/note');
const Folder = require('../models/folder');
const { folders, notes, tags } = require('../db/data');
const { TEST_MONGODB_URI } = require('../config');

chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('Noteful API - Notes', function () {

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
      .then(() => Promise.all([
        Note.deleteMany(),
        Folder.deleteMany(),
        Tag.deleteMany()
      ]));
  });

  beforeEach(function () {
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Tag.insertMany(tags)
    ]);
  });

  afterEach(function () {
    sandbox.restore();
    return Promise.all([
      Note.deleteMany(),
      Folder.deleteMany(),
      Tag.deleteMany()
    ]);
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function () {

    it('should return the correct number of Notes', function () {
      return Promise.all([
        Note.find(),
        chai.request(app).get('/api/notes')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list sorted desc with the correct right fields', function () {
      return Promise.all([
        Note.find().sort({ updatedAt: 'desc' }),
        chai.request(app).get('/api/notes')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            // Note: folderId, tags and content are optional
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'tags');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for a title search', function () {
      const searchTerm = 'lady gaga';

      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Note
        .find({ $or: [{ title: re }, { content: re }] })
        .sort({ updatedAt: 'desc' });

      const apiPromise = chai.request(app)
        .get(`/api/notes?searchTerm=${searchTerm}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'tags'); // Note: folderId and content are optional
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for content search', function () {
      const searchTerm = 'lorem ipsum';
      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Note
        .find({ $or: [{ title: re }, { content: re }] })
        .sort({ updatedAt: 'desc' });
      const apiPromise = chai.request(app).get(`/api/notes?searchTerm=${searchTerm}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'tags'); // Note: folderId and content are optional
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for a folderId query', function () {
      let data;
      return Folder.findOne()
        .then((_data) => {
          data = _data;
          return Promise.all([
            Note.find({ folderId: data.id }),
            chai.request(app).get(`/api/notes?folderId=${data.id}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return correct search results for a tagId query', function () {
      let data;
      return Tag.findOne()
        .then((_data) => {
          data = _data;
          return Promise.all([
            Note.find({ tags: data.id }),
            chai.request(app).get(`/api/notes?tagId=${data.id}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return an empty array for an incorrect query', function () {
      const searchTerm = 'NOT-A-VALID-QUERY';
      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Note.find({
        $or: [{ title: re }, { content: re }]
      }).sort({ updatedAt: 'desc' });
      const apiPromise = chai.request(app).get(`/api/notes?searchTerm=${searchTerm}`);
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Note.schema.options.toJSON, 'transform').throws('FakeError');

      return chai.request(app).get('/api/notes')
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

  describe('GET /api/notes/:id', function () {

    it('should return correct notes', function () {
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          // Note: folderId, tags and content are optional
          expect(res.body).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      return chai.request(app)
        .get('/api/notes/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .get('/api/notes/DOESNOTEXIST')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Note.schema.options.toJSON, 'transform').throws('FakeError');
      return Note.findOne()
        .then(data => {
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

  describe('POST /api/notes', function () {

    it('should create and return a new item when provided valid title and content', function () {
      const newItem = {
        title: 'The best article about cats ever!',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      let res;
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'tags');
          return Note.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should create and return a new item when provided valid title (content optional)', function () {
      const newItem = {
        title: 'The best article about cats ever!'
      };
      let res;
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'title', 'createdAt', 'updatedAt', 'tags');
          return Note.findOne({ _id: res.body.id });
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.not.exist;
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should create and return when folderId is an empty string', function () {
      const newItem = {
        title: 'The best article about cats ever!',
        folderId: ''
      };
      let res;
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'createdAt', 'updatedAt', 'tags');
          return Note.findOne({ _id: res.body.id });
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.folderId).to.not.exist;
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when "title" is empty string', function () {
      const newItem = { title: '' };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when `folderId` is not valid ', function () {
      const newItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        folderId: 'NOT-A-VALID-ID'
      };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `folderId` is not valid');
        });
    });

    it('should return an error when a tag `id` is not valid ', function () {
      const newItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        tags: ['NOT-A-VALID-ID']
      };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `tags` array contains an invalid `id`');
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Note.schema.options.toJSON, 'transform').throws('FakeError');

      const newItem = {
        title: 'The best article about cats ever!',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };

      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

  describe('PUT /api/notes/:id', function () {

    it('should update the note when provided a valid title', function () {
      const updateItem = {
        title: 'What about dogs?!'
      };
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.folderId).to.equal(data.folderId.toString());
          expect(res.body.tags).to.deep.equal(data.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should update the note when provided valid content', function () {
      const updateItem = {
        content: 'Lorem ipsum dolor sit amet...',
      };
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(updateItem.content);
          expect(res.body.folderId).to.equal(data.folderId.toString());
          expect(res.body.tags).to.deep.equal(data.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should update the note when provided a valid folderId', function () {
      const updateItem = {};
      let data;

      return Promise.all([
        Folder.findOne(),
        Note.findOne()
      ])
        .then(([folder, note]) => {
          updateItem.folderId = folder.id;
          data = note;
          return chai.request(app).put(`/api/notes/${note.id}`).send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.folderId).to.equal(updateItem.folderId);
          expect(res.body.tags).to.deep.equal(data.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should update the note when provided a valid tag', function () {
      const updateItem = {
        tags: []
      };
      let data;

      return Promise.all([
        Tag.findOne(),
        Note.findOne()
      ])
        .then(([tag, note]) => {
          updateItem.tags.push(tag.id);
          data = note;
          return chai.request(app).put(`/api/notes/${note.id}`).send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.folderId).to.equal(data.folderId.toString());
          expect(res.body.tags).to.deep.equal(updateItem.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function () {
      const updateItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .put('/api/notes/NOT-A-VALID-ID')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      const updateItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .put('/api/notes/DOESNOTEXIST')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when "title" is an empty string', function () {
      const updateItem = { title: '' };
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when `folderId` is not valid ', function () {
      const updateItem = {
        folderId: 'NOT-A-VALID-ID'
      };
      return Note.findOne()
        .then(data => {
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `folderId` is not valid');
        });
    });

    it('should unset a note folderId when provided a empty string', function () {
      const updateItem = {
        folderId: ''
      };
      let data;

      return Note.findOne({ folderId: { $exists: true } })
        .then((note) => {
          data = note;
          return chai.request(app).put(`/api/notes/${note.id}`).send(updateItem);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.folderId).to.not.exist;
          expect(res.body.tags).to.deep.equal(data.tags);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          // expect note to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should return an error when a tag `id` is not valid ', function () {
      const updateItem = {
        tags: ['NOT-A-VALID-ID']
      };
      return Note.findOne()
        .then(data => {
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `tags` array contains an invalid `id`');
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(Note.schema.options.toJSON, 'transform').throws('FakeError');

      const updateItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return Note.findOne()
        .then(data => {
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

  describe('DELETE /api/notes/:id', function () {

    it('should delete an existing document and respond with 204', function () {
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/notes/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Note.count({ _id: data.id });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      return chai.request(app)
        .delete('/api/notes/NOT-A-VALID-ID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(express.response, 'sendStatus').throws('FakeError');
      return Note.findOne()
        .then(data => {
          return chai.request(app).delete(`/api/notes/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });

  });

});
