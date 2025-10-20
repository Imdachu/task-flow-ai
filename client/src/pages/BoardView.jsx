import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getProjectBoard, summarizeProject } from '../services/projects';
import { createTask, updateTask, deleteTask, moveTask, askTask } from '../services/tasks';
import { useApi } from '../utils/useApi';
import useApiWithToast from '../utils/useApiWithToast';
import Column from '../components/Column';
import Spinner from '../components/Spinner';
import CreateTaskModal from '../components/CreateTaskModal';
import './BoardView.css';

function BoardView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [editTask, setEditTask] = useState(null); // For editing
  const [deleteTaskId, setDeleteTaskId] = useState(null); // For deleting
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [modalTask, setModalTask] = useState(null);

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
  } = useApiWithToast(createTask, { successMessage: 'Task created', errorMessage: 'Failed to create task' });

  // Update task
  const {
    loading: updatingTask,
    error: errorUpdateTask,
    execute: updateTaskApi,
  } = useApiWithToast(updateTask, { successMessage: 'Task updated', errorMessage: 'Failed to update task' });

  // Delete task
  const {
    loading: deletingTask,
    error: errorDeleteTask,
    execute: deleteTaskApi,
  } = useApiWithToast(deleteTask, { successMessage: 'Task deleted', errorMessage: 'Failed to delete task' });

  // Move task
  const {
    loading: movingTask,
    error: errorMoveTask,
    execute: moveTaskApi,
  } = useApiWithToast(moveTask, { successMessage: 'Task moved', errorMessage: 'Failed to move task' });

  useEffect(() => {
    console.log('BoardView mounted with projectId:', projectId);
    if (projectId) fetchBoard(projectId);
    // eslint-disable-next-line
  }, [projectId]);

  // Log boardData to debug rendering
  useEffect(() => {
    console.log('Board data updated:', boardData);
  }, [boardData]);

  // Log errors to the console for debugging
  useEffect(() => {
    if (errorBoard) {
      console.error('Error loading board:', errorBoard);
    }
  }, [errorBoard]);

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

  // Drag-and-drop handlers
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    // Find source and destination column/task
    let sourceCol, destCol, sourceTask, beforeTaskId = null, afterTaskId = null;
    for (const col of columns) {
      const idx = col.tasks.findIndex((t) => t.id === active.id);
      if (idx !== -1) {
        sourceCol = col;
        sourceTask = col.tasks[idx];
        break;
      }
    }
    for (const col of columns) {
      // If over.id is a task id inside the column
      if (col.tasks.some((t) => t.id === over.id)) {
        destCol = col;
        break;
      }
      // If over.id equals the column id (dropping onto an empty column)
      if (col.id === over.id) {
        destCol = col;
        break;
      }
    }
    if (!sourceCol || !destCol || !sourceTask) return;

    // Find position for move
    const destTasks = destCol.tasks;

    if (destTasks.length === 0) {
      // Dropping into an empty column: no before/after ids needed
      try {
        await moveTaskApi(active.id, {
          destColumnId: destCol.id,
        });
        fetchBoard(projectId);
      } catch (err) {}
      return;
    }

    const overIdx = destTasks.findIndex((t) => t.id === over.id);
    if (overIdx !== -1) {
      // Place after the over task
      beforeTaskId = destTasks[overIdx].id;
      afterTaskId = destTasks[overIdx + 1] ? destTasks[overIdx + 1].id : null;
    }

    // Call moveTask API
    try {
      await moveTaskApi(active.id, {
        destColumnId: destCol.id,
        beforeTaskId,
        afterTaskId,
      });
      fetchBoard(projectId);
    } catch (err) {}
  };

  // Summarize project (use centralized service exported from client services)
  const { execute: summarizeProjectApi, loading: summarizeLoading } = useApiWithToast(
    (id) => summarizeProject(id),
    {
      successMessage: 'Project summarized successfully!',
      errorMessage: 'Failed to summarize project.',
    }
  );

  const { execute: askAI, loading: askAILoading } = useApiWithToast(
    (taskId) => askTask(taskId),
    {
      successMessage: 'AI insights fetched successfully!',
      errorMessage: 'Failed to fetch AI insights.',
    }
  );

  const handleSummarize = async () => {
    const result = await summarizeProjectApi(projectId);
    if (result) {
      setSummary(result.summary);
    }
  };

  // Ensure objects are properly rendered in JSX
  const handleAskAI = async (task) => {
    setModalTask(task);
    setAiInsights(null);
    try {
      const result = await askAI(task.id);
      if (result) {
        // Defensive: ensure insights is a plain string for rendering
        const raw = result.insights;
        const normalized = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
        setAiInsights(normalized);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
    }
  };

  // Render
  return (
    <div className="board-view-page">
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>&larr; Back</button>
      </div>
      <div className="board-header">
        <h1>{boardData?.project?.name || 'Project Board'}</h1>
        <p>{boardData?.project?.description || 'Manage tasks across columns'}</p>
      </div>

      {/* Loading and error states */}
      {loadingBoard ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Spinner /></div>
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
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="board-columns">
            {columns.map((col) => (
              <SortableContext key={col.id} items={col.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <Column
                  column={col}
                  onAddTask={() => handleAddTaskClick(col.id)}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onAskAI={handleAskAI} // Pass handleAskAI
                  editingTask={editTask}
                  setEditingTask={setEditTask}
                  deletingTaskId={deleteTaskId}
                  setDeletingTaskId={setDeleteTaskId}
                />
              </SortableContext>
            ))}
          </div>
        </DndContext>
      )}

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        columnId={selectedColumnId}
        loading={creatingTask}
        error={errorCreateTask}
      />

      {/* Summarize Project Button */}
      <div className="summarize-project">
        <button className="btn btn-primary" onClick={handleSummarize} disabled={loadingSummary}>
          {loadingSummary ? 'Summarizing...' : 'Summarize Project'}
        </button>
        {summary && (
          <div className="summary">
            <h3>Project Summary</h3>
            <p>{typeof summary === 'string' ? summary : JSON.stringify(summary)}</p>
          </div>
        )}
      </div>

      {aiInsights && modalTask && (
        <div className="modal">
          <h3>AI Insights for "{modalTask.title}"</h3>
          <p>{typeof aiInsights === 'string' ? aiInsights : JSON.stringify(aiInsights)}</p>
          <button onClick={() => setAiInsights(null)}>Close</button>
        </div>
      )}

      {/* Error modals for update/delete can be added similarly if needed */}
    </div>
  );
}

export default BoardView;
