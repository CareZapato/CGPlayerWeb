const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

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

const localIP = getLocalIP();

console.log(`🌐 Detected local IP: ${localIP}`);
console.log(`📱 Frontend will be available at: http://${localIP}:5173`);
console.log(`🚀 Backend will be available at: http://${localIP}:3001`);

// Update frontend .env
const frontendEnvPath = path.join(__dirname, '../frontend/.env');
const frontendEnvContent = `VITE_API_BASE_URL=http://${localIP}:3001
VITE_SERVER_HOST=${localIP}
VITE_SERVER_PORT=3001
`;

fs.writeFileSync(frontendEnvPath, frontendEnvContent);

// Update backend .env
const backendEnvPath = path.join(__dirname, '../backend/.env');
let backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');

// Update CORS_ORIGINS to include the new IP
backendEnvContent = backendEnvContent.replace(
  /CORS_ORIGINS=.*/,
  `CORS_ORIGINS=http://localhost:5173,http://${localIP}:5173`
);

// Ensure HOST is set to 0.0.0.0
if (!backendEnvContent.includes('HOST=')) {
  backendEnvContent += `\nHOST=0.0.0.0\n`;
} else {
  backendEnvContent = backendEnvContent.replace(/HOST=.*/, 'HOST=0.0.0.0');
}

fs.writeFileSync(backendEnvPath, backendEnvContent);

console.log(`✅ Environment configured for network access`);
console.log(`🔧 Updated .env files with IP: ${localIP}`);
console.log(`📋 CORS configured for: localhost and ${localIP}`);
console.log(`🎯 Access from other devices: http://${localIP}:5173`);
