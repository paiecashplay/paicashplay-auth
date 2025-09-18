import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ClubManagementService } from '@/lib/club-management';
import jwt from 'jsonwebtoken';

// Middleware OAuth pour vérifier le token
async function requireOAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que le token existe en base et n'est pas révoqué
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
    const accessToken = await prisma.accessToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (!accessToken) {
      return null;
    }
    
    // Vérifier que le token a les bons scopes
    const scopes = (accessToken.scope || decoded.scope || '').split(' ');
    if (!scopes.includes('players:write')) {
      return null;
    }

    return { userId: decoded.sub, scopes, clientId: decoded.client_id };
  } catch (error) {
    console.error('OAuth token validation error:', error);
    return null;
  }
}

// PUT /api/oauth/players/[id] - Mise à jour d'un joueur via OAuth
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔄 Player update request for ID:', id);
    
    // Vérifier l'authentification OAuth
    const auth = await requireOAuth(request);
    if (!auth) {
      console.error('OAuth authentication failed for player update:', id);
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired OAuth token, or missing players:write scope' 
      }, { status: 401 });
    }
    
    console.log('✅ OAuth authentication successful:', { userId: auth.userId, scopes: auth.scopes });
    
    // Vérifier que le joueur existe et est actif
    console.log('🔍 Looking for player:', id);

    const body = await request.json();
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    const { 
      firstName, 
      lastName, 
      phone, 
      country, 
      language,
      height,
      weight,
      avatarUrl,
      metadata 
    } = body;
    
    // Validation des champs obligatoires uniquement
    if (firstName !== undefined && (!firstName || firstName.trim() === '')) {
      return NextResponse.json({ 
        error: 'firstName is required and cannot be empty' 
      }, { status: 400 });
    }
    
    if (lastName !== undefined && (!lastName || lastName.trim() === '')) {
      return NextResponse.json({ 
        error: 'lastName is required and cannot be empty' 
      }, { status: 400 });
    }
    
    if (country !== undefined && (!country || country.trim() === '')) {
      return NextResponse.json({ 
        error: 'country is required and cannot be empty' 
      }, { status: 400 });
    }

    // Vérifier que le joueur existe et est actif
    const player = await prisma.user.findFirst({
      where: {
        id,
        userType: 'player',
        isActive: true
      },
      include: { profile: true }
    });

    if (!player) {
      console.error('❌ Player not found:', id);
      return NextResponse.json({ 
        error: 'Player not found',
        playerId: id
      }, { status: 404 });
    }
    
    console.log('✅ Player found:', { id: player.id, userType: player.userType, isActive: player.isActive });

    // Récupérer le profil actuel pour détecter les changements de club
    const currentClub = (player.profile?.metadata as any)?.club;
    const newClub = metadata?.club;
    const clubChanged = currentClub !== newClub;

    // Validation pour les joueurs
    if (metadata) {
      const { position, dateOfBirth } = metadata;
      console.log('🔍 Validating metadata:', { position, dateOfBirth });
      
      if (position && !['goalkeeper', 'defender', 'midfielder', 'forward'].includes(position)) {
        console.error('❌ Invalid position:', position);
        return NextResponse.json({ 
          error: 'Invalid position. Must be: goalkeeper, defender, midfielder, forward',
          received: position
        }, { status: 400 });
      }
      
      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        console.log('🎂 Age validation:', { dateOfBirth, age });
        if (age < 6 || age > 40) {
          console.error('❌ Invalid age:', age);
          return NextResponse.json({ 
            error: 'Age must be between 6 and 40 years',
            received: age
          }, { status: 400 });
        }
      }
    }

    // Préparer les données de mise à jour (seulement les champs fournis)
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (language !== undefined) updateData.language = language;
    if (height !== undefined) updateData.height = height ? parseFloat(height.toString()) : null;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight.toString()) : null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    
    if (metadata !== undefined) {
      const currentMetadata = player.profile?.metadata as any || {};
      const newMetadata = { ...currentMetadata, ...metadata };
      
      // Si aucun club n'est spécifié ou si c'est "Club non renseigné", assigner le club par défaut
      if (!newMetadata.club || newMetadata.club === 'Club non renseigné') {
        newMetadata.club = 'PaieCashPlay Club';
      }
      
      updateData.metadata = newMetadata;
    }
    
    console.log('🔄 Update data:', updateData);
    
    // Mettre à jour le profil
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: id },
      data: updateData
    });

    // Si le club a changé, mettre à jour les statistiques des clubs
    if (clubChanged) {
      await ClubManagementService.handlePlayerClubChange(id, currentClub, newClub);
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      clubChanged
    });

  } catch (error) {
    console.error('OAuth player update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}