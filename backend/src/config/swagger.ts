import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CGPlayerWeb API',
      version: '1.0.0',
      description: 'API para el sistema de gestión de canciones y coros de CGPlayerWeb',
      contact: {
        name: 'CGPlayerWeb Team',
        email: 'support@cgplayerweb.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            name: {
              type: 'string',
              description: 'Nombre del usuario'
            },
            lastName: {
              type: 'string',
              description: 'Apellido del usuario'
            },
            voiceType: {
              type: 'string',
              enum: ['SOPRANO', 'MEZZOSOPRANO', 'ALTO', 'TENOR', 'BARITONO', 'BAJO'],
              description: 'Tipo de voz del usuario'
            },
            locationId: {
              type: 'string',
              description: 'ID de la ubicación del usuario'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado activo del usuario'
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN', 'MODERATOR'],
              description: 'Rol del usuario'
            }
          }
        },
        Song: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la canción'
            },
            title: {
              type: 'string',
              description: 'Título de la canción'
            },
            artist: {
              type: 'string',
              description: 'Artista de la canción'
            },
            duration: {
              type: 'number',
              description: 'Duración en segundos'
            },
            filePath: {
              type: 'string',
              description: 'Ruta del archivo de audio'
            },
            voiceTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['SOPRANO', 'MEZZOSOPRANO', 'ALTO', 'TENOR', 'BARITONO', 'BAJO', 'CORO', 'ORIGINAL']
              },
              description: 'Tipos de voz disponibles para la canción'
            },
            uploadedById: {
              type: 'string',
              description: 'ID del usuario que subió la canción'
            }
          }
        },
        Location: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la ubicación'
            },
            name: {
              type: 'string',
              description: 'Nombre de la ubicación'
            },
            city: {
              type: 'string',
              description: 'Ciudad de la ubicación'
            },
            country: {
              type: 'string',
              description: 'País de la ubicación'
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del evento'
            },
            title: {
              type: 'string',
              description: 'Título del evento'
            },
            description: {
              type: 'string',
              description: 'Descripción del evento'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora del evento'
            },
            locationId: {
              type: 'string',
              description: 'ID de la ubicación del evento'
            }
          }
        },
        Playlist: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la playlist'
            },
            name: {
              type: 'string',
              description: 'Nombre de la playlist'
            },
            description: {
              type: 'string',
              description: 'Descripción de la playlist'
            },
            isPublic: {
              type: 'boolean',
              description: 'Si la playlist es pública'
            },
            createdById: {
              type: 'string',
              description: 'ID del usuario creador'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de error'
            },
            error: {
              type: 'string',
              description: 'Detalles del error (solo en desarrollo)'
            }
          }
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalUsers: {
              type: 'number',
              description: 'Total de usuarios'
            },
            activeUsers: {
              type: 'number',
              description: 'Usuarios activos'
            },
            inactiveUsers: {
              type: 'number',
              description: 'Usuarios inactivos'
            },
            totalSongs: {
              type: 'number',
              description: 'Total de canciones'
            },
            totalPlaylists: {
              type: 'number',
              description: 'Total de playlists'
            },
            totalEvents: {
              type: 'number',
              description: 'Total de eventos'
            },
            totalLocations: {
              type: 'number',
              description: 'Total de ubicaciones'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Rutas a los archivos que contienen documentación
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };
