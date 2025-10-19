const request = require('supertest');
const app = require('../src/app');
const { Project } = require('../src/models/Project');
const { Task } = require('../src/models/Task');

jest.mock('../src/models/Project');
jest.mock('../src/models/Task');

describe('Integration Tests', () => {
  test('/api/projects/:id/summarize should return a summary', async () => {
    Project.findById.mockResolvedValue({
      _id: 'projectId',
      name: 'Test Project',
      description: 'Test Description',
      updatedAt: new Date(),
    });

    Task.find.mockResolvedValue([
      { _id: 'task1', title: 'Task 1', description: 'Description 1', columnId: 'column1' },
      { _id: 'task2', title: 'Task 2', description: 'Description 2', columnId: 'column1' },
    ]);

    const response = await request(app).post('/api/projects/projectId/summarize');
    expect(response.status).toBe(200);
    expect(response.body.summary).toBeDefined();
  });

  test('/api/tasks/:id/ask should return insights', async () => {
    Task.findById.mockResolvedValue({
      _id: 'taskId',
      title: 'Task 1',
      description: 'Description 1',
      columnId: 'column1',
    });

    Task.find.mockResolvedValue([
      { _id: 'siblingTask1', title: 'Sibling Task 1', description: 'Sibling Description 1', columnId: 'column1' },
    ]);

    const response = await request(app).post('/api/tasks/taskId/ask');
    expect(response.status).toBe(200);
    expect(response.body.insights).toBeDefined();
  });
});