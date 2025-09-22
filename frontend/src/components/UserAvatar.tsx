import React, { useState } from 'react';

interface UserAvatarProps {
  user: {
    firstName: string;
    lastName: string;
    profileImage?: string | null;
    profileImageUrl?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  backgroundColor?: string;
  showBorder?: boolean;
  borderColor?: string;
  borderType?: 'solid' | 'dashed' | 'dotted';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '', 
  backgroundColor,
  showBorder = false,
  borderColor = '#8b5cf6', // Purple-500 por defecto
  borderType = 'solid'
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm lg:w-10 lg:h-10 lg:text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const getInitials = () => {
    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const defaultBgColor = backgroundColor || '#6b7280';
  
  const borderStyles = showBorder ? {
    border: `3px ${borderType} ${borderColor}`,
    boxShadow: `0 0 0 1px ${borderColor}20`
  } : {};

  const handleImageError = () => {
    setImageError(true);
  };

  // Si no hay imagen o hubo error, mostrar iniciales
  if ((!user.profileImage && !user.profileImageUrl) || imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
        style={{ 
          backgroundColor: defaultBgColor,
          ...borderStyles
        }}
      >
        {getInitials()}
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={borderStyles}
    >
      <img
        src={user.profileImageUrl || user.profileImage || ''}
        alt={`${user.firstName} ${user.lastName}`}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
};

export default UserAvatar;