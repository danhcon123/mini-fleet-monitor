const bcrypt = require('bcrypt');

const password = 'token123';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
});