'use strict';

const bcrypt = require('bcryptjs');
const password = 'baseball';

bcrypt.hash(password, 10)
  .then(digest => {
      console.log('digest = ', digest);
      return digest;
  })
  .catch(err => {
      console.error('error', err);
  });

  const password1 = 'soccer';

  bcrypt.hash(password1, 10)
    .then(digest => {
        console.log('digest = ', digest);
        return digest;
    })
    .catch(err => {
        console.error('error', err);
    });