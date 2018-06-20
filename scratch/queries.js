'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

mongoose.connect(MONGODB_URI)
  .then(() => {

    /**
     * Find/Search for notes using Note.find
     */
    const searchTerm = 'gaga';
    let filter = {};

    if (searchTerm) {
      // Using the `$regex` operator (case-sensitive by default)
      filter.title = { $regex: searchTerm };

      // Using the `$regex` operator with case-insensitive `i` option
      // filter.title = { $regex: searchTerm, $options: 'i' };

      // Alternative using regex `/pattern/i` but not recommended
      // filter.title = /ways/i;
    }

    return Note.find(filter).sort({ updatedAt: 'desc' })
      .then(results => {
        console.log(results);
      });

    /**
     * Find note by id using Note.findById
     */
    // return Note.findById('000000000000000000000003')
    //   .then(result => {
    //     if (result) {
    //       console.log(result);
    //     } else {
    //       console.log('not found');
    //     }
    //   });

    /**
     * Create a new note using Note.create
     */
    // const newNote = {
    //   title: 'this is a new note',
    //   content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    // };
    //
    // return Note.create(newNote)
    //   .then(result => {
    //     console.log(result);
    //   });

    /**
     * Update a note by id using Note.findByIdAndUpdate
     */
    // const updateNote = {
    //   title: 'updated title',
    //   content: 'Posuere sollicitudin aliquam ultrices sagittis orci a. Feugiat sed lectus vestibulum mattis ullamcorper velit. Odio pellentesque diam volutpat commodo sed egestas egestas fringilla. Velit egestas dui id ornare arcu odio. Molestie at elementum eu facilisis sed odio morbi. Tempor nec feugiat nisl pretium. At tempor commodo ullamcorper a lacus. Egestas dui id ornare arcu odio. Id cursus metus aliquam eleifend. Vitae sapien pellentesque habitant morbi tristique. Dis parturient montes nascetur ridiculus. Egestas egestas fringilla phasellus faucibus scelerisque eleifend. Aliquam faucibus purus in massa tempor nec feugiat nisl.'
    // };

    // return Note.findByIdAndUpdate('000000000000000000000003', updateNote, { new: true })
    //   .then(result => {
    //     if (result) {
    //       console.log(result);
    //     } else {
    //       console.log('not found');
    //     }
    //   });

    /**
     * Delete a note by id using Note.findByIdAndRemove
     */
    // return Note.findByIdAndRemove('000000000000000000000004')
    //   .then(result => {
    //     console.log('deleted', result);
    //   });

  })
  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
