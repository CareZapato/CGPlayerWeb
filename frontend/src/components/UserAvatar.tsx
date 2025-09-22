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
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm lg:w-12 lg:h-12 lg:text-base',
    lg: 'w-14 h-14 text-lg'
  };

  const getInitials = () => {
    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const defaultBgColor = backgroundColor || '#6b7280';
  
  const borderStyles = showBorder ? {
    border: `4px ${borderType} ${borderColor}`,
    boxShadow: `0 0 0 2px ${borderColor}30`
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