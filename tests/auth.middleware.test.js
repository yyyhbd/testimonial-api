process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  test('returns 401 when the Authorization header is missing', () => {
    const res = createRes();
    const next = jest.fn();

    authenticate({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'failure', code: 401 }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when the scheme is not Bearer', () => {
    const res = createRes();
    const next = jest.fn();

    authenticate({ headers: { authorization: 'Basic abc' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for an invalid token', () => {
    const res = createRes();
    const next = jest.fn();

    authenticate({ headers: { authorization: 'Bearer not-a-token' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for a token signed with another secret', () => {
    const res = createRes();
    const next = jest.fn();
    const token = jwt.sign({ userId: 1, email: 'a@b.com' }, 'other-secret');

    authenticate({ headers: { authorization: `Bearer ${token}` } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for an expired token', () => {
    const res = createRes();
    const next = jest.fn();
    const token = jwt.sign({ userId: 1, email: 'a@b.com' }, 'test-secret', { expiresIn: -10 });

    authenticate({ headers: { authorization: `Bearer ${token}` } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token has expired' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches the decoded user to req.user and calls next for a valid token', () => {
    const res = createRes();
    const next = jest.fn();
    const req = {
      headers: {
        authorization: `Bearer ${jwt.sign({ userId: 7, email: 'a@b.com' }, 'test-secret')}`,
      },
    };

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ userId: 7, email: 'a@b.com' });
    expect(res.status).not.toHaveBeenCalled();
  });
});
