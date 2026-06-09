import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'Real-time Task Management System',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
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

        RegisterUser: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Ulrich Killian' },
            email: { type: 'string', format: 'email', example: 'ulrich@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        LoginUser: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'ulrich@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },


        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] },
            dueDate: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        TaskInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Finish IoT Project' },
            description: { type: 'string', example: 'Complete Node-RED integration' },
            dueDate: { type: 'string', format: 'date', example: '2026-06-01' }
          }
        }
      }
    }
  },
  apis: [path.join(__dirname, './src/routes/**/*.js')],
};

export default swaggerJsdoc(options);