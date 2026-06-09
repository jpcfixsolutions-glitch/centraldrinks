import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'desarrollo_secreto_inseguro';
const EXPIRES_IN = '1d';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
