const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Project = require('../src/models/Project');
const Column = require('../src/models/Column');
const Task = require('../src/models/Task');

// Use a test database
const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/taskboard_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clear database before each test
  await Project.deleteMany({});
  await Column.deleteMany({});
  await Task.deleteMany({});
});

describe('API Smoke Tests', () => {
  describe('Health Check', () => {
    it('GET /health should return OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
        expect(['connected', 'not-configured']).toContain(res.body.db);
    });
  });

  describe('Projects API', () => {
    it('POST /api/projects should create a project with default columns', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project', description: 'Test description' });
      
      expect(res.status).toBe(201);
      expect(res.body.project.name).toBe('Test Project');
      expect(res.body.columns).toHaveLength(3);
      expect(res.body.columns[0].title).toBe('To Do');
    });

    it('POST /api/projects should fail without name', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ description: 'No name' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('GET /api/projects should list all projects', async () => {
      // Create a project first
      await request(app)
        .post('/api/projects')
        .send({ name: 'Project 1' });
      
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(res.body.projects).toHaveLength(1);
      expect(res.body.projects[0].name).toBe('Project 1');
    });

    it('GET /api/projects/:id should return project board', async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' });
      
      const projectId = createRes.body.project._id;
      const res = await request(app).get(`/api/projects/${projectId}`);
      
      expect(res.status).toBe(200);
      expect(res.body.project.name).toBe('Test Project');
      expect(res.body.columns).toHaveLength(3);
      expect(res.body.tasksByColumn).toBeDefined();
    });

    it('GET /api/projects/:id should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/projects/invalid_id');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid id format');
    });
  });

  describe('Tasks API', () => {
    let projectId, columnId;

    beforeEach(async () => {
      // Create a project and get column ID
      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'Task Test Project' });
      projectId = res.body.project._id;
      columnId = res.body.columns[0]._id; // To Do column
    });

    it('POST /api/tasks should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          columnId,
          title: 'Test Task',
          description: 'Task description'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.task.title).toBe('Test Task');
      expect(res.body.task.position).toBe(1);
    });

    it('POST /api/tasks should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'No columnId' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('PUT /api/tasks/:id should update a task', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .send({ columnId, title: 'Original Title' });
      
      const taskId = createRes.body.task._id;
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(200);
      expect(res.body.task.title).toBe('Updated Title');
    });

    it('DELETE /api/tasks/:id should delete a task', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .send({ columnId, title: 'Task to delete' });
      
      const taskId = createRes.body.task._id;
      const res = await request(app).delete(`/api/tasks/${taskId}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PATCH /api/tasks/:id/move should move task to another column', async () => {
      // Create another column (In Progress)
      const projectRes = await request(app).get(`/api/projects/${projectId}`);
      const inProgressColumnId = projectRes.body.columns[1].id; // In Progress

      const createRes = await request(app)
        .post('/api/tasks')
        .send({ columnId, title: 'Task to move' });
      
      const taskId = createRes.body.task._id;
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/move`)
        .send({ destColumnId: inProgressColumnId });
      
      expect(res.status).toBe(200);
      expect(res.body.task.columnId).toBe(inProgressColumnId);
      expect(res.body.task.position).toBe(1);
    });

    it('PATCH /api/tasks/:id/move should position task between two tasks', async () => {
      // Create 2 tasks
      const task1Res = await request(app)
        .post('/api/tasks')
        .send({ columnId, title: 'Task 1' });
      
      const task2Res = await request(app)
        .post('/api/tasks')
        .send({ columnId, title: 'Task 2' });
      
      const task1Id = task1Res.body.task._id;
      const task2Id = task2Res.body.task._id;

      // Create task 3 and move it between 1 and 2
      const task3Res = await request(app)
        .post('/api/tasks')
        .send({ columnId, title: 'Task 3' });
      
      const task3Id = task3Res.body.task._id;
      const res = await request(app)
        .patch(`/api/tasks/${task3Id}/move`)
        .send({
          destColumnId: columnId,
          beforeTaskId: task1Id,
          afterTaskId: task2Id
        });
      
      expect(res.status).toBe(200);
      expect(res.body.task.position).toBeGreaterThan(1);
      expect(res.body.task.position).toBeLessThan(2);
    });
  });
});
