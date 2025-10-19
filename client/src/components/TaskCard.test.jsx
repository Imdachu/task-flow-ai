import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from './TaskCard';

describe('TaskCard', () => {
  const mockTask = { id: 't1', title: 'Sample', description: 'Desc' };

  it('renders title and description and shows drag handle and buttons', () => {
    const mockEdit = jest.fn();
    const mockDelete = jest.fn();
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockEdit}
        onDelete={mockDelete}
        isEditing={false}
        isDeleting={false}
        onEditTask={() => {}}
        onDeleteTask={() => {}}
        setEditingTask={() => {}}
        setDeletingTaskId={() => {}}
      />
    );

    expect(screen.getByText('Sample')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    // Drag handle should be present (contains the vertical dots char)
    expect(screen.getByTitle('Drag to move')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls handlers on edit/delete clicks', () => {
    const setEditingTask = jest.fn();
    const setDeletingTaskId = jest.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={() => {}}
        onDelete={() => {}}
        isEditing={false}
        isDeleting={false}
        onEditTask={() => {}}
        onDeleteTask={() => {}}
        setEditingTask={setEditingTask}
        setDeletingTaskId={setDeletingTaskId}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(setEditingTask).toHaveBeenCalledWith(mockTask);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(setDeletingTaskId).toHaveBeenCalledWith(mockTask.id);
  });
});
