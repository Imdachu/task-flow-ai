import TaskCard from './TaskCard';
import './Column.css';
import { useDroppable } from '@dnd-kit/core';

function Column({ column, onAddTask, onEditTask, onDeleteTask, onAskAI, editingTask, setEditingTask, deletingTaskId, setDeletingTaskId }) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="board-column" role="region" aria-labelledby={`column-${column.id}`}>
      <div className="column-header">
        <h2 id={`column-${column.id}`}>{column.title}</h2>
        <button className="btn btn-primary btn-add-task" onClick={onAddTask} aria-label="Add Task">
          + Add Task
        </button>
      </div>
      <div className="column-tasks" ref={setNodeRef} role="list" aria-label={`${column.title} tasks`}>
        {column.tasks.length === 0 ? (
          <div className="empty-tasks" role="listitem">No tasks</div>
        ) : (
          column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onAskAI={() => onAskAI(task)} // Pass onAskAI to TaskCard
              onEdit={() => setEditingTask(task)}
              onDelete={() => setDeletingTaskId(task.id)}
              isEditing={editingTask && editingTask.id === task.id}
              isDeleting={deletingTaskId === task.id}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              setEditingTask={setEditingTask}
              setDeletingTaskId={setDeletingTaskId}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Column;
