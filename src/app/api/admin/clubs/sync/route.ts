import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { ClubManagementService } from '@/lib/club-management';

// POST /api/admin/clubs/sync - Synchroniser les statistiques des clubs
export const POST = requireAdmin(async (request: NextRequest, admin: any) => {
  try {
    const body = await request.json();
    const { clubName } = body;

    if (clubName) {
      // Synchroniser un club spécifique
      const statistics = await ClubManagementService.recalculateClubStatistics(clubName);
      
      return NextResponse.json({
        success: true,
        message: `Statistics synchronized for ${clubName}`,
        statistics
      });
    } else {
      // Synchroniser tous les clubs
      await ClubManagementService.syncAllClubStatistics();
      
      return NextResponse.json({
        success: true,
        message: 'All club statistics synchronized'
      });
    }
  } catch (error) {
    console.error('Club sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to synchronize club statistics' 
    }, { status: 500 });
  }
});