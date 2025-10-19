import TaskCard from './TaskCard';
import './Column.css';

function Column({ column, onAddTask, onEditTask, onDeleteTask, editingTask, setEditingTask, deletingTaskId, setDeletingTaskId }) {
  return (
    <div className="board-column">
      <div className="column-header">
        <h2>{column.title}</h2>
        <button className="btn btn-primary btn-add-task" onClick={onAddTask}>
          + Add Task
        </button>
      </div>
      <div className="column-tasks">
        {column.tasks.length === 0 ? (
          <div className="empty-tasks">No tasks</div>
        ) : (
          column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
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
