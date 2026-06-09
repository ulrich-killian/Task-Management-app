import request from 'supertest';
import app from '../server.js';

describe('Task Management API E2E Suite', () => {
  let authToken;
  let taskId;

  const uniqueId = Math.floor(100000 + Math.random() * 900000); 
  const testUser = {
    username: `user${uniqueId}`,
    email: `validtest${uniqueId}@example.com`,
    password: 'Password123!'
  };
  
  describe('Auth Flow & Edge Cases', () => {
    it('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser);
      
      if (res.statusCode !== 201) {
        console.log(' Register Validation Failed:', res.body);
      }
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    }, 15000); 

    it('should return 400 or 409 for duplicate registration', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send(testUser);
      
      expect([400, 409]).toContain(res.statusCode);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({ email: testUser.email, password: testUser.password });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      
      if (!authToken) {
        authToken = res.body.token;
      }
    });
  });

  describe('Protected Middleware Guard', () => {
    it('should deny access to tasks without a token (401)', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.statusCode).toEqual(401);
    });

    it('should deny access with a malformed/bad token (401)', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid_token_string');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Task CRUD & Ownership Workflow', () => {
    it('should allow an authenticated user to create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          title: 'Write automated validation tests', 
          description: 'Ensure everything functions perfectly'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      
      taskId = res.body.data.id;
    });

    it('should return 404 for a non-existent task ID', async () => {
      const res = await request(app)
        .get('/api/tasks/999999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(404);
    });
  });
});