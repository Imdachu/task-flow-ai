import { useState } from 'react';
import './CreateTaskModal.css';

function CreateTaskModal({ isOpen, onClose, onSubmit, columnId, loading, error }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit({ ...formData, columnId });
      setFormData({ title: '', description: '' });
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={handleClose}>
      <div style={{
        background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
        padding: '2rem', minWidth: 340, maxWidth: 400, width: '100%',
        display: 'flex', flexDirection: 'column', gap: '1.2rem',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Create New Task</h2>
          <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }} onClick={handleClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="title" style={{ fontWeight: 500 }}>Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
              autoFocus
              disabled={loading}
              style={{ fontSize: '1rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="description" style={{ fontWeight: 500 }}>Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description (optional)"
              rows={4}
              disabled={loading}
              style={{ fontSize: '1rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', minHeight: 80, resize: 'vertical', width: '100%' }}
            />
          </div>
          {error && (
            <div style={{ color: '#b91c1c', fontWeight: 500 }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading} style={{ minWidth: 80 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 80 }}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTaskModal;
