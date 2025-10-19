const { summarizeProject, askTask, GeminiError } = require('../src/services/gemini');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const mock = new MockAdapter(axios);

describe('Gemini Service', () => {
  afterEach(() => {
    mock.reset();
  });

  test('summarizeProject should return a summary', async () => {
    const mockResponse = { choices: [{ message: { content: 'Summary of tasks' } }] };
    mock.onPost().reply(200, mockResponse);

    const tasks = [
      { title: 'Task 1', description: 'Description 1' },
      { title: 'Task 2', description: 'Description 2' },
    ];

    const summary = await summarizeProject(tasks);
    expect(summary).toBe('Summary of tasks');
  });

  test('askTask should return insights', async () => {
    const mockResponse = { choices: [{ message: { content: 'Insights for task' } }] };
    mock.onPost().reply(200, mockResponse);

    const task = { title: 'Task 1', description: 'Description 1' };
    const siblings = [
      { title: 'Sibling Task 1', description: 'Sibling Description 1' },
    ];

    const insights = await askTask(task, siblings);
    expect(insights).toBe('Insights for task');
  });

  test('GeminiError should handle API errors', async () => {
    mock.onPost().reply(500, { error: 'Internal Server Error' });

    const tasks = [
      { title: 'Task 1', description: 'Description 1' },
    ];

    await expect(summarizeProject(tasks)).rejects.toThrow(GeminiError);
  });
});