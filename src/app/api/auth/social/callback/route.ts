import { NextRequest, NextResponse } from 'next/server';
import { IdentityProviderService } from '@/lib/identity-providers';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, code, state } = body;

    if (!provider || !code || !state) {
      return NextResponse.json({ 
        error: 'Paramètres manquants' 
      }, { status: 400 });
    }

    // Récupérer la configuration du provider
    const providerConfig = await IdentityProviderService.getProvider(provider);
    if (!providerConfig || !providerConfig.isEnabled) {
      return NextResponse.json({ 
        error: 'Provider non configuré ou désactivé' 
      }, { status: 400 });
    }

    // Échanger le code contre un access token
    const tokens = await IdentityProviderService.exchangeCodeForToken(providerConfig, code);
    if (!tokens.access_token) {
      return NextResponse.json({ 
        error: 'Impossible d\'obtenir le token d\'accès' 
      }, { status: 400 });
    }

    // Récupérer le profil utilisateur
    const userProfile = await IdentityProviderService.getUserProfile(providerConfig, tokens.access_token);
    if (!userProfile.email) {
      return NextResponse.json({ 
        error: 'Email non fourni par le provider' 
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email: userProfile.email },
      include: { profile: true, socialAccounts: true }
    });

    const { mode = 'login', userType = 'donor', additionalData = {} } = state;

    if (user) {
      // Utilisateur existant - lier le compte social s'il n'existe pas
      const existingSocialAccount = user.socialAccounts.find(
        account => account.providerId === providerConfig.id
      );

      if (!existingSocialAccount) {
        await IdentityProviderService.linkSocialAccount(
          user.id, 
          providerConfig.id, 
          userProfile, 
          tokens
        );
      }

      // Créer une session avec JWT
      const jwt = require('jsonwebtoken');
      const sessionToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken,
          expiresAt,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
      
      console.log('✅ JWT session created for user:', user.email);

      // Définir le cookie de session
      const cookieStore = await cookies();
      cookieStore.set('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      });
      


      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
          profile: user.profile
        }
      });
    } else {
      // Utilisateur n'existe pas
      if (mode === 'login') {
        return NextResponse.json({ 
          error: 'Aucun compte trouvé avec cette adresse email. Veuillez vous inscrire d\'abord.' 
        }, { status: 404 });
      } else {
        // Mode inscription - retourner les données pour pré-remplir le formulaire
        const [firstName, ...lastNameParts] = (userProfile.name || userProfile.email.split('@')[0]).split(' ');
        const lastName = lastNameParts.join(' ') || '';

        return NextResponse.json({
          requiresSignup: true,
          socialData: {
            provider: provider,
            providerUserId: userProfile.id,
            email: userProfile.email,
            firstName: userProfile.firstName || firstName,
            lastName: userProfile.lastName || lastName,
            avatar: userProfile.avatar,
            accessToken: tokens.access_token
          }
        });
      }
    }

  } catch (error) {
    console.error('Social callback error:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}