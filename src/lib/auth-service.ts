import { hashPassword, verifyPassword, generateSecureToken } from './password';
import { UserType } from '@/types/auth';
import { prisma } from './prisma';
import { RateLimitService } from './rate-limit';
import { AuditService } from './audit';

// Fonction utilitaire pour créer un club automatiquement
async function createClubForPlayer(clubName: string, country: string, federationName?: string) {
  const clubEmail = `${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${country.toLowerCase().replace(/[^a-z0-9]/g, '')}@paiecashplay.com`;
  const defaultPassword = await hashPassword('defaultclub123');

  await prisma.user.create({
    data: {
      email: clubEmail,
      passwordHash: defaultPassword,
      userType: 'club',
      isVerified: false,
      profile: {
        create: {
          firstName: 'Club',
          lastName: 'Administrateur',
          country: country,
          metadata: {
            organizationName: clubName,
            federation: federationName || null,
            isAutoCreated: true,
            createdByPlayer: true
          }
        }
      }
    }
  });
}


export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  phone?: string;
  country?: string;
  isPartner?: boolean;
  metadata?: any;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  static async createUser(userData: CreateUserData, ipAddress?: string, userAgent?: string) {
    const { ensurePrismaReady } = await import('./prisma');
    await ensurePrismaReady();
    const { email, password, firstName, lastName, userType, phone, country, isPartner, metadata } = userData;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Pour les joueurs, gérer l'association au club
    let finalMetadata = metadata || {};
    if (userType === 'player' && finalMetadata.club) {
      // Vérifier si le club existe
      const allClubs = await prisma.user.findMany({
        where: {
          userType: 'club',
          isActive: true
        },
        include: {
          profile: {
            select: {
              country: true,
              metadata: true
            }
          }
        }
      });
      
      const existingClub = allClubs.find(club => {
        const metadata = club.profile?.metadata as any;
        const clubName = metadata?.organizationName;
        return clubName === finalMetadata.club && club.profile?.country === country;
      });

      // Si le club n'existe pas, le créer automatiquement
      if (!existingClub && country) {
        try {
          await createClubForPlayer(finalMetadata.club, country, finalMetadata.federation);
          console.log(`✅ Club created for player: ${finalMetadata.club}`);
        } catch (error) {
          console.error('Error creating club for player:', error);
          // Continuer même si la création du club échoue
        }
      }
    } else if (userType === 'player' && !finalMetadata.club) {
      // Si aucun club n'est spécifié, associer au club par défaut
      const defaultClub = await prisma.user.findFirst({
        where: {
          userType: 'club',
          email: 'club@paiecashplay.com'
        },
        include: { profile: true }
      });
      
      const clubMetadata = defaultClub?.profile?.metadata as any;
      if (clubMetadata?.organizationName) {
        finalMetadata.club = clubMetadata.organizationName;
      } else {
        finalMetadata.club = 'PaieCashPlay Club';
      }
    }
    
    // Create user and profile in transaction
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        userType,
        profile: {
          create: {
            firstName,
            lastName,
            phone: phone || null,
            country: country || null,
            isPartner: isPartner || false,
            metadata: finalMetadata
          }
        }
      },
      include: { profile: true }
    });
    
    // Create email verification token
    const verificationToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt
      }
    });
    
    await AuditService.logUserAction(user.id, 'user_created', 'user', user.id, { 
      newValues: { email, userType, firstName, lastName }, ipAddress, userAgent 
    });
    
    return { userId: user.id, verificationToken };
  }
  
  static async loginUser(loginData: LoginData, ipAddress?: string, userAgent?: string) {
    const { ensurePrismaReady } = await import('./prisma');
    await ensurePrismaReady();
    const { email, password } = loginData;
    
    // Check rate limit
    const rateLimitKey = RateLimitService.generateKey(email, 'login');
    const rateLimit = await RateLimitService.checkRateLimit(rateLimitKey, 'login');
    if (!rateLimit.allowed) {
      await AuditService.logUserAction('', 'login_rate_limited', 'auth', undefined, { 
        newValues: { email }, ipAddress, userAgent 
      });
      throw new Error('Too many login attempts. Please try again later.');
    }
    
    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (!user) {
      await AuditService.logUserAction('', 'login_failed', 'auth', undefined, { 
        newValues: { email, reason: 'user_not_found' }, ipAddress, userAgent 
      });
      throw new Error('Invalid credentials');
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await AuditService.logUserAction(user.id, 'login_blocked', 'auth', undefined, { 
        newValues: { reason: 'account_locked' }, ipAddress, userAgent 
      });
      throw new Error('Account is temporarily locked. Please try again later.');
    }
    
    if (!user.isActive) {
      await AuditService.logUserAction(user.id, 'login_failed', 'auth', undefined, { 
        newValues: { reason: 'account_deactivated' }, ipAddress, userAgent 
      });
      throw new Error('Account is deactivated');
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1;
      const shouldLock = newAttempts >= 5;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 min lock
        }
      });
      
      await AuditService.logUserAction(user.id, 'login_failed', 'auth', undefined, { 
        newValues: { reason: 'invalid_password', attempts: newAttempts }, ipAddress, userAgent 
      });
      
      throw new Error('Invalid credentials');
    }
    
    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null
      }
    });
    
    // Create session
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt
      }
    });
    
    await AuditService.logUserAction(user.id, 'login_success', 'auth', undefined, { 
      ipAddress, userAgent 
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        isVerified: user.isVerified
      },
      sessionToken
    };
  }
  
  static async verifyEmail(token: string) {
    const verification = await prisma.emailVerification.findFirst({
      where: { 
        token, 
        used: false,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (!verification) {
      throw new Error('Invalid or expired verification token');
    }
    
    // Mark user as verified and token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true }
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { used: true }
      })
    ]);
    
    return true;
  }
  
  static async validateSession(sessionTokenOrRequest: string | Request) {
    let sessionToken: string | null = null;
    
    if (typeof sessionTokenOrRequest === 'string') {
      sessionToken = sessionTokenOrRequest;
    } else {
      // Extract from cookies
      const cookieHeader = sessionTokenOrRequest.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        sessionToken = cookies['session-token'];
      }
    }
    
    if (!sessionToken) {
      return { success: false, user: null };
    }
    
    const session = await prisma.userSession.findFirst({
      where: { 
        sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });
    
    if (!session || !session.user || !session.user.isActive) {
      return { success: false, user: null };
    }
    
    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        userType: session.user.userType,
        firstName: session.user.profile?.firstName,
        lastName: session.user.profile?.lastName,
        isVerified: session.user.isVerified,
        profile: session.user.profile
      }
    };
  }
  
  static async logout(sessionToken: string, ipAddress?: string, userAgent?: string) {
    const session = await prisma.userSession.findFirst({ where: { sessionToken } });
    if (session) {
      await AuditService.logUserAction(session.userId, 'logout', 'auth', undefined, { 
        ipAddress, userAgent 
      });
    }
    await prisma.userSession.deleteMany({ where: { sessionToken } });
  }
  
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findFirst({ 
      where: { email, isActive: true } 
    });
    
    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }
    
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    });
    
    return { success: true, resetToken };
  }
  
  static async resetPassword(token: string, newPassword: string) {
    const reset = await prisma.passwordReset.findFirst({
      where: { 
        token, 
        used: false,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (!reset) {
      throw new Error('Invalid or expired reset token');
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash }
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true }
      }),
      // Invalidate all sessions for this user
      prisma.userSession.deleteMany({ 
        where: { userId: reset.userId } 
      })
    ]);
    
    return true;
  }

  static async createSession(userId: string, userAgent?: string, ipAddress?: string) {
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt
      }
    });
    
    return sessionToken;
  }

  static async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
  }
}