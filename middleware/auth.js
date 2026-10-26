const jwt = require('jsonwebtoken');
const { failure } = require('../lib/response');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return failure(res, 401, 'Authorization token is missing. Use header: Authorization: Bearer <token>');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!Number.isInteger(decoded.userId)) {
      return failure(res, 401, 'Invalid token payload');
    }

    req.user = decoded;
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
    return failure(res, 401, message);
  }
};

module.exports = { authenticate };
