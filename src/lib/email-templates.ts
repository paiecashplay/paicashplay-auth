import { UserType } from '@/types/auth';
import fs from 'fs';
import path from 'path';

interface EmailData {
  firstName: string;
  lastName: string;
  email: string;
  userType: UserType;
}

export class EmailTemplateService {
  private static templatesPath = path.join(process.cwd(), 'email-templates');

  private static loadTemplate(templateName: string): string {
    const templatePath = path.join(this.templatesPath, `${templateName}.html`);
    
    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      return this.getFallbackTemplate(templateName);
    }
  }

  private static getFallbackTemplate(templateName: string): string {
    const fallbacks: Record<string, string> = {
      'welcome-player': '<h1>Bienvenue {{firstName}} !</h1><p>Votre compte Licencié est créé.</p><a href="{{dashboardUrl}}">Accéder au dashboard</a>',
      'welcome-club': '<h1>Bienvenue {{firstName}} {{lastName}} !</h1><p>Votre compte Club est créé.</p><a href="{{dashboardUrl}}">Accéder à mon espace Club</a>',
      'welcome-federation': '<h1>Bienvenue Fédération {{firstName}} {{lastName}} !</h1><p>Votre espace Fédération est créé.</p><a href="{{dashboardUrl}}">Finaliser mon espace Fédération</a>',
      'welcome-company': '<h1>Bienvenue {{firstName}} {{lastName}} !</h1><p>Votre profil Entreprise est activé.</p><a href="{{dashboardUrl}}">Accéder à mon espace Société</a>',
      'welcome-donor': '<h1>Merci {{firstName}} !</h1><p>Votre générosité va transformer des vies.</p><a href="{{dashboardUrl}}">Activer mon espace Donateur</a>',

      'confirmed-player': '<h1>Compte activé !</h1><p>Bonjour {{firstName}}, votre compte Licencié est maintenant actif.</p><a href="{{dashboardUrl}}">Accéder à mon espace</a>',
      'confirmed-club': '<h1>Espace Club opérationnel !</h1><p>Bonjour {{firstName}} {{lastName}}, votre espace Club est maintenant actif.</p><a href="{{dashboardUrl}}">Gérer mon club</a>',
      'confirmed-federation': '<h1>Espace Fédération actif !</h1><p>Bonjour {{firstName}} {{lastName}}, votre espace Fédération est opérationnel.</p><a href="{{dashboardUrl}}">Accéder à mon espace</a>',
      'confirmed-company': '<h1>Profil Entreprise confirmé !</h1><p>Bonjour {{firstName}} {{lastName}}, votre profil Entreprise est maintenant actif.</p><a href="{{dashboardUrl}}">Accéder à mon espace</a>',
      'confirmed-donor': '<h1>Espace Donateur prêt !</h1><p>Bonjour {{firstName}}, votre espace Donateur est maintenant actif.</p><a href="{{dashboardUrl}}">Commencer à donner</a>',
      'password-reset': '<h1>Reset mot de passe</h1><p>Bonjour {{firstName}},</p><a href="{{resetUrl}}">Réinitialiser</a>'
    };
    return fallbacks[templateName] || '<p>Template non trouvé</p>';
  }

  private static replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  static async getWelcomeEmail(data: EmailData & { dashboardUrl: string }) {
    const templateName = `welcome-${data.userType}`;
    const template = this.loadTemplate(templateName);
    
    return this.replaceVariables(template, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dashboardUrl: data.dashboardUrl
    });
  }

  static getWelcomeSubject(userType: UserType, firstName: string): string {
    const subjects = {
      player: `Bienvenue sur PaieCashPlay, votre compte Licencié est en cours de création`,
      club: `Création de votre compte Club PaieCashPlay`,
      federation: `Création de votre espace Fédération sur PaieCashPlay`,
      company: `Activation de votre profil Entreprise sur PaieCashPlay`,
      donor: `Merci d'avoir choisi de soutenir PaieCashPlay !`
    };
    return subjects[userType] || `Bienvenue sur PaieCashPlay, ${firstName} !`;
  }

  static async getVerificationEmail(data: EmailData & { verificationUrl: string }) {
    // Tous les types utilisent le template de bienvenue car c'est le même email
    const templateName = `welcome-${data.userType}`;
    const template = this.loadTemplate(templateName);
    
    return this.replaceVariables(template, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      verificationUrl: data.verificationUrl,
      dashboardUrl: data.verificationUrl // Le lien de vérification = dashboard
    });
  }
  
  static async getPasswordResetEmail(data: { firstName: string; resetUrl: string; }) {
    const template = this.loadTemplate('password-reset');
    
    return this.replaceVariables(template, {
      firstName: data.firstName,
      resetUrl: data.resetUrl
    });
  }

  static async getAccountConfirmedEmail(data: EmailData & { dashboardUrl: string }) {
    const templateName = `confirmed-${data.userType}`;
    const template = this.loadTemplate(templateName);
    
    return this.replaceVariables(template, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dashboardUrl: data.dashboardUrl
    });
  }

  static getAccountConfirmedSubject(userType: UserType, firstName: string): string {
    const subjects = {
      player: `Votre compte Licencié est validé !`,
      club: `Votre compte Club est validé !`,
      federation: `Votre Fédération est désormais sur PaieCashPlay !`,
      company: `Votre profil Entreprise est validé`,
      donor: `Merci pour votre inscription, Donateur confirmé !`
    };
    return subjects[userType] || `Votre compte PaieCashPlay est activé, ${firstName} !`;
  }
}