import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { taskService } from "../api/taskService";
import { useTaskStore } from "../store/taskStore";
import KanbanBoard from "../components/Kanban/KanbanBoard";
import EditTaskModal from "../components/Task/EditTaskModal";
import CreateTaskModal from "../components/Task/CreateTaskModal"; 
import ActivityLogPanel from "../components/ActivityLog/ActivityLogPanel"; 

import "./DashboardPage.css";

function DashboardPage() {
  const { user, logout } = useAuth();
  const { setTasks, users, setUsers } = useTaskStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [showActivityLog, setShowActivityLog] = useState(false); 


  const fetchTasksAndUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksData, usersData] = await Promise.all([
        taskService.getTasks(),
        taskService.getAllUsers(),
      ]);
      console.log('Fetched tasks data:', tasksData); 
      console.log('Fetched users data:', usersData); 
      setTasks(tasksData);
      setUsers(usersData); 
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load dashboard data.');
      if (err.message?.includes('authorized')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [setTasks, setUsers, logout]);

  useEffect(() => {
    fetchTasksAndUsers();
  }, [fetchTasksAndUsers]);



  const handleCloseCreateTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
  }, []);

  const handleEditClick = useCallback((task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback(async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await taskService.deleteTask(taskId);
        if (response.success) {
          
        } else {
          alert(response.message || 'Failed to delete task.');
        }
      } catch (err) {
        console.error('Error deleting task:', err);
        alert(err.message || 'An unexpected error occurred.');
      }
    }
  }, []);

  const handleSmartAssignClick = useCallback(async (taskId) => {
    if (window.confirm('Are you sure you want to smart assign this task?')) {
      try {
        const response = await taskService.smartAssign(taskId);
        if (response.success) {
          alert(response.message);
          
        } else {
          alert(response.message || 'Failed to smart assign task.');
        }
      } catch (err) {
        console.error('Error smart assigning task:', err);
        alert(err.message || 'An unexpected error occurred.');
      }
    }
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  }, []);

  const handleToggleActivityLog = useCallback(() => {
    setShowActivityLog(prev => !prev);
  }, []);

  if (loading) {
    return <div className="dashboard-page"><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="dashboard-page error"><p>{error}</p></div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Welcome, {user?.username || 'Pro'}!</h1>
        <div className="buttons">
          <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(true)}>
            + Create New Task
          </button>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
          <button className="btn btn-outline" onClick={handleToggleActivityLog}>
            {showActivityLog ? 'Hide Activity' : 'Show Activity'}
          </button>
        </div>
      </header>

      {isTaskModalOpen && (
        <CreateTaskModal onClose={handleCloseCreateTaskModal} />
      )}

      <div className="kanban-container">
        <KanbanBoard
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onSmartAssignClick={handleSmartAssignClick}
        />
      </div>

      {isEditModalOpen && taskToEdit && (
        <EditTaskModal
          task={taskToEdit}
          onClose={handleCloseEditModal}
        />
      )}

      {showActivityLog && <ActivityLogPanel />} 
    </div>
  );
}

export default DashboardPage; 