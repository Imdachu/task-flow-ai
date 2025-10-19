
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import { getProjects, createProject } from '../services/projects';
import { useApi } from '../utils/useApi';
import useApiWithToast from '../utils/useApiWithToast';
import './ProjectList.css';
import Spinner from '../components/Spinner';

function ProjectList() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // useApi for fetching projects
  const {
    data: projects,
    loading: loadingProjects,
    error: errorProjects,
    execute: fetchProjects,
  } = useApi(getProjects);

  // useApi for creating project
  const {
    loading: creatingProject,
    error: errorCreate,
    execute: createProjectApi,
  } = useApiWithToast(createProject, { successMessage: 'Project created', errorMessage: 'Failed to create project' });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, []);

  // Handle create project
  const handleCreateProject = async (formData) => {
    try {
      await createProjectApi(formData);
      setIsModalOpen(false);
      fetchProjects(); // Refresh list
    } catch (err) {
      // Error handled by useApi
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/board/${projectId}`);
  };

  return (
    <div className="project-list-page">
      <div className="project-list-header">
        <div>
          <h1>My Projects</h1>
          <p>Manage your project boards</p>
        </div>
        <button
          className="btn btn-primary btn-create"
          onClick={() => setIsModalOpen(true)}
          disabled={creatingProject}
        >
          + New Project
        </button>
      </div>

      {/* Loading state */}
      {loadingProjects ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Spinner /></div>
          <h2>Loading projects...</h2>
        </div>
      ) : errorProjects ? (
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h2>Error loading projects</h2>
          <p>{errorProjects}</p>
          <button
            className="btn btn-primary"
            onClick={fetchProjects}
          >
            Retry
          </button>
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2>No projects yet</h2>
          <p>Create your first project to get started</p>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project._id || project.id}
              project={project}
              onClick={() => handleProjectClick(project._id || project.id)}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
      {/* Show error if create fails */}
      {errorCreate && (
        <div className="empty-state" style={{ padding: '1rem', color: '#b91c1c' }}>
          <div className="empty-state-icon">❌</div>
          <p>{errorCreate}</p>
        </div>
      )}
    </div>
  );
}

export default ProjectList;
