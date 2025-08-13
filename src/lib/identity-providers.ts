import { prisma } from './prisma';
import { ProviderType } from '@prisma/client';

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export class IdentityProviderService {
  static async getEnabledProviders() {
    return await prisma.identityProvider.findMany({
      where: { isEnabled: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        type: true
      }
    });
  }

  static async getProvider(name: string) {
    return await prisma.identityProvider.findUnique({
      where: { name }
    });
  }

  static async createProvider(data: {
    name: string;
    displayName: string;
    type: ProviderType;
    clientId: string;
    clientSecret: string;
    config?: any;
  }) {
    return await prisma.identityProvider.upsert({
      where: { name: data.name },
      update: {
        displayName: data.displayName,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        config: data.config
      },
      create: data
    });
  }

  static async updateProvider(id: string, data: any) {
    return await prisma.identityProvider.update({
      where: { id },
      data
    });
  }

  static async deleteProvider(id: string) {
    return await prisma.identityProvider.delete({
      where: { id }
    });
  }

  static getAuthUrl(provider: any, state: string): string {
    const baseUrls = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization'
    };

    const scopes = {
      google: 'openid email profile',
      facebook: 'email public_profile',
      linkedin: 'r_liteprofile r_emailaddress'
    };

    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      throw new Error('NEXTAUTH_URL doit être définie pour les providers sociaux');
    }
    const redirectUri = `${baseUrl}/auth/${provider.name}/callback`;
    
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      scope: scopes[provider.type as keyof typeof scopes] || 'email profile',
      response_type: 'code',
      state
    });

    return `${baseUrls[provider.type as keyof typeof baseUrls]}?${params.toString()}`;
  }

  static async exchangeCodeForToken(provider: any, code: string): Promise<any> {
    const tokenUrls = {
      google: 'https://oauth2.googleapis.com/token',
      facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
      linkedin: 'https://www.linkedin.com/oauth/v2/accessToken'
    };

    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      throw new Error('NEXTAUTH_URL doit être définie pour les providers sociaux');
    }
    const redirectUri = `${baseUrl}/auth/${provider.name}/callback`;

    const response = await fetch(tokenUrls[provider.type as keyof typeof tokenUrls], {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    return await response.json();
  }

  static async getUserProfile(provider: any, accessToken: string): Promise<UserProfile> {
    const profileUrls = {
      google: 'https://www.googleapis.com/oauth2/v2/userinfo',
      facebook: 'https://graph.facebook.com/me?fields=id,name,email,picture',
      linkedin: 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)'
    };

    const response = await fetch(profileUrls[provider.type as keyof typeof profileUrls], {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await response.json();

    // Normalize profile data
    switch (provider.type) {
      case 'google':
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          firstName: data.given_name,
          lastName: data.family_name,
          avatar: data.picture
        };
      case 'facebook':
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.picture?.data?.url
        };
      case 'linkedin':
        return {
          id: data.id,
          email: data.emailAddress,
          name: `${data.firstName?.localized?.en_US || ''} ${data.lastName?.localized?.en_US || ''}`.trim(),
          firstName: data.firstName?.localized?.en_US,
          lastName: data.lastName?.localized?.en_US
        };
      default:
        return data;
    }
  }

  static async linkSocialAccount(userId: string, providerId: string, profile: UserProfile, tokens: any) {
    // Check if account exists
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        providerId: providerId,
        providerUserId: profile.id
      }
    });

    const accountData = {
      email: profile.email || null,
      name: profile.name || null,
      avatar: profile.avatar || null,
      accessToken: tokens.access_token || null,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
    };

    if (existingAccount) {
      return await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: accountData
      });
    } else {
      return await prisma.socialAccount.create({
        data: {
          userId,
          providerId,
          providerUserId: profile.id,
          ...accountData
        }
      });
    }
  }

  static async findUserBySocialAccount(providerId: string, providerUserId: string) {
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        providerId: providerId,
        providerUserId: providerUserId
      },
      include: { user: { include: { profile: true } } }
    });

    return socialAccount?.user;
  }
}