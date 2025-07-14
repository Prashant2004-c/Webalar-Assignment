import React, { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { taskService } from '../../api/taskService';
import './CreateTaskModal.css'; // Import the dedicated CSS

function CreateTaskModal({ onClose }) {
  const { users } = useTaskStore();
  const [newTaskFormData, setNewTaskFormData] = useState({
    title: '',
    description: '',
    status: 'todo', // Add status field with default 'todo'
    priority: 'Medium',
    assignedTo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTaskFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    console.log("CreateTaskModal: handleCreateTaskSubmit called.");
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...newTaskFormData,
        assignedTo: newTaskFormData.assignedTo || null, // Ensure null if unassigned
      };

      console.log("CreateTaskModal: Payload to be sent:", payload);
      const response = await taskService.createTask(payload);
      console.log("CreateTaskModal: API response received:", response);

      if (response.success) {
        setNewTaskFormData({
          title: '',
          description: '',
          status: 'todo', // Reset status to default
          priority: 'Medium',
          assignedTo: '',
        });
        onClose(); // Close modal on success
        console.log("CreateTaskModal: Task created successfully and modal closed.");
      } else {
        setError(response.message || 'Failed to create task.');
        console.log("CreateTaskModal: API call failed with message:", response.message);
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'An unexpected error occurred.');
      console.log("CreateTaskModal: Catch block hit with error:", err);
    } finally {
      setLoading(false);
      console.log("CreateTaskModal: Loading set to false.");
    }
  };

  return (
    <div className="create-task-modal-overlay">
      <div className="create-task-modal">
        <h2>Create New Task</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleCreateTaskSubmit}>
          <div className="form-group">
            <label htmlFor="new-task-title">Title</label>
            <input
              type="text"
              id="new-task-title"
              name="title"
              value={newTaskFormData.title}
              onChange={handleCreateTaskChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-task-description">Description</label>
            <textarea
              id="new-task-description"
              name="description"
              value={newTaskFormData.description}
              onChange={handleCreateTaskChange}
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="new-task-status">Status</label>
            <select
              id="new-task-status"
              name="status"
              value={newTaskFormData.status}
              onChange={handleCreateTaskChange}
            >
              <option value="todo">To Do</option>
              <option value="in progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="new-task-priority">Priority</label>
            <select
              id="new-task-priority"
              name="priority"
              value={newTaskFormData.priority}
              onChange={handleCreateTaskChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="new-task-assignedTo">Assigned To</label>
            <select
              id="new-task-assignedTo"
              name="assignedTo"
              value={newTaskFormData.assignedTo}
              onChange={handleCreateTaskChange}
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTaskModal; 