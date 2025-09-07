// Test del backup system con logging detallado
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(urlObj, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => parsedData, text: () => data, headers: res.headers });
        } catch (e) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => ({}), text: () => data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testBackup() {
  const baseUrl = 'http://192.168.1.10:3001/api';
  
  try {
    console.log('🔐 Iniciando sesión...');
    
    // 1. Login para obtener token
    const loginResponse = await makeRequest(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@cgplayer.com',
        password: 'cgplayer123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Error en login:', loginResponse.status);
      console.error('Error details:', loginResponse.text());
      return;
    }
    
    const loginData = loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // 2. Test system info
    console.log('\n📊 Obteniendo información del sistema...');
    const systemInfoResponse = await makeRequest(`${baseUrl}/admin/system-info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (systemInfoResponse.ok) {
      const systemInfo = systemInfoResponse.json();
      console.log('✅ System Info:', systemInfo);
    } else {
      console.log('❌ Error obteniendo system info:', systemInfoResponse.status);
    }
    
    // 3. Test backup list
    console.log('\n📋 Obteniendo lista de backups...');
    const backupsListResponse = await makeRequest(`${baseUrl}/admin/backups`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (backupsListResponse.ok) {
      const backupsList = backupsListResponse.json();
      console.log('✅ Backups disponibles:', backupsList.length);
    } else {
      console.log('❌ Error obteniendo backups list:', backupsListResponse.status);
    }
    
    // 4. Crear backup y monitorear logs
    console.log('\n🔄 Creando backup...');
    console.log('⚠️ Revisa la consola del servidor para ver el logging detallado de archivos...');
    
    const backupResponse = await makeRequest(`${baseUrl}/admin/backup/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (backupResponse.ok) {
      console.log('✅ Backup creado exitosamente');
      console.log('📁 Headers de respuesta:', backupResponse.headers);
    } else {
      console.error('❌ Error creando backup:', backupResponse.status);
      console.error('Error details:', backupResponse.text());
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error);
  }
}

testBackup();
