import React, { useState, useCallback } from 'react';
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
import { useAPIURL } from '../hooks/useNetworkConfig';

interface BackupInfo {
  id: string;
  filename: string;
  size: string;
  created: string;
  description: string;
  status: 'completed' | 'failed' | 'processing';
}

const BackupManagement: React.FC = () => {
  // Hook para obtener la URL de la API dinámicamente
  const apiURL = useAPIURL();
  
  // Función helper para obtener la URL de la API con fallback
  const getApiUrl = useCallback(() => {
    if (apiURL && apiURL !== '') {
      return apiURL;
    }
    
    // Fallback basado en la ubicación actual
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const fallbackURL = isLocalhost ? 'http://localhost:3001' : `http://${hostname}:3001`;
    
    console.warn('⚠️ Using fallback API URL:', fallbackURL, 'Original apiURL:', apiURL);
    return fallbackURL;
  }, [apiURL]);
  
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

  // Helper function para añadir logs con timestamp fijo
  const addLog = useCallback((message: string) => {
    const timestampedMessage = `[${new Date().toLocaleTimeString()}] ${message}`;
    setRestoreLogs(prev => [...prev, timestampedMessage]);
  }, []);

  const loadSystemInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const currentApiUrl = getApiUrl();
      console.log('🌐 Loading system info from:', `${currentApiUrl}/api/admin/system-info`);
      
      const response = await fetch(`${currentApiUrl}/api/admin/system-info`, {
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
  }, [getApiUrl]);

  const loadBackupHistory = useCallback(async () => {
    // Los backups ya no se almacenan en el servidor, solo se descargan
    // Mantenemos un historial local simple o lo eliminamos
    setBackupHistory([]);
  }, []);

  // Cargar información del sistema
  React.useEffect(() => {
    loadSystemInfo();
    loadBackupHistory();
  }, [loadSystemInfo, loadBackupHistory]);

  const createBackup = async () => {
    if (isCreatingBackup) return;

    if (!confirm('¿Estás seguro de crear un backup completo? Este proceso puede tomar varios minutos.')) {
      return;
    }

    try {
      setIsCreatingBackup(true);
      setBackupProgress(0);
      setRestoreLogs([]);
      setShowLogs(true);

      setRestoreLogs(prev => [...prev, '🔄 Iniciando creación de backup...']);
      setBackupProgress(5);

      const token = localStorage.getItem('token');
      
      // Usar XMLHttpRequest para monitorear progreso de descarga
      const downloadBlob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.responseType = 'blob';
        
        // Monitorear progreso de descarga
        xhr.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const downloadPercentage = Math.round((event.loaded / event.total) * 100);
            const adjustedProgress = 20 + (downloadPercentage * 0.7); // 20% a 90% para descarga
            setBackupProgress(adjustedProgress);
            
            if (downloadPercentage % 10 === 0 || downloadPercentage === 100) {
              setRestoreLogs(prev => [...prev, `📥 Descargando backup: ${downloadPercentage}% (${formatFileSize(event.loaded)} / ${formatFileSize(event.total)})`]);
            }
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setRestoreLogs(prev => [...prev, '✅ Backup descargado completamente']);
            setBackupProgress(95);
            resolve(xhr.response);
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Error de conexión durante la descarga'));
        });

        const currentApiUrl = getApiUrl();
        console.log('🌐 Creating backup at:', `${currentApiUrl}/api/admin/backup/create`);
        
        xhr.open('POST', `${currentApiUrl}/api/admin/backup/create`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        setRestoreLogs(prev => [...prev, '🏗️ Generando backup en el servidor...']);
        setBackupProgress(10);
        
        xhr.send(JSON.stringify({
          description: `Backup completo - ${new Date().toLocaleString()}`
        }));
      });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setRestoreLogs(prev => [...prev, '🎉 Backup creado y descargado exitosamente']);
      setBackupProgress(100);

      setTimeout(() => {
        setIsCreatingBackup(false);
        setBackupProgress(0);
        setShowLogs(false);
        alert('Backup creado y descargado exitosamente');
        loadSystemInfo();
        loadBackupHistory();
      }, 2000);

    } catch (error) {
      console.error('Error creating backup:', error);
      setRestoreLogs(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`]);
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
      addLog('🔄 Iniciando restauración de backup: ' + selectedFile.name);
      addLog(`📦 Tamaño del archivo: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`);
      setRestoreProgress(2);

      const formData = new FormData();
      formData.append('backup', selectedFile);

      const token = localStorage.getItem('token');
      
      addLog('📤 Iniciando subida del archivo...');
      setRestoreProgress(3);

      // Crear XMLHttpRequest para monitorear el progreso de subida
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Monitorear progreso de subida
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const uploadPercentage = Math.round((event.loaded / event.total) * 100);
            const adjustedProgress = 3 + (uploadPercentage * 0.25); // 3% a 28% para subida
            setRestoreProgress(adjustedProgress);
            
            if (uploadPercentage % 10 === 0 || uploadPercentage === 100) {
              addLog(`📤 Subiendo archivo: ${uploadPercentage}% (${formatFileSize(event.loaded)} / ${formatFileSize(event.total)})`);
            }
          }
        });

        // Manejar respuesta
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            addLog('✅ Archivo subido completamente al servidor');
            setRestoreProgress(30);
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText
            }));
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Error de conexión durante la subida'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Timeout durante la subida del archivo'));
        });

        // Configurar request
        const currentApiUrl = getApiUrl();
        console.log('🌐 Restoring backup at:', `${currentApiUrl}/api/admin/backup/restore`);
        
        xhr.open('POST', `${currentApiUrl}/api/admin/backup/restore`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.timeout = 300000; // 5 minutos timeout
        
        // Enviar
        xhr.send(formData);
      });

      const result = await response.json();
      
      if (response.ok) {
        setRestoreProgress(50);
        addLog('✅ Archivo procesado exitosamente');
        addLog('🔍 Analizando contenido del backup...');
        
        // Mostrar información detallada del backup
        if (result.info) {
          addLog('📊 Información del backup:');
          addLog(`   - Versión: ${result.info.version}`);
          addLog(`   - Fecha de creación: ${new Date(result.info.created).toLocaleString()}`);
          addLog(`   - Descripción: ${result.info.description || 'Sin descripción'}`);
          
          if (result.info.tables) {
            addLog('📈 Datos a restaurar por tabla:');
            Object.entries(result.info.tables).forEach(([table, count]) => {
              if (typeof count === 'number' && count > 0) {
                addLog(`   - ${table}: ${count} registros`);
              }
            });
          }
        }
        
        setRestoreProgress(80);
        addLog('🔄 Iniciando proceso de restauración en base de datos...');
        addLog('🔄 Recargando información del sistema...');
        
        // Recargar información después de la restauración
        await loadSystemInfo();
        await loadBackupHistory();
        
        setRestoreProgress(100);
        addLog('🎉 Backup restaurado exitosamente');
        addLog('✅ Proceso completado exitosamente');
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
              <div className="flex items-center justify-between text-blue-600">
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  <span>
                    {Math.round(backupProgress) <= 15 ? 'Generando backup...' : 
                     Math.round(backupProgress) <= 90 ? 'Descargando archivo...' : 
                     'Finalizando...'}
                  </span>
                </div>
                <span className="text-sm font-medium">{Math.round(backupProgress)}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    Math.round(backupProgress) <= 15 ? 'bg-blue-500' :
                    Math.round(backupProgress) <= 90 ? 'bg-green-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${backupProgress}%` }}
                ></div>
              </div>
              
              {/* Indicador de fase actual */}
              <div className="flex justify-between text-xs text-gray-500">
                <span className={`${Math.round(backupProgress) <= 15 ? 'text-blue-600 font-medium' : ''}`}>
                  🏗️ Generación
                </span>
                <span className={`${Math.round(backupProgress) > 15 && Math.round(backupProgress) <= 90 ? 'text-green-600 font-medium' : ''}`}>
                  📥 Descarga
                </span>
                <span className={`${Math.round(backupProgress) > 90 ? 'text-emerald-600 font-medium' : ''}`}>
                  ✅ Completado
                </span>
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
              <div className="flex items-center justify-between text-orange-600">
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  <span>
                    {Math.round(restoreProgress) <= 30 ? 'Subiendo archivo...' : 
                     Math.round(restoreProgress) <= 60 ? 'Procesando backup...' : 
                     Math.round(restoreProgress) <= 90 ? 'Restaurando datos...' : 
                     'Finalizando...'}
                  </span>
                </div>
                <span className="text-sm font-medium">{Math.round(restoreProgress)}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    Math.round(restoreProgress) <= 30 ? 'bg-blue-500' :
                    Math.round(restoreProgress) <= 60 ? 'bg-yellow-500' :
                    Math.round(restoreProgress) <= 90 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${restoreProgress}%` }}
                ></div>
              </div>
              
              {/* Indicador de fase actual */}
              <div className="flex justify-between text-xs text-gray-500">
                <span className={`${Math.round(restoreProgress) <= 30 ? 'text-blue-600 font-medium' : ''}`}>
                  📤 Subida
                </span>
                <span className={`${Math.round(restoreProgress) > 30 && Math.round(restoreProgress) <= 60 ? 'text-yellow-600 font-medium' : ''}`}>
                  📦 Procesamiento
                </span>
                <span className={`${Math.round(restoreProgress) > 60 && Math.round(restoreProgress) <= 90 ? 'text-orange-600 font-medium' : ''}`}>
                  🔄 Restauración
                </span>
                <span className={`${Math.round(restoreProgress) > 90 ? 'text-green-600 font-medium' : ''}`}>
                  ✅ Finalización
                </span>
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
                  {log}
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
