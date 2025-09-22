import React from 'react';
import { useAPIURL } from '../hooks/useNetworkConfig';

const APITestComponent: React.FC = () => {
  const apiURL = useAPIURL();
  
  const getApiUrl = () => {
    if (apiURL && apiURL !== '') {
      return apiURL;
    }
    
    // Fallback basado en la ubicación actual
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const fallbackURL = isLocalhost ? 'http://localhost:3001' : `http://${hostname}:3001`;
    
    return fallbackURL;
  };

  const testConnection = async () => {
    const currentApiUrl = getApiUrl();
    console.log('🧪 Testing API connection to:', currentApiUrl);
    
    try {
      const response = await fetch(`${currentApiUrl}/api/health`);
      console.log('✅ Connection test result:', response.status, response.statusText);
      alert(`Connection test: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      alert(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>🧪 API URL Test Component</h3>
      <p><strong>Hook API URL:</strong> {apiURL || 'undefined/empty'}</p>
      <p><strong>Resolved API URL:</strong> {getApiUrl()}</p>
      <p><strong>Current hostname:</strong> {window.location.hostname}</p>
      <p><strong>Current port:</strong> {window.location.port}</p>
      <button onClick={testConnection} style={{ padding: '10px', margin: '5px' }}>
        Test Connection
      </button>
    </div>
  );
};

export default APITestComponent;