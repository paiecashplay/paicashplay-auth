import nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-templates';
import { ConfigService } from './config-service';

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
    });
  }

  static async sendVerificationEmail(email: string, firstName: string, token: string, userType: string) {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    
    const html = await EmailTemplateService.getVerificationEmail({
      firstName,
      userType,
      verificationUrl
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
  
  static async sendWelcomeEmail(email: string, firstName: string, userType: string) {
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/profile`;
    
    const html = await EmailTemplateService.getWelcomeEmail({
      firstName,
      userType,
      dashboardUrl
    });
    
    const transporter = await this.getTransporter();
    const smtpConfig = await ConfigService.getSmtpConfig();
    
    await transporter.sendMail({
      from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
      to: email,
      subject: `Bienvenue sur PaieCashPlay, ${firstName} !`,
      html
    });
  }
}