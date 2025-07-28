import { UserType } from '@/types/auth';

export const getUserTypeLabel = (type: UserType): string => {
  const labels = {
    player: 'Licencié',
    club: 'Club',
    federation: 'Fédération',
    donor: 'Donateur',
    company: 'Société'
  };
  return labels[type];
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};