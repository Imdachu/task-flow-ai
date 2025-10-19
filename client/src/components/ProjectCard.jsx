import './ProjectCard.css';

function ProjectCard({ project, onClick }) {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-header">
        <h3 className="project-card-title">{project.name}</h3>
      </div>
      <div className="project-card-body">
        <p className="project-card-description">
          {project.description || 'No description provided'}
        </p>
      </div>
      <div className="project-card-footer">
        <span className="project-card-date">
          📅 {formatDate(project.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default ProjectCard;
