import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Sign JWT token
const signJwt = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Verify JWT token
const verifyJwt = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Decode JWT token without verification
const decodeJwt = (token) => {
  return jwt.decode(token);
};

export {
  signJwt,
  verifyJwt,
  decodeJwt,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
