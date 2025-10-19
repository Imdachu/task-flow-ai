import './TaskCard.css';
import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function TaskCard({ task, onEdit, onDelete, isEditing, isDeleting, onEditTask, onDeleteTask, setEditingTask, setDeletingTaskId }) {
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [isFocused, setIsFocused] = useState(false);

  // DnD-kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    outline: isFocused ? '2px solid #0078d4' : 'none',
  };

  // Handle keyboard events for drag-and-drop
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      listeners.onKeyDown?.(e);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Custom logic for moving tasks up or down
    }
  };

  useEffect(() => {
    if (isFocused) {
      setNodeRef.current?.focus();
    }
  }, [isFocused]);

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
      <form
        ref={setNodeRef}
        className="task-card"
        style={style}
        onSubmit={handleEditSubmit}
        role="form"
        aria-label="Edit Task"
      >
        <div className="task-card-header">
          {/* not draggable while editing; drag handle intentionally omitted here */}
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
          <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>Cancel</button>
          <button type="submit" className="btn btn-primary" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>Save</button>
        </div>
      </form>
    );
  }

  // Show delete confirmation if deleting
  if (isDeleting) {
    return (
      <div
        ref={setNodeRef}
        className="task-card"
        style={{ ...style, background: '#fff0f0', borderColor: '#b91c1c' }}
        role="alertdialog"
        aria-labelledby={`delete-task-${task.id}`}
      >
        <div className="task-card-header">
          <h3 className="task-card-title">Delete Task?</h3>
        </div>
        <div className="task-card-body">
          <p className="task-card-description">Are you sure you want to delete "{task.title}"?</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingTaskId(null)} onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleDelete} onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>Delete</button>
        </div>
      </div>
    );
  }

  // Default view
  return (
    <div
      ref={setNodeRef}
      className="task-card"
      style={style}
      {...attributes}
      {...listeners}
      role="listitem"
      tabIndex={0}
      aria-grabbed={isDragging}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
      </div>
      <div className="task-card-body">
        <p className="task-card-description">
          {task.description || 'No description provided'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => { setEditMode(true); setEditingTask(task); }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setDeletingTaskId(task.id)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
