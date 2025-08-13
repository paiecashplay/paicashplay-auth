import { prisma } from './prisma';
import { signAccessToken, signRefreshToken, generateAuthCode } from './jwt';
import crypto from 'crypto';

export interface OAuthClient {
  id: string;
  client_id: string;
  client_secret: string;
  name: string;
  redirect_uris: string[];
  allowed_scopes: string[];
}

export class OAuthService {
  static async validateClient(clientId: string, clientSecret?: string): Promise<OAuthClient | null> {
    const client = await prisma.oAuthClient.findFirst({
      where: { clientId, isActive: true }
    });
    
    if (!client) return null;
    
    if (clientSecret && client.clientSecret !== clientSecret) {
      return null;
    }
    
    return {
      id: client.id,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      name: client.name,
      redirect_uris: client.redirectUris as string[],
      allowed_scopes: client.allowedScopes as string[]
    };
  }

  static async createAuthorizationCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    scope: string,
    codeChallenge?: string,
    codeChallengeMethod?: string
  ): Promise<string> {
    const code = generateAuthCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await prisma.authorizationCode.create({
      data: {
        code,
        clientId,
        userId,
        redirectUri,
        scope,
        codeChallenge,
        codeChallengeMethod,
        expiresAt
      }
    });
    
    return code;
  }

  static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{ access_token: string; refresh_token: string; token_type: string; expires_in: number } | null> {
    const authCode = await prisma.authorizationCode.findFirst({
      where: {
        code,
        clientId,
        redirectUri,
        used: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: { include: { profile: true } }
      }
    });
    
    if (!authCode || !authCode.user) return null;
    
    // Validate PKCE if present
    if (authCode.codeChallenge && authCode.codeChallengeMethod) {
      if (!codeVerifier) return null;
      
      const challenge = authCode.codeChallengeMethod === 'S256' 
        ? crypto.createHash('sha256').update(codeVerifier).digest('base64url')
        : codeVerifier;
        
      if (challenge !== authCode.codeChallenge) return null;
    }
    
    // Mark code as used
    await prisma.authorizationCode.update({
      where: { id: authCode.id },
      data: { used: true }
    });
    
    const tokenPayload = {
      sub: authCode.user.id,
      email: authCode.user.email,
      user_type: authCode.user.userType,
      scope: authCode.scope || 'openid profile email',
      client_id: clientId
    };
    
    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);
    
    // Store tokens in database
    const accessTokenRecord = await prisma.accessToken.create({
      data: {
        tokenHash: crypto.createHash('sha256').update(accessToken).digest('hex'),
        clientId,
        userId: authCode.user.id,
        scope: authCode.scope,
        expiresAt: new Date(Date.now() + 3600 * 1000)
      }
    });
    
    await prisma.refreshToken.create({
      data: {
        tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
        accessTokenId: accessTokenRecord.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000)
      }
    });
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600
    };
  }

  static async refreshAccessToken(refreshToken: string, clientId: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const refreshTokenRecord = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        accessToken: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    });
    
    if (!refreshTokenRecord || refreshTokenRecord.accessToken.clientId !== clientId) {
      return null;
    }
    
    // Revoke old tokens
    await prisma.$transaction([
      prisma.accessToken.update({
        where: { id: refreshTokenRecord.accessToken.id },
        data: { revoked: true }
      }),
      prisma.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: { revoked: true }
      })
    ]);
    
    // Generate new tokens
    const tokenPayload = {
      sub: refreshTokenRecord.accessToken.user.id,
      email: refreshTokenRecord.accessToken.user.email,
      user_type: refreshTokenRecord.accessToken.user.userType,
      scope: refreshTokenRecord.accessToken.scope || 'openid profile email',
      client_id: clientId
    };
    
    const newAccessToken = await signAccessToken(tokenPayload);
    const newRefreshToken = await signRefreshToken(tokenPayload);
    
    const newAccessTokenRecord = await prisma.accessToken.create({
      data: {
        tokenHash: crypto.createHash('sha256').update(newAccessToken).digest('hex'),
        clientId,
        userId: refreshTokenRecord.accessToken.user.id,
        scope: refreshTokenRecord.accessToken.scope,
        expiresAt: new Date(Date.now() + 3600 * 1000)
      }
    });
    
    await prisma.refreshToken.create({
      data: {
        tokenHash: crypto.createHash('sha256').update(newRefreshToken).digest('hex'),
        accessTokenId: newAccessTokenRecord.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000)
      }
    });
    
    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600
    };
  }

  static validateRedirectUri(client: OAuthClient, redirectUri: string): boolean {
    return client.redirect_uris.includes(redirectUri);
  }

  static validateScope(client: OAuthClient, scope: string): boolean {
    const requestedScopes = scope.split(' ');
    const validScopes = [
      'openid', 'profile', 'email',
      'users:read', 'users:write',
      'clubs:read', 'clubs:write', 'clubs:members',
      'players:read', 'players:write',
      'federations:read',
      'ambassadors:read', 'ambassadors:write'
    ];
    
    return requestedScopes.every(s => 
      validScopes.includes(s) && client.allowed_scopes.includes(s)
    );
  }

  static async revokeToken(token: string, tokenType: 'access_token' | 'refresh_token') {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    if (tokenType === 'access_token') {
      await prisma.accessToken.updateMany({
        where: { tokenHash },
        data: { revoked: true }
      });
    } else {
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true }
      });
    }
  }
}