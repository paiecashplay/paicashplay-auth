'use client';

import DatePicker from './DatePicker';
import { useDateValidation, DATE_PRESETS } from '@/hooks/useDateValidation';

interface BirthDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  userType?: 'player' | 'adult' | 'minor' | 'any';
  className?: string;
  required?: boolean;
  label?: string;
}

export default function BirthDatePicker({ 
  value, 
  onChange, 
  userType = 'any',
  className = '',
  required = false,
  label = 'Date de naissance'
}: BirthDatePickerProps) {
  
  const getValidationOptions = () => {
    switch (userType) {
      case 'player':
        return DATE_PRESETS.PLAYER;
      case 'adult':
        return DATE_PRESETS.ADULT;
      case 'minor':
        return DATE_PRESETS.MINOR;
      default:
        return DATE_PRESETS.NO_FUTURE;
    }
  };

  const { getDateLimits, calculateAge } = useDateValidation(getValidationOptions());
  const { minDate, maxDate } = getDateLimits();
  const age = calculateAge(value);

  const getAgeInfo = () => {
    switch (userType) {
      case 'player':
        return 'Âge requis : entre 6 et 40 ans';
      case 'adult':
        return 'Âge minimum : 18 ans';
      case 'minor':
        return 'Âge maximum : 17 ans';
      default:
        return 'Sélectionnez votre date de naissance';
    }
  };

  return (
    <div className={className}>
      <DatePicker
        value={value}
        onChange={onChange}
        label={label}
        placeholder="Sélectionnez votre date de naissance"
        minDate={minDate}
        maxDate={maxDate}
        required={required}
      />
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-500">
          <i className="fas fa-info-circle mr-1"></i>
          {getAgeInfo()}
        </p>
        {age !== null && (
          <p className="text-xs font-medium text-emerald-600">
            <i className="fas fa-birthday-cake mr-1"></i>
            {age} ans
          </p>
        )}
      </div>
    </div>
  );
}