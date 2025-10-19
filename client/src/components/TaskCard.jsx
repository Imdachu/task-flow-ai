import './TaskCard.css';

function TaskCard({ task }) {
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
    </div>
  );
}

export default TaskCard;
