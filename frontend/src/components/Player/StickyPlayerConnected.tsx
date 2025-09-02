import React from 'react';
import StickyPlayer from './StickyPlayer';

/**
 * StickyPlayerConnected - Wrapper simplificado para StickyPlayer
 * El componente StickyPlayer ya está conectado directamente al store
 */
const StickyPlayerConnected: React.FC = () => {
  return <StickyPlayer />;
};

export default StickyPlayerConnected;
