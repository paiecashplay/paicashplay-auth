import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatUserType = (type: string): string => {
  const types = {
    player: 'Joueur',
    club: 'Club', 
    federation: 'Fédération',
    donor: 'Donateur'
  };
  return types[type as keyof typeof types] || type;
};