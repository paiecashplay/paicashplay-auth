import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/img/logo.png"
          alt="PaieCashPlay"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-gray-900 ${textSizes[size]} leading-tight`}>
            PaieCashPlay
          </span>
          <span className="text-xs text-paiecash font-medium uppercase tracking-wide">
            Authentication
          </span>
        </div>
      )}
    </div>
  );
}