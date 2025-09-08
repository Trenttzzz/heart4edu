import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses: Record<string,string> = {
    primary: 'bg-primary hover:bg-bright-pink text-white shadow-sm hover:shadow transition-transform hover:scale-[1.02]',
    secondary: 'bg-surface text-zinc-800 hover:bg-cherry-pink/80 border border-cherry-pink/60',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
    danger: 'bg-rose-red hover:bg-bright-pink-2 text-white'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isExternal?: boolean;
  className?: string;
  onClick?: () => void;
}

export const NavLink: React.FC<NavLinkProps> = ({ 
  href, 
  children, 
  isExternal = false, 
  className = '',
  onClick 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isExternal && href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    onClick?.();
  };

  return (
    <a
      href={href}
      className={`text-gray-300 hover:text-white transition-colors duration-200 ${className}`}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hoverable = false,
  style
}) => {
  const baseClasses = 'bg-secondary-900 rounded-lg transition-all duration-300';
  const hoverClasses = hoverable ? 'card-hover' : '';
  
  return (
    <div style={style} className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className={`loading-spin border-2 border-gray-300 border-t-white rounded-full ${sizeClasses[size]} ${className}`} />
  );
};
