import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

interface NetworkConfig {
  localIP: string;
  publicIP?: string;
  hostname: string;
  platform: string;
}

/**
 * Detecta automáticamente la configuración de red del servidor
 */
export class NetworkDetector {
  private static instance: NetworkDetector;
  private config: NetworkConfig | null = null;

  private constructor() {}

  public static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector();
    }
    return NetworkDetector.instance;
  }

  /**
   * Detecta la IP local usando múltiples métodos
   */
  private async detectLocalIP(): Promise<string> {
    const methods = [
      this.getIPFromInterfaces.bind(this),
      this.getIPFromRoute.bind(this),
      this.getIPFromHostname.bind(this),
      this.getIPFromSocket.bind(this)
    ];

    for (const method of methods) {
      try {
        const ip = await method();
        if (ip && this.isValidLocalIP(ip)) {
          console.log(`✅ IP detectada con ${method.name}: ${ip}`);
          return ip;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.warn(`⚠️ Método ${method.name} falló:`, errorMessage);
      }
    }

    console.warn('🔄 Usando localhost como fallback');
    return 'localhost';
  }

  /**
   * Método 1: Usar os.networkInterfaces() (más confiable)
   */
  private async getIPFromInterfaces(): Promise<string | null> {
    const interfaces = os.networkInterfaces();
    
    // Priorizar interfaces comunes
    const priorityOrder = ['eth0', 'wlan0', 'en0', 'Wi-Fi', 'Ethernet'];
    
    for (const interfaceName of priorityOrder) {
      const networkInterface = interfaces[interfaceName];
      if (networkInterface) {
        for (const net of networkInterface) {
          if (net.family === 'IPv4' && !net.internal && this.isValidLocalIP(net.address)) {
            return net.address;
          }
        }
      }
    }

    // Si no encuentra en interfaces prioritarias, buscar en todas
    for (const [name, networkInterface] of Object.entries(interfaces)) {
      if (networkInterface) {
        for (const net of networkInterface) {
          if (net.family === 'IPv4' && !net.internal && this.isValidLocalIP(net.address)) {
            return net.address;
          }
        }
      }
    }

    return null;
  }

  /**
   * Método 2: Usar comando ip route (Linux)
   */
  private async getIPFromRoute(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('ip route get 1.1.1.1 2>/dev/null');
      const match = stdout.match(/src\s+([^\s]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Método 3: Usar hostname -I (Linux/Unix)
   */
  private async getIPFromHostname(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('hostname -I 2>/dev/null');
      const ips = stdout.trim().split(' ');
      return ips.find(ip => this.isValidLocalIP(ip)) || null;
    } catch {
      return null;
    }
  }

  /**
   * Método 4: Crear socket a IP externa para determinar IP local
   */
  private async getIPFromSocket(): Promise<string | null> {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = net.createConnection(80, '8.8.8.8');
      
      socket.on('connect', () => {
        const localAddress = socket.localAddress;
        socket.destroy();
        resolve(this.isValidLocalIP(localAddress) ? localAddress : null);
      });
      
      socket.on('error', () => {
        resolve(null);
      });
      
      // Timeout después de 3 segundos
      setTimeout(() => {
        socket.destroy();
        resolve(null);
      }, 3000);
    });
  }

  /**
   * Valida si una IP es una dirección local válida
   */
  private isValidLocalIP(ip: string): boolean {
    if (!ip || ip === '127.0.0.1' || ip === 'localhost') return false;
    
    // Verificar rangos de IP privadas
    const privateRanges = [
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Obtiene la configuración completa de red
   */
  public async getNetworkConfig(): Promise<NetworkConfig> {
    if (this.config) {
      return this.config;
    }

    console.log('🔍 Detectando configuración de red...');
    
    const localIP = await this.detectLocalIP();
    const hostname = os.hostname();
    const platform = os.platform();

    this.config = {
      localIP,
      hostname,
      platform
    };

    console.log('📡 Configuración de red detectada:', {
      localIP: this.config.localIP,
      hostname: this.config.hostname,
      platform: this.config.platform
    });

    return this.config;
  }

  /**
   * Obtiene la URL base del servidor
   */
  public async getServerURL(port: number = 3001): Promise<string> {
    const config = await this.getNetworkConfig();
    const ip = config.localIP === 'localhost' ? 'localhost' : config.localIP;
    return `http://${ip}:${port}`;
  }

  /**
   * Obtiene la URL del frontend
   */
  public async getFrontendURL(): Promise<string> {
    const config = await this.getNetworkConfig();
    const ip = config.localIP === 'localhost' ? 'localhost' : config.localIP;
    return `http://${ip}`;
  }

  /**
   * Obtiene todas las URLs de acceso
   */
  public async getAccessURLs(port: number = 3001): Promise<{
    local: string;
    network: string;
    api: string;
    frontend: string;
  }> {
    const config = await this.getNetworkConfig();
    
    return {
      local: `http://localhost:${port}`,
      network: config.localIP !== 'localhost' ? `http://${config.localIP}:${port}` : `http://localhost:${port}`,
      api: await this.getServerURL(port),
      frontend: await this.getFrontendURL()
    };
  }

  /**
   * Limpia el caché de configuración (útil para testing)
   */
  public clearCache(): void {
    this.config = null;
  }
}

// Instancia singleton para exportar
export const networkDetector = NetworkDetector.getInstance();

// Función auxiliar para obtener IP rápidamente
export async function getLocalIP(): Promise<string> {
  const config = await networkDetector.getNetworkConfig();
  return config.localIP;
}

// Función auxiliar para obtener URLs
export async function getServerURLs(port: number = 3001) {
  return await networkDetector.getAccessURLs(port);
}
