import TaskCard from './TaskCard';
import './Column.css';

function Column({ column, onAddTask }) {
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
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}

export default Column;
