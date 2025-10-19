require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
const LIST_MODELS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function testGeminiAPI() {
  try {
    const response = await axios.post(
      ENDPOINT,
      {
        contents: [
          {
            parts: [
              {
                text: 'Hello, can you summarize this text?'
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error Request:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('Error Config:', error.config);
  }
}

async function listModels() {
  try {
    const response = await axios.get(LIST_MODELS_ENDPOINT);
    console.log('Available Models:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error Request:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('Error Config:', error.config);
  }
}

testGeminiAPI();
listModels();