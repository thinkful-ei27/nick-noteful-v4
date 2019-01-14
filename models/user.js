'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    fullName: {type: String},
    userName: {type: String, required: true, unique: true},
    password: {type: String, required: true}
});

schema.set('toJSON', {
    virtuals: true, 
    transform: (doc, result) => {
        delete result._id;
        delete result.__v;
        delete result.password;
    }
});

module.exports = mongoose.model('User', schema);