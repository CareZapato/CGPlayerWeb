import React from 'react';
import BackupManagement from '../components/BackupManagement';

const BackupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Backup</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los respaldos completos del sistema, incluyendo base de datos y archivos.
          </p>
        </div>
        
        <BackupManagement />
      </div>
    </div>
  );
};

export default BackupPage;
