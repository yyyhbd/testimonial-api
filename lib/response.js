const success = (res, code, message, data = null, extra = {}) =>
  res.status(code).json({ code, status: 'success', message, data, ...extra });

const failure = (res, code, message) =>
  res.status(code).json({ code, status: 'failure', message });

const handleError = (res, err, context) => {
  console.error(`[${context}]`, err);

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    return failure(res, 400, message);
  }

  if (err.name === 'CastError') {
    return failure(res, 400, `Invalid value for field "${err.path}"`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ') || 'field';
    return failure(res, 400, `Value for ${field} already exists`);
  }

  return failure(res, 500, 'Internal server error');
};

module.exports = { success, failure, handleError };
