import { prisma } from './prisma';

/**
 * Service pour synchroniser les informations de profil avec les sessions actives
 */
export class SessionSyncService {
  /**
   * Invalide toutes les sessions d'un utilisateur (utile lors de changements critiques)
   */
  static async invalidateUserSessions(userId: string): Promise<void> {
    try {
      await prisma.userSession.updateMany({
        where: {
          userId: userId,
          expiresAt: { gt: new Date() }
        },
        data: {
          expiresAt: new Date() // Expire immédiatement
        }
      });
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
    }
  }

/**
   * Récupère l'URL de l'avatar avec fallback sur les comptes sociaux
   */
  static getAvatarUrl(profile: any, socialAccounts: any[]): string | null {
    // Priorité à l'avatar uploadé
    if (profile?.avatarUrl) {
      return profile.avatarUrl;
    }

    // Fallback sur l'avatar des comptes sociaux
    const socialAvatar = socialAccounts?.find(account => account.avatar)?.avatar;
    return socialAvatar || null;
  }

  /**
   * Formate le nom complet avec fallback sur l'email
   */
  static getDisplayName(profile: any, email: string): string {
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return email;
  }
}