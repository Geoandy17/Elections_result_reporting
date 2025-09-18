import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// export function generateToken(payload: TokenPayload): string {
//   return jwt.sign(payload as object, JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN || '7d',
//   });
// }

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function getTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  const [type, token] = authorization.split(' ');
  if (type !== 'Bearer') return null;
  return token;
}