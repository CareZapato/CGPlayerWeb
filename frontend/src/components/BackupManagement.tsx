import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  FileArchive, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  RefreshCw,
  Users,
  Music,
  Calendar,
  Terminal,
  X,
  UserCircle // Icono para perfiles
} from 'lucide-react';

interface BackupInfo {
  id: string;
  filename: string;
  size: string;
  created: string;
  description: string;
  status: 'completed' | 'failed' | 'processing';
}

const BackupManagement: React.FC = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupHistory, setBackupHistory] = useState<BackupInfo[]>([]);
  const [restoreLogs, setRestoreLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    totalSongs: 0,        // Canciones principales
    totalAudioFiles: 0,   // Archivos de audio/variaciones
    totalUsers: 0,
    totalPlaylists: 0,
    totalEvents: 0,
    usersWithProfileImages: 0, // Nueva estadística
    profileImages: {
      count: 0,
      storageUsed: '0 MB',
      storageBytes: 0
    },
    storageUsed: '0 MB'
  });

  // Cargar información del sistema
  React.useEffect(() => {
    loadSystemInfo();
    loadBackupHistory();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/system-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (error) {
      console.error('Error loading system info:', error);
    }
  };

  const loadBackupHistory = async () => {
    // Los backups ya no se almacenan en el servidor, solo se descargan
    // Mantenemos un historial local simple o lo eliminamos
    setBackupHistory([]);
  };

  const createBackup = async () => {
    if (isCreatingBackup) return;

    if (!confirm('¿Estás seguro de crear un backup completo? Este proceso puede tomar varios minutos.')) {
      return;
    }

    try {
      setIsCreatingBackup(true);
      setBackupProgress(0);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/backup/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: `Backup completo - ${new Date().toLocaleString()}`
        })
      });

      if (response.ok) {
        // Simular progreso de backup
        const interval = setInterval(() => {
          setBackupProgress(prev => {
            if (prev >= 95) {
              clearInterval(interval);
              return 95;
            }
            return prev + Math.random() * 10;
          });
        }, 1000);

        // Descargar el archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `cgplayer-backup-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setBackupProgress(100);
        setTimeout(() => {
          setIsCreatingBackup(false);
          setBackupProgress(0);
          loadBackupHistory();
          alert('Backup creado y descargado exitosamente.');
        }, 1500);

      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert(`Error al crear backup: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const restoreBackup = async () => {
    if (!selectedFile || isRestoringBackup) return;

    if (!confirm('⚠️ ADVERTENCIA: Esta acción eliminará todos los datos actuales y los reemplazará con los del backup. ¿Estás seguro de continuar?')) {
      return;
    }

    if (!confirm('Esta acción es IRREVERSIBLE. Todos los datos actuales se perderán. ¿Confirmas que quieres continuar?')) {
      return;
    }

    try {
      setIsRestoringBackup(true);
      setRestoreProgress(0);
      setRestoreLogs([]);
      setShowLogs(true);
      
      // Log inicial
      setRestoreLogs(prev => [...prev, `🔄 Iniciando restauración de backup: ${selectedFile.name}`]);
      setRestoreLogs(prev => [...prev, `📦 Tamaño del archivo: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`]);
      setRestoreProgress(5);

      const formData = new FormData();
      formData.append('backup', selectedFile);

      const token = localStorage.getItem('token');
      
      setRestoreLogs(prev => [...prev, '🔐 Enviando archivo al servidor...']);
      setRestoreProgress(15);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/backup/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setRestoreProgress(50);
        setRestoreLogs(prev => [...prev, '✅ Archivo procesado exitosamente']);
        
        // Mostrar información detallada del backup
        if (result.info) {
          setRestoreLogs(prev => [...prev, `📊 Información del backup:`]);
          setRestoreLogs(prev => [...prev, `   - Versión: ${result.info.version}`]);
          setRestoreLogs(prev => [...prev, `   - Fecha de creación: ${new Date(result.info.created).toLocaleString()}`]);
          setRestoreLogs(prev => [...prev, `   - Descripción: ${result.info.description}`]);
          
          if (result.info.tables) {
            setRestoreLogs(prev => [...prev, '📈 Datos restaurados por tabla:']);
            Object.entries(result.info.tables).forEach(([table, count]) => {
              if (typeof count === 'number' && count > 0) {
                setRestoreLogs(prev => [...prev, `   - ${table}: ${count} registros`]);
              }
            });
          }
        }
        
        setRestoreProgress(80);
        setRestoreLogs(prev => [...prev, '🔄 Recargando información del sistema...']);
        
        // Recargar información después de la restauración
        await loadSystemInfo();
        await loadBackupHistory();
        
        setRestoreProgress(100);
        setRestoreLogs(prev => [...prev, '🎉 Backup restaurado exitosamente']);
        setRestoreLogs(prev => [...prev, '✨ La aplicación se recargará automáticamente en 3 segundos']);
        
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
      } else {
        setRestoreLogs(prev => [...prev, `❌ Error en la restauración: ${result.error}`]);
        if (result.details) {
          setRestoreLogs(prev => [...prev, `🔍 Detalles: ${result.details}`]);
        }
        setRestoreProgress(0);
        setIsRestoringBackup(false);
      }

    } catch (error) {
      console.error('Error restoring backup:', error);
      setRestoreLogs(prev => [...prev, `❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`]);
      setRestoreProgress(0);
      setIsRestoringBackup(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      setSelectedFile(file);
    } else {
      alert('Por favor selecciona un archivo ZIP válido');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Database className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Backups</h2>
            <p className="text-gray-600">Exporta e importa backups completos del sistema CGPlayer</p>
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <HardDrive className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-blue-900">
              {systemInfo.totalSongs > 0 && systemInfo.totalAudioFiles > 0 
                ? `${systemInfo.totalSongs} ${systemInfo.totalSongs === 1 ? 'canción' : 'canciones'}`
                : systemInfo.totalSongs || 0
              }
            </div>
            <div className="text-sm text-blue-700">
              {systemInfo.totalSongs > 0 && systemInfo.totalAudioFiles > 0 
                ? `en ${systemInfo.totalAudioFiles} ${systemInfo.totalAudioFiles === 1 ? 'archivo' : 'archivos'} de audio`
                : 'Canciones'
              }
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-green-900">{systemInfo.totalUsers}</div>
            <div className="text-sm text-green-700">Usuarios</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <Music className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-purple-900">{systemInfo.totalPlaylists}</div>
            <div className="text-sm text-purple-700">Playlists</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <Calendar className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-yellow-900">{systemInfo.totalEvents}</div>
            <div className="text-sm text-yellow-700">Eventos</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <UserCircle className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-indigo-900">{systemInfo.usersWithProfileImages}</div>
            <div className="text-sm text-indigo-700">Perfiles con Imagen</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <Database className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-gray-900">{systemInfo.storageUsed}</div>
            <div className="text-sm text-gray-700">Almacenamiento</div>
          </div>
        </div>
        
        {/* Información detallada de perfiles */}
        {systemInfo.profileImages.count > 0 && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center mb-2">
              <UserCircle className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-indigo-900">Sistema de Perfiles</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-indigo-700">Imágenes de perfil:</span>
                <span className="font-semibold text-indigo-900 ml-1">{systemInfo.profileImages.count}</span>
              </div>
              <div>
                <span className="text-indigo-700">Espacio usado:</span>
                <span className="font-semibold text-indigo-900 ml-1">{systemInfo.profileImages.storageUsed}</span>
              </div>
              <div>
                <span className="text-indigo-700">% con imagen:</span>
                <span className="font-semibold text-indigo-900 ml-1">
                  {systemInfo.totalUsers > 0 
                    ? Math.round((systemInfo.usersWithProfileImages / systemInfo.totalUsers) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crear Backup */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Download className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Crear Backup</h3>
            <p className="text-gray-600">Genera un backup completo del sistema incluyendo base de datos, archivos e imágenes de perfil</p>
          </div>
        </div>

        <div className="space-y-4">
          {isCreatingBackup ? (
            <div className="space-y-4">
              <div className="flex items-center text-blue-600">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <span>Creando backup... {Math.round(backupProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${backupProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              onClick={createBackup}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Crear y Descargar Backup
            </button>
          )}
        </div>
      </div>

      {/* Restaurar Backup */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Upload className="h-6 w-6 text-orange-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Restaurar Backup</h3>
            <p className="text-gray-600">Sube un archivo de backup para restaurar el sistema completo incluyendo perfiles e imágenes</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="w-full"
              disabled={isRestoringBackup}
            />
            {selectedFile && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-gray-600">{formatFileSize(selectedFile.size)}</div>
              </div>
            )}
          </div>

          {isRestoringBackup ? (
            <div className="space-y-4">
              <div className="flex items-center text-orange-600">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <span>Restaurando backup... {Math.round(restoreProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${restoreProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              onClick={restoreBackup}
              disabled={!selectedFile}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Restaurar Backup
            </button>
          )}
        </div>
      </div>

      {/* Panel de Logs */}
      {showLogs && restoreLogs.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Terminal className="h-6 w-6 text-gray-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Logs del Proceso</h3>
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {restoreLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  [{new Date().toLocaleTimeString()}] {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Historial de Backups */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileArchive className="h-6 w-6 text-gray-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Historial de Backups</h3>
              <p className="text-gray-600">Backups disponibles en el servidor</p>
            </div>
          </div>
          <button
            onClick={loadBackupHistory}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </button>
        </div>

        <div className="space-y-3">
          {backupHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileArchive className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay backups disponibles</p>
            </div>
          ) : (
            backupHistory.map((backup) => (
              <div key={backup.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <div className="font-medium text-gray-900">{backup.filename}</div>
                      <div className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                        backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {backup.status === 'completed' ? 'Completado' :
                         backup.status === 'failed' ? 'Fallido' : 'Procesando'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {new Date(backup.created).toLocaleString()} • {backup.size}
                    </div>
                    {backup.description && (
                      <div className="text-sm text-gray-500 mt-1">{backup.description}</div>
                    )}
                  </div>
                  <div className="ml-4">
                    {backup.status === 'completed' && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                    {backup.status === 'failed' && (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                    {backup.status === 'processing' && (
                      <RefreshCw className="h-6 w-6 text-yellow-600 animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupManagement;
