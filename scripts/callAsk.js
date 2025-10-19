require('dotenv').config();
const axios = require('axios');

const TASK_ID = process.argv[2] || '68f3c1c7c3031cbf03e542be';
const BASE = process.env.API_BASE || 'http://localhost:4000';

async function run() {
  try {
    const url = `${BASE}/api/tasks/${TASK_ID}/ask`;
    console.log('Calling', url);
    const resp = await axios.post(url, {}, { timeout: 15000 });
    console.log('Status:', resp.status);
    console.log('Response body:', JSON.stringify(resp.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('Status:', err.response.status);
      try { console.error('Body:', JSON.stringify(err.response.data, null, 2)); } catch (e) { console.error('Body (raw):', err.response.data); }
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

run();
