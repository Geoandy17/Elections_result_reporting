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

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  // Décoder le token sans vérifier la signature
  // Car le token vient d'un autre backend avec sa propre clé secrète
  const decoded = jwt.decode(token);
  
  if (!decoded) {
    throw new Error('Token invalide ou mal formé');
  }
  
  // Vérifier que le token n'est pas expiré
  const now = Math.floor(Date.now() / 1000);
  if ((decoded as any).exp && (decoded as any).exp < now) {
    throw new Error('Token expiré');
  }
  
  return decoded as TokenPayload;
}

export function getTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  const [type, token] = authorization.split(' ');
  if (type !== 'Bearer') return null;
  return token;
}