const mongoose = require('mongoose');

const dbURL = process.env.MONGODB_URI;

mongoose.connect(dbURL);

const connection = mongoose.connection;

connection.on('connected', () => {});

connection.on('error', (err) => {
  console.log('Database connection error', err);
});

module.exports = connection;
