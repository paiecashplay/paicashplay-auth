'use client';

import { useToast } from './Toast';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copié !', 'Le texte a été copié dans le presse-papiers');
    } catch (error) {
      toast.error('Erreur de copie', 'Impossible de copier le texte');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-gray-400 hover:text-gray-600 transition-colors ${className}`}
      title="Copier"
    >
      <i className="fas fa-copy"></i>
    </button>
  );
}