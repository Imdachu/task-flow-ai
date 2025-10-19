require('dotenv').config();
const axios = require('axios');

const BASE = process.env.API_BASE || 'http://localhost:4000/api';

async function run() {
  let createdProjectId = null;
  let createdTaskId = null;
  let columnId = null;
  let results = [];
  try {
    // 1. Create Project
    const projectResp = await axios.post(`${BASE}/projects`, { name: 'Test Project', description: 'Automated test project' });
    createdProjectId = projectResp.data.project._id || projectResp.data.project.id;
    results.push({ step: 'Create Project', ok: !!createdProjectId });

    // 2. List Projects
    const projectsList = await axios.get(`${BASE}/projects`);
    const found = projectsList.data.projects.some(p => (p._id || p.id) === createdProjectId);
    results.push({ step: 'List Projects', ok: found });

    // 3. Get Project Board
    const boardResp = await axios.get(`${BASE}/projects/${createdProjectId}`);
    columnId = boardResp.data.columns[0].id;
    results.push({ step: 'Get Project Board', ok: !!columnId });

    // 4. Create Task
    const taskResp = await axios.post(`${BASE}/tasks`, { columnId, title: 'Test Task', description: 'Automated test task' });
    createdTaskId = taskResp.data.task._id || taskResp.data.task.id;
    results.push({ step: 'Create Task', ok: !!createdTaskId });

    // 5. List Tasks in Board
    const boardAfterTask = await axios.get(`${BASE}/projects/${createdProjectId}`);
    const foundTask = boardAfterTask.data.tasksByColumn[columnId].some(t => (t._id || t.id) === createdTaskId);
    results.push({ step: 'List Tasks in Board', ok: foundTask });

    // 6. Update Task
    await axios.put(`${BASE}/tasks/${createdTaskId}`, { title: 'Updated Task', description: 'Updated description' });
    const updatedTaskResp = await axios.get(`${BASE}/projects/${createdProjectId}`);
    const updatedTask = updatedTaskResp.data.tasksByColumn[columnId].find(t => (t._id || t.id) === createdTaskId);
    results.push({ step: 'Update Task', ok: updatedTask && updatedTask.title === 'Updated Task' });

    // 7. Summarize Project (AI)
    const summarizeResp = await axios.post(`${BASE}/projects/${createdProjectId}/summarize`);
    results.push({ step: 'Summarize Project', ok: typeof summarizeResp.data.summary === 'string' && summarizeResp.data.summary.length > 0 });

    // 8. Ask AI for Task
    const askResp = await axios.post(`${BASE}/tasks/${createdTaskId}/ask`);
    results.push({ step: 'Ask AI for Task', ok: typeof askResp.data.insights === 'string' && askResp.data.insights.length > 0 });

    // 9. Delete Task
    await axios.delete(`${BASE}/tasks/${createdTaskId}`);
    const boardAfterDelete = await axios.get(`${BASE}/projects/${createdProjectId}`);
    const deletedTask = boardAfterDelete.data.tasksByColumn[columnId].find(t => (t._id || t.id) === createdTaskId);
    results.push({ step: 'Delete Task', ok: !deletedTask });

    // 10. Delete Project
    await axios.delete(`${BASE}/projects/${createdProjectId}`);
    const projectsAfterDelete = await axios.get(`${BASE}/projects`);
    const deletedProject = projectsAfterDelete.data.projects.find(p => (p._id || p.id) === createdProjectId);
    results.push({ step: 'Delete Project', ok: !deletedProject });

    // 11. Health Check
    const healthResp = await axios.get(`${BASE.replace('/api','')}/health`);
    results.push({ step: 'Health Check', ok: healthResp.data.status === 'ok' });

    // Print results
    console.log('\nFeature Test Results:');
    results.forEach(r => console.log(`${r.step}: ${r.ok ? 'OK' : 'FAIL'}`));
    const failed = results.filter(r => !r.ok);
    if (failed.length) {
      console.log('Failures:', failed);
      process.exit(2);
    } else {
      console.log('All feature tests passed!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Feature test failed:', err && err.message);
    process.exit(1);
  }
}

run();
