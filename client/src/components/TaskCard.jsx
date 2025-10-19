import './TaskCard.css';

function TaskCard({ task, onEdit, onDelete, isEditing, isDeleting, onEditTask, onDeleteTask, setEditingTask, setDeletingTaskId }) {
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);

  // Handle edit submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onEditTask(task.id, { title: editTitle, description: editDescription });
      setEditMode(false);
      setEditingTask(null);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingTask(null);
    setEditTitle(task.title);
    setEditDescription(task.description);
  };

  // Handle delete
  const handleDelete = () => {
    onDeleteTask(task.id);
    setDeletingTaskId(null);
  };

  // Show edit form if editing
  if (isEditing || editMode) {
    return (
      <form className="task-card" onSubmit={handleEditSubmit}>
        <div className="task-card-header">
          <input
            className="task-card-title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />
        </div>
        <div className="task-card-body">
          <textarea
            className="task-card-description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    );
  }

  // Show delete confirmation if deleting
  if (isDeleting) {
    return (
      <div className="task-card" style={{ background: '#fff0f0', borderColor: '#b91c1c' }}>
        <div className="task-card-header">
          <h3 className="task-card-title">Delete Task?</h3>
        </div>
        <div className="task-card-body">
          <p className="task-card-description">Are you sure you want to delete "{task.title}"?</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingTaskId(null)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    );
  }

  // Default view
  return (
    <div className="task-card">
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
      </div>
      <div className="task-card-body">
        <p className="task-card-description">
          {task.description || 'No description provided'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => { setEditMode(true); setEditingTask(task); }}>Edit</button>
        <button type="button" className="btn btn-secondary" onClick={() => setDeletingTaskId(task.id)}>Delete</button>
      </div>
    </div>
  );
}

import { useState } from 'react';
export default TaskCard;
