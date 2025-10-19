
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getProjectBoard } from '../services/projects';
import { createTask, updateTask, deleteTask } from '../services/tasks';
import { useApi } from '../utils/useApi';
import Column from '../components/Column';
import CreateTaskModal from '../components/CreateTaskModal';


function BoardView() {
  const { projectId } = useParams();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [editTask, setEditTask] = useState(null); // For editing
  const [deleteTaskId, setDeleteTaskId] = useState(null); // For deleting

  // Fetch board data
  const {
    data: boardData,
    loading: loadingBoard,
    error: errorBoard,
    execute: fetchBoard,
  } = useApi(getProjectBoard);

  // Create task
  const {
    loading: creatingTask,
    error: errorCreateTask,
    execute: createTaskApi,
  } = useApi(createTask);

  // Update task
  const {
    loading: updatingTask,
    error: errorUpdateTask,
    execute: updateTaskApi,
  } = useApi(updateTask);

  // Delete task
  const {
    loading: deletingTask,
    error: errorDeleteTask,
    execute: deleteTaskApi,
  } = useApi(deleteTask);

  useEffect(() => {
    if (projectId) fetchBoard(projectId);
    // eslint-disable-next-line
  }, [projectId]);

  // Create Task
  const handleCreateTask = async (formData) => {
    try {
      await createTaskApi(formData);
      setIsTaskModalOpen(false);
      fetchBoard(projectId);
    } catch (err) {}
  };

  // Edit Task
  const handleEditTask = async (taskId, updates) => {
    try {
      await updateTaskApi(taskId, updates);
      setEditTask(null);
      fetchBoard(projectId);
    } catch (err) {}
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTaskApi(taskId);
      setDeleteTaskId(null);
      fetchBoard(projectId);
    } catch (err) {}
  };

  const handleAddTaskClick = (columnId) => {
    setSelectedColumnId(columnId);
    setIsTaskModalOpen(true);
  };

  // Prepare columns and tasks from API data
  let columns = [];
  if (boardData && boardData.columns) {
    columns = boardData.columns.map((col) => ({
      id: col.id || col._id,
      title: col.title,
      tasks:
        (boardData.tasksByColumn && boardData.tasksByColumn[col.id || col._id]
          ? boardData.tasksByColumn[col.id || col._id].map((task) => ({
              id: task._id || task.id,
              title: task.title,
              description: task.description,
              columnId: col.id || col._id,
            }))
          : []),
    }));
  }

  // Render
  return (
    <div className="board-view-page">
      <div className="board-header">
        <h1>{boardData?.project?.name || 'Project Board'}</h1>
        <p>{boardData?.project?.description || 'Manage tasks across columns'}</p>
      </div>

      {/* Loading and error states */}
      {loadingBoard ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <h2>Loading board...</h2>
        </div>
      ) : errorBoard ? (
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h2>Error loading board</h2>
          <p>{errorBoard}</p>
          <button className="btn btn-primary" onClick={() => fetchBoard(projectId)}>
            Retry
          </button>
        </div>
      ) : columns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2>No columns found</h2>
          <p>This project has no columns yet.</p>
        </div>
      ) : (
        <div className="board-columns">
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              onAddTask={() => handleAddTaskClick(col.id)}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              editingTask={editTask}
              setEditingTask={setEditTask}
              deletingTaskId={deleteTaskId}
              setDeletingTaskId={setDeleteTaskId}
            />
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        columnId={selectedColumnId}
        loading={creatingTask}
        error={errorCreateTask}
      />
      {/* Error modals for update/delete can be added similarly if needed */}
    </div>
  );
}

export default BoardView;
