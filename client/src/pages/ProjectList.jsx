import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import './ProjectList.css';

function ProjectList() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for static UI (will be replaced with real API data in next step)
  const mockProjects = [
    {
      _id: '1',
      name: 'Website Redesign',
      description: 'Complete redesign of company website with modern UI/UX',
      createdAt: '2025-10-15T10:30:00Z',
    },
    {
      _id: '2',
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android',
      createdAt: '2025-10-16T14:20:00Z',
    },
    {
      _id: '3',
      name: 'API Integration',
      description: 'Integrate third-party payment and analytics APIs',
      createdAt: '2025-10-17T09:15:00Z',
    },
  ];

  const handleCreateProject = (formData) => {
    console.log('Create project:', formData);
    // Will implement API call in next step
    setIsModalOpen(false);
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
        >
          + New Project
        </button>
      </div>

      {mockProjects.length === 0 ? (
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
          {mockProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onClick={() => handleProjectClick(project._id)}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

export default ProjectList;
