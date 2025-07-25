import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export interface TokenPayload {
  sub: string;
  email: string;
  user_type: string;
  scope?: string;
  client_id?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export async function signAccessToken(payload: TokenPayload, expiresIn = '1h'): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (expiresIn === '1h' ? 3600 : 86400);
  
  return await new SignJWT({ ...payload, jti: uuidv4() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .setIssuer(process.env.ISSUER || 'https://auth.paiecashplay.com')
    .sign(secret);
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (30 * 24 * 3600); // 30 days
  
  return await new SignJWT({ ...payload, jti: uuidv4() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .setIssuer(process.env.ISSUER || 'https://auth.paiecashplay.com')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as TokenPayload;
}

export function generateAuthCode(): string {
  return uuidv4().replace(/-/g, '');
}