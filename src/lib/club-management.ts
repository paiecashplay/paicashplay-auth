import { prisma } from './prisma';

export class ClubManagementService {
  /**
   * Met à jour les statistiques des clubs lors du changement de club d'un joueur
   */
  static async handlePlayerClubChange(
    playerId: string,
    oldClubName: string | null,
    newClubName: string | null
  ) {
    if (oldClubName === newClubName) {
      return; // Pas de changement
    }

    try {
      // Décrémenter l'ancien club
      if (oldClubName) {
        await this.updateClubPlayerCount(oldClubName, -1);
      }

      // Incrémenter le nouveau club
      if (newClubName) {
        await this.updateClubPlayerCount(newClubName, 1);
      }

      console.log(`✅ Club change processed: ${playerId} moved from ${oldClubName || 'none'} to ${newClubName || 'none'}`);
    } catch (error) {
      console.error('Error handling player club change:', error);
      throw error;
    }
  }

  /**
   * Met à jour le nombre de joueurs d'un club
   */
  private static async updateClubPlayerCount(clubName: string, delta: number) {
    const club = await prisma.user.findFirst({
      where: {
        userType: 'club'
      },
      include: { profile: true }
    });

    if (club && (club.profile?.metadata as any)?.organizationName === clubName) {
      const metadata = club.profile?.metadata as any;
      const currentCount = metadata?.playerCount || 0;
      const newCount = Math.max(0, currentCount + delta);

      await prisma.userProfile.update({
        where: { userId: club.id },
        data: {
          metadata: {
            ...metadata,
            playerCount: newCount,
            lastPlayerUpdate: new Date().toISOString()
          }
        }
      });

      console.log(`📊 Updated ${clubName} player count: ${currentCount} → ${newCount}`);
    }
  }

  /**
   * Recalcule les statistiques d'un club en comptant réellement les joueurs
   */
  static async recalculateClubStatistics(clubName: string) {
    try {
      // Compter les joueurs réels du club
      const players = await prisma.user.findMany({
        where: {
          userType: 'player',
          isActive: true
        },
        include: { profile: true }
      });

      const clubPlayers = players.filter(player => {
        const metadata = player.profile?.metadata as any;
        return metadata?.club === clubName;
      });

      // Calculer les statistiques
      const statistics = {
        totalPlayers: clubPlayers.length,
        playersByPosition: {
          goalkeeper: clubPlayers.filter(p => (p.profile?.metadata as any)?.position === 'goalkeeper').length,
          defender: clubPlayers.filter(p => (p.profile?.metadata as any)?.position === 'defender').length,
          midfielder: clubPlayers.filter(p => (p.profile?.metadata as any)?.position === 'midfielder').length,
          forward: clubPlayers.filter(p => (p.profile?.metadata as any)?.position === 'forward').length
        },
        verifiedPlayers: clubPlayers.filter(p => p.isVerified).length,
        averageAge: clubPlayers.length > 0 ? 
          clubPlayers.reduce((sum, p) => {
            const birthDate = (p.profile?.metadata as any)?.dateOfBirth;
            if (birthDate) {
              const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
              return sum + age;
            }
            return sum;
          }, 0) / clubPlayers.length : 0
      };

      // Mettre à jour le club
      const club = await prisma.user.findFirst({
        where: {
          userType: 'club'
        },
        include: { profile: true }
      });

      if (club && (club.profile?.metadata as any)?.organizationName === clubName) {
        const metadata = club.profile?.metadata as any;
        await prisma.userProfile.update({
          where: { userId: club.id },
          data: {
            metadata: {
              ...metadata,
              playerCount: statistics.totalPlayers,
              statistics,
              lastStatisticsUpdate: new Date().toISOString()
            }
          }
        });

        console.log(`📈 Recalculated statistics for ${clubName}:`, statistics);
      }

      return statistics;
    } catch (error) {
      console.error('Error recalculating club statistics:', error);
      throw error;
    }
  }

  /**
   * Synchronise toutes les statistiques des clubs
   */
  static async syncAllClubStatistics() {
    try {
      const clubs = await prisma.user.findMany({
        where: {
          userType: 'club',
          isActive: true
        },
        include: { profile: true }
      });

      for (const club of clubs) {
        const clubName = (club.profile?.metadata as any)?.organizationName;
        if (clubName) {
          await this.recalculateClubStatistics(clubName);
        }
      }

      console.log(`🔄 Synchronized statistics for ${clubs.length} clubs`);
    } catch (error) {
      console.error('Error syncing club statistics:', error);
      throw error;
    }
  }
}