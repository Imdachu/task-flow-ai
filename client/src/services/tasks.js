import api from './api';

// Create a new task
export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data.task;
};

// Update task (title, description)
export const updateTask = async (taskId, updates) => {
  const response = await api.put(`/tasks/${taskId}`, updates);
  return response.data.task;
};

// Delete a task
export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// Move task (drag and drop)
export const moveTask = async (taskId, moveData) => {
  const response = await api.patch(`/tasks/${taskId}/move`, moveData);
  return response.data.task;
};
