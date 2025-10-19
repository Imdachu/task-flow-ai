
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import { getProjects, createProject, deleteProject } from '../services/projects';
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

  // Edit modal state
  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete project
  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(project._id || project.id);
      fetchProjects();
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  // Edit project
  const handleEditProject = (project) => {
    setEditProject(project);
    setEditForm({ name: project.name || '', description: project.description || '' });
    setEditError('');
  };

  const handleEditFormChange = (e) => {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const resp = await fetch(`/api/projects/${editProject._id || editProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!resp.ok) throw new Error('Failed to update project');
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      setEditError('Failed to update project');
    } finally {
      setEditLoading(false);
    }
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
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
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
      {/* Edit Project Modal */}
      {editProject && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
            padding: '2rem', minWidth: 340, maxWidth: 400, width: '100%',
            display: 'flex', flexDirection: 'column', gap: '1.2rem',
          }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>Edit Project</h2>
            <form onSubmit={handleEditFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="edit-name" style={{ fontWeight: 500 }}>Name</label>
                <input
                  id="edit-name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                  maxLength={200}
                  style={{ fontSize: '1rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
                  placeholder="Project name"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="edit-description" style={{ fontWeight: 500 }}>Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  maxLength={1000}
                  style={{ fontSize: '1rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', minHeight: 80, resize: 'vertical', width: '100%' }}
                  placeholder="Project description"
                />
              </div>
              {editError && <div style={{ color: '#b91c1c', fontWeight: 500 }}>{editError}</div>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="submit" disabled={editLoading} style={{ minWidth: 80 }}>Save</button>
                <button className="btn" type="button" onClick={() => setEditProject(null)} disabled={editLoading} style={{ minWidth: 80 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectList;
