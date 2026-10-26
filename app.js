require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const authRoute = require('./routes/authRoute');
const { failure } = require('./lib/response');
const { DEFAULTS } = require('./lib/constants');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoute);

app.use((req, res) => failure(res, 404, 'Route not found'));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return failure(res, 400, 'Invalid JSON in request body');
  }
  if (err.type === 'entity.too.large') {
    return failure(res, 400, 'Request body is too large');
  }
  console.error('[app.unhandled]', err);
  return failure(res, 500, 'Internal server error');
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

const start = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in');
    process.exit(1);
  }

  const port = process.env.PORT || DEFAULTS.PORT;
  const mongoUri = process.env.MONGODB_URI || DEFAULTS.MONGODB_URI;

  try {
    await await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');
    app.listen(port, () => console.log(`Server is running on port ${port}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;
