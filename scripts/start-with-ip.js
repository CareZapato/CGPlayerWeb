const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env') });

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    if (iface) {
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return alias.address;
        }
      }
    }
  }
  return 'localhost';
}

// Usar IP del .env o detectar automáticamente
const configuredIP = process.env.VITE_SERVER_IP;
const detectedIP = getLocalIP();
const serverIP = configuredIP || detectedIP;

console.log(`🌐 IP configurada en .env: ${configuredIP || 'No configurada'}`);
console.log(`🌐 IP detectada automáticamente: ${detectedIP}`);
console.log(`🌐 Usando IP: ${serverIP}`);
console.log(`📱 Frontend disponible en: http://${serverIP}:5173`);
console.log(`🚀 Backend disponible en: http://${serverIP}:3001`);

// Actualizar frontend .env solo si la IP cambió
if (configuredIP !== serverIP) {
  console.log(`📝 Actualizando frontend .env con nueva IP: ${serverIP}`);
  
  const frontendEnvPath = path.join(__dirname, '../frontend/.env');
  let envContent = fs.readFileSync(frontendEnvPath, 'utf8');
  
  // Actualizar la IP del servidor
  envContent = envContent.replace(
    /VITE_SERVER_IP=.*/,
    `VITE_SERVER_IP=${serverIP}`
  );
  
  fs.writeFileSync(frontendEnvPath, envContent);
}

// Actualizar backend .env
console.log(`📝 Actualizando backend .env...`);
const backendEnvPath = path.join(__dirname, '../backend/.env');
let backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');

// Actualizar IP del servidor en backend
backendEnvContent = backendEnvContent.replace(
  /SERVER_IP=.*/,
  `SERVER_IP=${serverIP}`
);

// Ensure HOST is set to 0.0.0.0
if (!backendEnvContent.includes('HOST=')) {
  backendEnvContent += `\nHOST=0.0.0.0\n`;
} else {
  backendEnvContent = backendEnvContent.replace(/HOST=.*/, 'HOST=0.0.0.0');
}

fs.writeFileSync(backendEnvPath, backendEnvContent);

console.log(`✅ Configuración de entorno actualizada`);
console.log(`🔧 Archivos .env actualizados con IP: ${serverIP}`);
console.log(`📋 CORS configurado para: localhost y ${serverIP}`);
console.log(`🎯 Acceso desde otros dispositivos: http://${serverIP}:5173`);
console.log(`📚 API documentación: http://${serverIP}:3001/api-docs`);

// Mostrar instrucciones para cambiar IP manualmente
console.log('\n📝 Para cambiar la IP manualmente:');
console.log(`   1. Edita frontend/.env y cambia VITE_SERVER_IP=${serverIP}`);
console.log(`   2. Edita backend/.env y cambia SERVER_IP=${serverIP}`);
console.log('   3. Reinicia los servidores');
