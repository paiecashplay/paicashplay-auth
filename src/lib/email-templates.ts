import fs from 'fs';
import path from 'path';

export class EmailTemplateService {
  private static templatesPath = path.join(process.cwd(), 'email-templates');
  
  static async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${templateName}.html`);
    
    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      // Return a basic template if file not found
      return this.getBasicTemplate(templateName);
    }
  }

  private static getBasicTemplate(templateName: string): string {
    const templates: Record<string, string> = {
      verification: `
        <h1>Vérification d'email</h1>
        <p>Bonjour {{firstName}},</p>
        <p>Cliquez sur le lien pour vérifier votre email :</p>
        <a href="{{verificationUrl}}">Vérifier mon email</a>
      `,
      'password-reset': `
        <h1>Réinitialisation de mot de passe</h1>
        <p>Bonjour {{firstName}},</p>
        <p>Cliquez sur le lien pour réinitialiser votre mot de passe :</p>
        <a href="{{resetUrl}}">Réinitialiser</a>
      `,
      welcome: `
        <h1>Bienvenue !</h1>
        <p>Bonjour {{firstName}},</p>
        <p>Bienvenue sur PaieCashPlay en tant que {{userType}}.</p>
        <a href="{{dashboardUrl}}">Accéder au tableau de bord</a>
      `
    };
    
    return templates[templateName] || '<p>Template not found</p>';
  }
  
  static replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
  
  static async getVerificationEmail(variables: {
    firstName: string;
    userType: string;
    verificationUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('verification');
    return this.replaceVariables(template, variables);
  }
  
  static async getPasswordResetEmail(variables: {
    firstName: string;
    resetUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('password-reset');
    return this.replaceVariables(template, variables);
  }
  
  static async getWelcomeEmail(variables: {
    firstName: string;
    userType: string;
    dashboardUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('welcome');
    return this.replaceVariables(template, variables);
  }
}