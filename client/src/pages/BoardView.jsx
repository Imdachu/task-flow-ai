import { useState } from 'react';
import Column from '../components/Column';
import CreateTaskModal from '../components/CreateTaskModal';
import './BoardView.css';

// Static mock data for columns and tasks
const mockColumns = [
  {
    id: 'col1',
    title: 'To Do',
    tasks: [
      {
        id: 'task1',
        title: 'Design homepage mockup',
        description: 'Create Figma designs for new homepage layout',
      },
      {
        id: 'task2',
        title: 'Set up React project',
        description: 'Initialize React with Vite and install dependencies',
      },
    ],
  },
  {
    id: 'col2',
    title: 'In Progress',
    tasks: [
      {
        id: 'task3',
        title: 'Implement navbar component',
        description: 'Build responsive navigation bar with mobile menu',
      },
    ],
  },
  {
    id: 'col3',
    title: 'Done',
    tasks: [
      {
        id: 'task4',
        title: 'Set up MongoDB database',
        description: 'Configure MongoDB Atlas and create initial schemas',
      },
    ],
  },
];

function BoardView() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(null);

  const handleCreateTask = (formData) => {
    // Will implement API call in next step
    setIsTaskModalOpen(false);
  };

  const handleAddTaskClick = (columnId) => {
    setSelectedColumnId(columnId);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="board-view-page">
      <div className="board-header">
        <h1>Project Board</h1>
        <p>Manage tasks across columns</p>
      </div>
      <div className="board-columns">
        {mockColumns.map((col) => (
          <Column
            key={col.id}
            column={col}
            onAddTask={() => handleAddTaskClick(col.id)}
          />
        ))}
      </div>
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        columnId={selectedColumnId}
      />
    </div>
  );
}

export default BoardView;
