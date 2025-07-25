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
      throw new Error(`Email template ${templateName} not found`);
    }
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