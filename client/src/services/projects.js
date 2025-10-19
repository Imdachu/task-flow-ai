import api from './api';

// Get all projects
export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data.projects;
};

// Get single project with board data (columns + tasks)
export const getProjectBoard = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

// Create a new project
export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

// Delete a project (if you add this endpoint later)
export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

// Summarize a project
export const summarizeProject = async (projectId) => {
  const response = await api.post(`/projects/${projectId}/summarize`);
  return response.data; // { summary, cached, ... }
};
