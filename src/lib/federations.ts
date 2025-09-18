// Service de gestion des fédérations par pays
export class FederationService {
  // Mapping des pays vers leurs fédérations de football
  private static federations: Record<string, { name: string; code: string }> = {
    // Afrique
    'Cameroon': { name: 'Fédération Camerounaise de Football', code: 'FECAFOOT' },
    'Cameroun': { name: 'Fédération Camerounaise de Football', code: 'FECAFOOT' },
    'CM': { name: 'Fédération Camerounaise de Football', code: 'FECAFOOT' },
    
    'Nigeria': { name: 'Nigeria Football Federation', code: 'NFF' },
    'NG': { name: 'Nigeria Football Federation', code: 'NFF' },
    
    'Senegal': { name: 'Fédération Sénégalaise de Football', code: 'FSF' },
    'Sénégal': { name: 'Fédération Sénégalaise de Football', code: 'FSF' },
    'SN': { name: 'Fédération Sénégalaise de Football', code: 'FSF' },
    
    'Morocco': { name: 'Fédération Royale Marocaine de Football', code: 'FRMF' },
    'Maroc': { name: 'Fédération Royale Marocaine de Football', code: 'FRMF' },
    'MA': { name: 'Fédération Royale Marocaine de Football', code: 'FRMF' },
    
    'Algeria': { name: 'Fédération Algérienne de Football', code: 'FAF' },
    'Algérie': { name: 'Fédération Algérienne de Football', code: 'FAF' },
    'DZ': { name: 'Fédération Algérienne de Football', code: 'FAF' },
    
    'Tunisia': { name: 'Fédération Tunisienne de Football', code: 'FTF' },
    'Tunisie': { name: 'Fédération Tunisienne de Football', code: 'FTF' },
    'TN': { name: 'Fédération Tunisienne de Football', code: 'FTF' },
    
    'Egypt': { name: 'Egyptian Football Association', code: 'EFA' },
    'Égypte': { name: 'Egyptian Football Association', code: 'EFA' },
    'EG': { name: 'Egyptian Football Association', code: 'EFA' },
    
    'Ghana': { name: 'Ghana Football Association', code: 'GFA' },
    'GH': { name: 'Ghana Football Association', code: 'GFA' },
    
    'Ivory Coast': { name: 'Fédération Ivoirienne de Football', code: 'FIF' },
    'Côte d\'Ivoire': { name: 'Fédération Ivoirienne de Football', code: 'FIF' },
    'CI': { name: 'Fédération Ivoirienne de Football', code: 'FIF' },
    
    // Europe
    'France': { name: 'Fédération Française de Football', code: 'FFF' },
    'FR': { name: 'Fédération Française de Football', code: 'FFF' },
    
    'Spain': { name: 'Real Federación Española de Fútbol', code: 'RFEF' },
    'Espagne': { name: 'Real Federación Española de Fútbol', code: 'RFEF' },
    'ES': { name: 'Real Federación Española de Fútbol', code: 'RFEF' },
    
    'Italy': { name: 'Federazione Italiana Giuoco Calcio', code: 'FIGC' },
    'Italie': { name: 'Federazione Italiana Giuoco Calcio', code: 'FIGC' },
    'IT': { name: 'Federazione Italiana Giuoco Calcio', code: 'FIGC' },
    
    'Germany': { name: 'Deutscher Fußball-Bund', code: 'DFB' },
    'Allemagne': { name: 'Deutscher Fußball-Bund', code: 'DFB' },
    'DE': { name: 'Deutscher Fußball-Bund', code: 'DFB' },
    
    'England': { name: 'The Football Association', code: 'FA' },
    'United Kingdom': { name: 'The Football Association', code: 'FA' },
    'Angleterre': { name: 'The Football Association', code: 'FA' },
    'GB': { name: 'The Football Association', code: 'FA' },
    'UK': { name: 'The Football Association', code: 'FA' },
    
    'Portugal': { name: 'Federação Portuguesa de Futebol', code: 'FPF' },
    'PT': { name: 'Federação Portuguesa de Futebol', code: 'FPF' },
    
    'Netherlands': { name: 'Koninklijke Nederlandse Voetbalbond', code: 'KNVB' },
    'Pays-Bas': { name: 'Koninklijke Nederlandse Voetbalbond', code: 'KNVB' },
    'NL': { name: 'Koninklijke Nederlandse Voetbalbond', code: 'KNVB' },
    
    'Belgium': { name: 'Union Royale Belge des Sociétés de Football', code: 'URBSFA' },
    'Belgique': { name: 'Union Royale Belge des Sociétés de Football', code: 'URBSFA' },
    'BE': { name: 'Union Royale Belge des Sociétés de Football', code: 'URBSFA' },
    
    // Amérique du Sud
    'Brazil': { name: 'Confederação Brasileira de Futebol', code: 'CBF' },
    'Brésil': { name: 'Confederação Brasileira de Futebol', code: 'CBF' },
    'BR': { name: 'Confederação Brasileira de Futebol', code: 'CBF' },
    
    'Argentina': { name: 'Asociación del Fútbol Argentino', code: 'AFA' },
    'Argentine': { name: 'Asociación del Fútbol Argentino', code: 'AFA' },
    'AR': { name: 'Asociación del Fútbol Argentino', code: 'AFA' },
    
    'Colombia': { name: 'Federación Colombiana de Fútbol', code: 'FCF' },
    'Colombie': { name: 'Federación Colombiana de Fútbol', code: 'FCF' },
    'CO': { name: 'Federación Colombiana de Fútbol', code: 'FCF' },
    
    // Amérique du Nord
    'United States': { name: 'United States Soccer Federation', code: 'USSF' },
    'États-Unis': { name: 'United States Soccer Federation', code: 'USSF' },
    'US': { name: 'United States Soccer Federation', code: 'USSF' },
    
    'Mexico': { name: 'Federación Mexicana de Fútbol', code: 'FMF' },
    'Mexique': { name: 'Federación Mexicana de Fútbol', code: 'FMF' },
    'MX': { name: 'Federación Mexicana de Fútbol', code: 'FMF' },
    
    'Canada': { name: 'Canadian Soccer Association', code: 'CSA' },
    'CA': { name: 'Canadian Soccer Association', code: 'CSA' }
  };

  /**
   * Obtenir la fédération d'un pays
   */
  static getFederationByCountry(country: string): { name: string; code: string } | null {
    if (!country) return null;
    
    // Recherche exacte
    const federation = this.federations[country];
    if (federation) return federation;
    
    // Recherche insensible à la casse
    const countryLower = country.toLowerCase();
    for (const [key, value] of Object.entries(this.federations)) {
      if (key.toLowerCase() === countryLower) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Obtenir toutes les fédérations disponibles
   */
  static getAllFederations(): Array<{ country: string; name: string; code: string }> {
    const uniqueFederations = new Map<string, { country: string; name: string; code: string }>();
    
    for (const [country, federation] of Object.entries(this.federations)) {
      if (!uniqueFederations.has(federation.code)) {
        uniqueFederations.set(federation.code, {
          country,
          name: federation.name,
          code: federation.code
        });
      }
    }
    
    return Array.from(uniqueFederations.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Ajouter une nouvelle fédération
   */
  static addFederation(country: string, name: string, code: string): void {
    this.federations[country] = { name, code };
  }

  /**
   * Vérifier si un pays a une fédération
   */
  static hasFederation(country: string): boolean {
    return this.getFederationByCountry(country) !== null;
  }
}