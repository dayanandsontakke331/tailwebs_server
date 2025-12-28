const express = require('express');
require('dotenv').config();
require('./config/db');
const cors = require('cors');
const path = require('path');
const endpoints = require('./routes');

const PORT = process.env.PORT || 1337;
const app = express();

// middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static_data', express.static(path.join(__dirname, 'static_data')));

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.publicMessage || 'Something went wrong'
  });
});

// Routes (Root)
app.use('/api/v1', endpoints);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
