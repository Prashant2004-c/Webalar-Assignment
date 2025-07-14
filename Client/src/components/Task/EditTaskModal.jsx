import React, { useState, useEffect } from 'react';
import { taskService } from '../../api/taskService';
import { useAuth } from '../../context/AuthContext';
import { useTaskStore } from '../../store/taskStore';
import './EditTaskModal.css'; // We'll create this CSS file next

function EditTaskModal({ task, onClose }) {
  const { users, updateTask } = useTaskStore();
  const { user: currentUser } = useAuth(); // Logged-in user
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assignedTo: '',
    version: 0, // Current version from the task
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'Medium',
        assignedTo: task.assignedTo?._id || task.assignedTo || '', // Handle populated or unpopulated assignedTo
        version: task.version,
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`handleChange: Name: ${name}, Value: ${value}`);
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log('handleSubmit: FormData before sending:', formData);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        // Only send assignedTo if it's not empty
        assignedTo: formData.assignedTo || undefined, // Use undefined instead of null
        version: formData.version,
      };

      console.log('handleSubmit: Payload being sent:', payload);

      const response = await taskService.updateTask(task._id, payload);
      if (response.success) {
        updateTask(response.task); // Update Zustand store with the latest task from backend
        onClose(); // Close modal on success
      } else {
        setError(response.message || 'Failed to update task.');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      if (err.response && err.response.status === 409) {
        setError('Version conflict: The task has been modified by another user. Please refresh.');
      } else if (err.response && err.response.status === 401) {
        setError('Unauthorized: Please log in again.');
        // Optionally, trigger logout through AuthContext
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null; // Don't render if no task is provided

  return (
    <div className="edit-task-modal-overlay">
      <div className="edit-task-modal">
        <h2>Edit Task</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="todo">To Do</option>
              <option value="in progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="assignedTo">Assigned To</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Task'}
            </button>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTaskModal; 