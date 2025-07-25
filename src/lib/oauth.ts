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
    scope: string
  ): Promise<string> {
    const code = generateAuthCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store in user session temporarily (you might want a separate table)
    await prisma.userSession.create({
      data: {
        userId,
        sessionToken: code,
        expiresAt,
        ipAddress: 'oauth',
        userAgent: `oauth_${clientId}`
      }
    });
    
    return code;
  }

  static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    redirectUri: string
  ): Promise<{ access_token: string; refresh_token: string; token_type: string; expires_in: number } | null> {
    // Get and validate authorization code
    const authCode = await prisma.userSession.findFirst({
      where: {
        sessionToken: code,
        userAgent: `oauth_${clientId}`,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });
    
    if (!authCode || !authCode.user) return null;
    
    // Delete used code
    await prisma.userSession.delete({ where: { id: authCode.id } });
    
    // Generate tokens
    const tokenPayload = {
      sub: authCode.user.id,
      email: authCode.user.email,
      user_type: authCode.user.userType,
      scope: 'openid profile email',
      client_id: clientId
    };
    
    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600
    };
  }

  static validateRedirectUri(client: OAuthClient, redirectUri: string): boolean {
    return client.redirect_uris.includes(redirectUri);
  }

  static validateScope(client: OAuthClient, scope: string): boolean {
    const requestedScopes = scope.split(' ');
    return requestedScopes.every(s => client.allowed_scopes.includes(s));
  }
}