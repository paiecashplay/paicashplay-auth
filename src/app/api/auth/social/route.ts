import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken } from '@/lib/password';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// GET - Récupérer les providers actifs
export async function GET() {
  try {
    const providers = await prisma.identityProvider.findMany({
      where: { isEnabled: true },
      select: {
        name: true,
        displayName: true,
        type: true,
        config: true
      }
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Authentification sociale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, access_token, userType = 'donor', additionalData = {} } = body;

    if (!provider || !access_token) {
      return NextResponse.json({ 
        error: 'Provider et access_token requis' 
      }, { status: 400 });
    }

    // Récupérer la configuration du provider
    const providerConfig = await prisma.identityProvider.findFirst({
      where: { name: provider, isEnabled: true }
    });

    if (!providerConfig) {
      return NextResponse.json({ 
        error: 'Provider non configuré ou désactivé' 
      }, { status: 400 });
    }

    // Récupérer les informations utilisateur selon le provider
    let userInfo;
    try {
      userInfo = await getUserInfoFromProvider(provider, access_token, providerConfig.config as any);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Token d\'accès invalide' 
      }, { status: 400 });
    }

    if (!userInfo.email) {
      return NextResponse.json({ 
        error: 'Email non fourni par le provider' 
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
      include: { profile: true, socialAccounts: true }
    });

    if (user) {
      // Utilisateur existant - vérifier/créer le compte social
      const existingSocialAccount = user.socialAccounts.find(
        account => account.providerId === providerConfig.id
      );

      if (!existingSocialAccount) {
        // Lier le compte social à l'utilisateur existant
        await prisma.socialAccount.create({
          data: {
            userId: user.id,
            providerId: providerConfig.id,
            providerUserId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            avatar: userInfo.picture,
            accessToken: access_token
          }
        });
      } else {
        // Mettre à jour le token d'accès
        await prisma.socialAccount.update({
          where: { id: existingSocialAccount.id },
          data: {
            accessToken: access_token,
            name: userInfo.name,
            avatar: userInfo.picture
          }
        });
      }
    } else {
      // Nouvel utilisateur - créer le compte avec les données pré-remplies
      const [firstName, ...lastNameParts] = (userInfo.name || userInfo.email.split('@')[0]).split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Fusionner avec les données additionnelles du formulaire
      const profileData = {
        firstName: additionalData.firstName || firstName,
        lastName: additionalData.lastName || lastName,
        phone: additionalData.phone || null,
        country: additionalData.country || null,
        language: additionalData.language || 'fr',
        avatarUrl: userInfo.picture,
        ...additionalData.profileData
      };

      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          passwordHash: generateSecureToken(), // Mot de passe temporaire
          userType,
          isVerified: true, // Les providers sociaux vérifient l'email
          profile: {
            create: profileData
          },
          socialAccounts: {
            create: {
              providerId: providerConfig.id,
              providerUserId: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
              avatar: userInfo.picture,
              accessToken: access_token
            }
          }
        },
        include: { profile: true, socialAccounts: true }
      });
    }

    // Créer une session
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

    // Définir le cookie de session
    const cookieStore = await cookies();
    cookieStore.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        profile: user.profile
      },
      message: `Connexion ${providerConfig.displayName} réussie`
    });

  } catch (error) {
    console.error('Social auth error:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}

async function getUserInfoFromProvider(provider: string, accessToken: string, config: any) {
  let url: string;
  let headers: Record<string, string> = {};

  switch (provider) {
    case 'google':
      url = `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`;
      break;
    
    case 'facebook':
      url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;
      break;
    
    case 'linkedin':
      url = 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress,profilePicture(displayImage~:playableStreams))';
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
    
    default:
      throw new Error(`Provider ${provider} non supporté`);
  }

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Erreur ${provider}: ${response.statusText}`);
  }

  const data = await response.json();

  // Normaliser les données selon le provider
  switch (provider) {
    case 'google':
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture
      };
    
    case 'facebook':
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture?.data?.url
      };
    
    case 'linkedin':
      return {
        id: data.id,
        email: data.emailAddress,
        name: `${data.firstName?.localized?.fr_FR || data.firstName?.localized?.en_US || ''} ${data.lastName?.localized?.fr_FR || data.lastName?.localized?.en_US || ''}`.trim(),
        picture: data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier
      };
    
    default:
      return data;
  }
}