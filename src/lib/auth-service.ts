import { hashPassword, verifyPassword, generateSecureToken } from './password';
import { UserType } from '@/types/auth';
import { prisma } from './prisma';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  phone?: string;
  country?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  static async createUser(userData: CreateUserData) {
    const { ensurePrismaReady } = await import('./prisma');
    await ensurePrismaReady();
    const { email, password, firstName, lastName, userType, phone, country } = userData;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
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
            country: country || null
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
    
    return { userId: user.id, verificationToken };
  }
  
  static async loginUser(loginData: LoginData) {
    const { ensurePrismaReady } = await import('./prisma');
    await ensurePrismaReady();
    const { email, password } = loginData;
    
    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Create session
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt
      }
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
  
  static async validateSession(sessionToken: string) {
    const session = await prisma.userSession.findFirst({
      where: { 
        sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          where: { isActive: true },
          include: { profile: true }
        }
      }
    });
    
    if (!session || !session.user) {
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email,
      userType: session.user.userType,
      firstName: session.user.profile?.firstName,
      lastName: session.user.profile?.lastName,
      isVerified: session.user.isVerified
    };
  }
  
  static async logout(sessionToken: string) {
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
}