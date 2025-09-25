import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/players - Lister les joueurs
export const GET = requireOAuthScope(['players:read'])(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const clubId = searchParams.get('club_id');
  const position = searchParams.get('position');
  const ageMin = searchParams.get('age_min');
  const ageMax = searchParams.get('age_max');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const where: any = { userType: 'player' };
  
  if (country || clubId || position || status || ageMin || ageMax) {
    where.profile = {};
    if (country) where.profile.country = country;
    
    // Filtres sur les métadonnées
    const metadataFilters: any = {};
    if (clubId) metadataFilters.clubId = clubId;
    if (position) metadataFilters.position = position;
    if (status) metadataFilters.status = status;
    
    // Pour les filtres metadata, nous devons utiliser une approche différente
    // car Prisma ne supporte pas bien les requêtes JSON complexes
    // Nous allons filtrer côté application pour l'instant
    
    // Les filtres par âge seront appliqués côté application
  }

  // Récupérer tous les joueurs puis filtrer côté application
  let allPlayers = await prisma.user.findMany({
    where: { userType: 'player' },
    include: {
      profile: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filtrer côté application
  if (country || clubId || position || status || ageMin || ageMax) {
    allPlayers = allPlayers.filter(player => {
      if (country && player.profile?.country !== country) return false;
      
      const metadata = player.profile?.metadata as any;
      if (clubId && metadata?.clubId !== clubId) return false;
      if (position && metadata?.position !== position) return false;
      if (status && metadata?.status !== status) return false;
      
      // Filtre par âge
      if (ageMin || ageMax) {
        const birthDate = metadata?.birthDate;
        if (birthDate) {
          const birthYear = new Date(birthDate).getFullYear();
          const age = new Date().getFullYear() - birthYear;
          if (ageMin && age < parseInt(ageMin)) return false;
          if (ageMax && age > parseInt(ageMax)) return false;
        }
      }
      
      return true;
    });
  }

  const total = allPlayers.length;
  const players = allPlayers.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    players: players.map(player => ({
      id: player.id,
      email: player.email,
      firstName: player.profile?.firstName,
      lastName: player.profile?.lastName,
      country: player.profile?.country,
      phone: player.profile?.phone,
      isVerified: player.isVerified,
      createdAt: player.createdAt,
      club: (player.profile?.metadata as any)?.clubId ? {
        id: (player.profile?.metadata as any).clubId,
        name: (player.profile?.metadata as any).clubName
      } : null,
      metadata: player.profile?.metadata
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});