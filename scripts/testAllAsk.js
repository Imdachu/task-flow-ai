require('dotenv').config();
const axios = require('axios');

const BASE = process.env.API_BASE || 'http://localhost:4000/api';

async function listProjects() {
  const resp = await axios.get(`${BASE}/projects`);
  return resp.data.projects || [];
}

async function getProjectBoard(id) {
  const resp = await axios.get(`${BASE}/projects/${id}`);
  return resp.data;
}

async function callAsk(taskId) {
  const resp = await axios.post(`${BASE}/tasks/${taskId}/ask`, {}, { timeout: 20000 });
  return resp.data;
}

(async function run() {
  try {
    const projects = await listProjects();
    console.log('Found projects:', projects.length);
    const results = [];
    for (const p of projects) {
      const board = await getProjectBoard(p.id || p._id);
      const columns = board.columns || [];
      for (const col of columns) {
        const tasks = (board.tasksByColumn && board.tasksByColumn[col.id]) || [];
        for (const t of tasks) {
          try {
            process.stdout.write(`Calling ask for task ${t._id || t.id}... `);
            const res = await callAsk(t._id || t.id);
            const insights = res && res.insights;
            const ok = typeof insights === 'string' && insights.trim().length > 0;
            console.log(ok ? 'OK' : `BAD (type=${typeof insights})`);
            results.push({ taskId: t._id || t.id, ok, insights: ok ? insights.slice(0,200) : String(insights) });
          } catch (err) {
            console.log('ERROR');
            results.push({ taskId: t._id || t.id, ok:false, error: err.response ? err.response.data : err.message });
          }
        }
      }
    }
    console.log('\nSummary:');
    const failed = results.filter(r => !r.ok);
    console.log('Total tasks tested:', results.length);
    console.log('Failures:', failed.length);
    if (failed.length) console.log(JSON.stringify(failed, null, 2));
    process.exit(failed.length ? 2 : 0);
  } catch (e) {
    console.error('Test runner failed:', e && e.message);
    process.exit(1);
  }
})();
