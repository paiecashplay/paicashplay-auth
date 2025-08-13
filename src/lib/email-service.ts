import nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-templates';
import { ConfigService } from './config-service';
import { UserType } from '@/types/auth';

export class EmailService {
  private static async getTransporter() {
    const smtpConfig = await ConfigService.getSmtpConfig();
    
    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  static async sendVerificationEmail(email: string, firstName: string, lastName: string, token: string, userType: UserType, oauthSession?: string) {
    const verificationUrl = new URL(`${process.env.NEXTAUTH_URL}/verify-email`);
    verificationUrl.searchParams.set('token', token);
    
    // Ajouter oauth_session si présent
    if (oauthSession) {
      verificationUrl.searchParams.set('oauth_session', oauthSession);
    }
    
    const html = await EmailTemplateService.getVerificationEmail({
      firstName,
      lastName,
      email,
      userType,
      verificationUrl: verificationUrl.toString()
    });
    
    const transporter = await this.getTransporter();
    const smtpConfig = await ConfigService.getSmtpConfig();
    
    await transporter.sendMail({
      from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
      to: email,
      subject: 'Vérifiez votre email - PaieCashPlay',
      html
    });
  }
  
  static async sendPasswordResetEmail(email: string, firstName: string, token: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    
    const html = await EmailTemplateService.getPasswordResetEmail({
      firstName,
      resetUrl
    });
    
    const transporter = await this.getTransporter();
    const smtpConfig = await ConfigService.getSmtpConfig();
    
    await transporter.sendMail({
      from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
      to: email,
      subject: 'Réinitialisation de mot de passe - PaieCashPlay',
      html
    });
  }
  
  static async sendWelcomeEmail(email: string, firstName: string, lastName: string, userType: UserType) {
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/profile`;
    
    const html = await EmailTemplateService.getWelcomeEmail({
      firstName,
      lastName,
      email,
      userType,
      dashboardUrl
    });
    
    const transporter = await this.getTransporter();
    const smtpConfig = await ConfigService.getSmtpConfig();
    
    const subject = EmailTemplateService.getWelcomeSubject(userType, firstName);
    
    await transporter.sendMail({
      from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
      to: email,
      subject,
      html
    });
  }
  
  static async testSmtpConnection() {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return { success: true, message: 'Connexion SMTP réussie' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Échec de la connexion SMTP',
        code: error.code
      };
    }
  }

  static async sendAccountConfirmedEmail(email: string, firstName: string, lastName: string, userType: UserType) {
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/profile`;
    
    const html = await EmailTemplateService.getAccountConfirmedEmail({
      firstName,
      lastName,
      email,
      userType,
      dashboardUrl
    });
    
    const transporter = await this.getTransporter();
    const smtpConfig = await ConfigService.getSmtpConfig();
    
    const subject = EmailTemplateService.getAccountConfirmedSubject(userType, firstName);
    
    await transporter.sendMail({
      from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
      to: email,
      subject,
      html
    });
  }
}