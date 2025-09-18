export interface DateValidationOptions {
  minAge?: number;
  maxAge?: number;
  minDate?: string;
  maxDate?: string;
}

export function useDateValidation(options: DateValidationOptions = {}) {
  const getDateLimits = () => {
    const today = new Date();
    let minDate = options.minDate;
    let maxDate = options.maxDate;

    // Calculer les limites basées sur l'âge
    if (options.minAge) {
      const minAgeDate = new Date();
      minAgeDate.setFullYear(today.getFullYear() - options.minAge);
      const minAgeString = minAgeDate.toISOString().split('T')[0];
      maxDate = maxDate ? (minAgeString < maxDate ? minAgeString : maxDate) : minAgeString;
    }

    if (options.maxAge) {
      const maxAgeDate = new Date();
      maxAgeDate.setFullYear(today.getFullYear() - options.maxAge);
      const maxAgeString = maxAgeDate.toISOString().split('T')[0];
      minDate = minDate ? (maxAgeString > minDate ? maxAgeString : minDate) : maxAgeString;
    }

    return { minDate, maxDate };
  };

  const validateDate = (dateString: string): { isValid: boolean; error?: string } => {
    if (!dateString) {
      return { isValid: false, error: 'Date requise' };
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Date invalide' };
    }

    const { minDate, maxDate } = getDateLimits();

    if (minDate && dateString < minDate) {
      if (options.maxAge) {
        return { isValid: false, error: `Âge maximum : ${options.maxAge} ans` };
      }
      return { isValid: false, error: `Date minimum : ${new Date(minDate).toLocaleDateString('fr-FR')}` };
    }

    if (maxDate && dateString > maxDate) {
      if (options.minAge) {
        return { isValid: false, error: `Âge minimum : ${options.minAge} ans` };
      }
      return { isValid: false, error: `Date maximum : ${new Date(maxDate).toLocaleDateString('fr-FR')}` };
    }

    return { isValid: true };
  };

  const calculateAge = (dateString: string): number | null => {
    if (!dateString) return null;
    
    const birthDate = new Date(dateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return {
    getDateLimits,
    validateDate,
    calculateAge
  };
}

// Presets courants
export const DATE_PRESETS = {
  // Pour les joueurs de football (6-40 ans)
  PLAYER: { minAge: 4, maxAge: 40 },
  
  // Pour les adultes (18+ ans)
  ADULT: { minAge: 18 },
  
  // Pour les mineurs (moins de 18 ans)
  MINOR: { maxAge: 17 },
  
  // Pour les seniors (50+ ans)
  SENIOR: { minAge: 50 },
  
  // Pas de futur
  NO_FUTURE: { maxDate: new Date().toISOString().split('T')[0] }
};