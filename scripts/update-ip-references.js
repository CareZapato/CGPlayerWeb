const fs = require('fs');
const path = require('path');

// Leer manualmente el archivo .env del frontend
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

// Obtener la IP actual del .env
const envPath = path.join(__dirname, '../frontend/.env');
const env = readEnvFile(envPath);
const currentIP = env.VITE_SERVER_IP;

if (!currentIP) {
  console.error('❌ No se encontró VITE_SERVER_IP en frontend/.env');
  process.exit(1);
}

console.log(`🔄 Actualizando referencias de IP a: ${currentIP}`);

// Lista de archivos que contienen IPs hardcodeadas y patrones a reemplazar
const filesToUpdate = [
  {
    file: 'abrir_puertos_firewall.ps1',
    patterns: [
      {
        regex: /Frontend: http:\/\/\d+\.\d+\.\d+\.\d+:5173/g,
        replacement: `Frontend: http://${currentIP}:5173`
      },
      {
        regex: /Backend API: http:\/\/\d+\.\d+\.\d+\.\d+:3001\/api/g,
        replacement: `Backend API: http://${currentIP}:3001/api`
      }
    ]
  },
  {
    file: 'ABRIR_PUERTOS.bat',
    patterns: [
      {
        regex: /Frontend: http:\/\/\d+\.\d+\.\d+\.\d+:5173/g,
        replacement: `Frontend: http://${currentIP}:5173`
      },
      {
        regex: /Backend:  http:\/\/\d+\.\d+\.\d+\.\d+:3001\/api/g,
        replacement: `Backend:  http://${currentIP}:3001/api`
      }
    ]
  },
  {
    file: 'CONFIGURAR_FIREWALL.bat',
    patterns: [
      {
        regex: /Frontend: http:\/\/\d+\.\d+\.\d+\.\d+:5173/g,
        replacement: `Frontend: http://${currentIP}:5173`
      },
      {
        regex: /Backend API: http:\/\/\d+\.\d+\.\d+\.\d+:3001\/api/g,
        replacement: `Backend API: http://${currentIP}:3001/api`
      },
      {
        regex: /Diagnóstico: http:\/\/\d+\.\d+\.\d+\.\d+:5173\/diagnostico-completo\.html/g,
        replacement: `Diagnóstico: http://${currentIP}:5173/diagnostico-completo.html`
      },
      {
        regex: /Abre http:\/\/\d+\.\d+\.\d+\.\d+:5173\/diagnostico-completo\.html/g,
        replacement: `Abre http://${currentIP}:5173/diagnostico-completo.html`
      }
    ]
  },
  {
    file: 'GUIA_ACCESO_MOVIL.md',
    patterns: [
      {
        regex: /La IP actual detectada es: \*\*\d+\.\d+\.\d+\.\d+\*\*/g,
        replacement: `La IP actual detectada es: **${currentIP}**`
      },
      {
        regex: /- \*\*Frontend \(App Web\)\*\*: `http:\/\/\d+\.\d+\.\d+\.\d+:5173`/g,
        replacement: `- **Frontend (App Web)**: \`http://${currentIP}:5173\``
      },
      {
        regex: /- \*\*Backend \(API\)\*\*: `http:\/\/\d+\.\d+\.\d+\.\d+:3001\/api`/g,
        replacement: `- **Backend (API)**: \`http://${currentIP}:3001/api\``
      },
      {
        regex: /➜  Network: http:\/\/\d+\.\d+\.\d+\.\d+:5173\//g,
        replacement: `➜  Network: http://${currentIP}:5173/`
      },
      {
        regex: /ping \d+\.\d+\.\d+\.\d+/g,
        replacement: `ping ${currentIP}`
      },
      {
        regex: /telnet \d+\.\d+\.\d+\.\d+ 5173/g,
        replacement: `telnet ${currentIP} 5173`
      },
      {
        regex: /telnet \d+\.\d+\.\d+\.\d+ 3001/g,
        replacement: `telnet ${currentIP} 3001`
      },
      {
        regex: /ir a: `http:\/\/\d+\.\d+\.\d+\.\d+:5173`/g,
        replacement: `ir a: \`http://${currentIP}:5173\``
      }
    ]
  }
];

// Actualizar cada archivo
filesToUpdate.forEach(({ file, patterns }) => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Archivo no encontrado: ${file}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    patterns.forEach(({ regex, replacement }) => {
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, replacement);
        modified = true;
        console.log(`✅ ${file}: ${matches.length} referencia(s) actualizada(s)`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    } else {
      console.log(`ℹ️  ${file}: Sin cambios necesarios`);
    }
    
  } catch (error) {
    console.error(`❌ Error procesando ${file}:`, error.message);
  }
});

// Crear archivo de configuración central
const configContent = `# ================================================================
#                    CONFIGURACIÓN CENTRAL DE IP
# ================================================================
# 
# Este archivo contiene la IP actual del servidor.
# Para cambiar la IP en todo el proyecto:
# 
# 1. Edita este archivo y cambia SERVER_IP
# 2. Ejecuta: node scripts/update-ip-references.js
# 3. Reinicia los servidores
#
# IP ACTUAL: ${currentIP}
# ================================================================

SERVER_IP=${currentIP}
FRONTEND_PORT=5173
BACKEND_PORT=3001

# URLs generadas automáticamente
FRONTEND_URL=http://\${SERVER_IP}:\${FRONTEND_PORT}
BACKEND_URL=http://\${SERVER_IP}:\${BACKEND_PORT}
API_URL=\${BACKEND_URL}/api
DOCS_URL=\${BACKEND_URL}/api-docs

# URLs para acceso externo
EXTERNAL_FRONTEND=http://${currentIP}:5173
EXTERNAL_BACKEND=http://${currentIP}:3001
EXTERNAL_API=http://${currentIP}:3001/api
`;

fs.writeFileSync(path.join(__dirname, '..', 'ip-config.env'), configContent);

console.log('\n✅ Actualización completada!');
console.log(`📝 IP configurada: ${currentIP}`);
console.log('📄 Creado archivo de configuración: ip-config.env');
console.log('\n🔄 Para cambiar la IP en el futuro:');
console.log('   1. Edita frontend/.env → VITE_SERVER_IP=NUEVA_IP');
console.log('   2. Ejecuta: node scripts/update-ip-references.js');
console.log('   3. Reinicia los servidores');
