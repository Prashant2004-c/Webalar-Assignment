import React, { useEffect, useState } from 'react';
import { taskService } from '../../api/taskService';
import { useSocket } from '../../hooks/useSocket';
import { useTaskStore } from '../../store/taskStore'; // Import useTaskStore
import './ActivityLogPanel.css';

function ActivityLogPanel() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();
  // const { users, tasks } = useTaskStore(); // Remove direct destructuring here

  // Helper to get username from ID
  const getUsernameById = (userId) => {
    const { users } = useTaskStore.getState(); // Get latest users
    const user = users.find(u => u._id === userId);
    return user ? user.username : 'Unknown User';
  };

  // Helper to get task title from ID
  const getTaskTitleById = (taskId) => {
    const { tasks } = useTaskStore.getState(); // Get latest tasks
    // Flatten tasks from all columns into a single array for easier lookup
    const allTasks = Object.values(tasks).flat();
    const task = allTasks.find(t => t._id === taskId);
    return task ? task.title : 'Unknown Task';
  };

  // Function to fetch recent actions
  const fetchRecentActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedActions = await taskService.getRecentActions();
      setActions(fetchedActions);
    } catch (err) {
      console.error('Failed to fetch recent actions:', err);
      setError('Failed to load activity log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActions();
  }, []); // Fetch on component mount

  // Listen for socket events to update log in real-time
  useEffect(() => {
    if (!socket) return;

    const handleActionLogged = (data) => {
      console.log('Socket: action_logged raw data', data);
      // console.log('Current users in store:', users); // Remove or comment out this log
      // console.log('Current tasks in store:', tasks); // Remove or comment out this log
      // Normalize the action object received from socket
      const normalizedAction = {
        ...data.action,
        userId: data.action.userId || data.action.details.userId, // Ensure userId is present if only in details
        taskId: data.action.taskId || data.action.details.taskId, // Ensure taskId is present if only in details
      };

      setActions(prevActions => [normalizedAction, ...prevActions].slice(0, 20)); // Keep only recent 20
    };

    socket.on('task_created', handleActionLogged);
    socket.on('task_updated', handleActionLogged);
    socket.on('task_deleted', handleActionLogged);
    socket.on('task_assigned', handleActionLogged);

    return () => {
      socket.off('task_created', handleActionLogged);
      socket.off('task_updated', handleActionLogged);
      socket.off('task_deleted', handleActionLogged);
      socket.off('task_assigned', handleActionLogged);
    };
  }, [socket]);

  const formatAction = (action) => {
    const timestamp = new Date(action.timestamp).toLocaleString();
    // Resolve username and task title using helper functions and local store
    const username = getUsernameById(action.userId);
    const taskTitle = getTaskTitleById(action.taskId);

    return (
      <li key={action._id || action.timestamp} className="activity-item">
        <span className="timestamp">{timestamp}: </span>
        <span className="details">
          {(() => {
            switch (action.action) {
              case 'create':
                return <>{username} created task "<span class="highlight">{taskTitle}</span>" with status "<span class="highlight">{action.details.status}</span>".</>;
              case 'update':
                let updateDetails = [];
                if (action.details.before?.title !== action.details.after?.title) {
                  updateDetails.push(<>title from "<span class="old-value">{action.details.before?.title || ''}</span>" to "<span class="new-value">{action.details.after?.title || ''}</span>"</>);
                }
                if (action.details.before?.status !== action.details.after?.status) {
                  updateDetails.push(<>status from "<span class="old-value">{action.details.before?.status || ''}</span>" to "<span class="new-value">{action.details.after?.status || ''}</span>"</>);
                }
                if (action.details.before?.assignedTo !== action.details.after?.assignedTo) {
                  const oldAssigneeId = typeof action.details.before?.assignedTo === 'object' ? action.details.before.assignedTo._id : action.details.before?.assignedTo;
                  const newAssigneeId = typeof action.details.after?.assignedTo === 'object' ? action.details.after.assignedTo._id : action.details.after?.assignedTo;
                  const oldAssignee = getUsernameById(oldAssigneeId) || 'Unassigned';
                  const newAssignee = getUsernameById(newAssigneeId) || 'Unassigned';
                  updateDetails.push(<>assigned from "<span class="old-value">{oldAssignee}</span>" to "<span class="new-value">{newAssignee}</span>"</>);
                }
                return <>{username} updated task "<span class="highlight">{taskTitle}</span>" ({updateDetails.map((detail, i) => <React.Fragment key={i}>{detail}{i < updateDetails.length - 1 ? ', ' : ''}</React.Fragment>)}).</>;
              case 'delete':
                const deletedTaskTitle = action.details?.taskInfo?.title || getTaskTitleById(action.taskId);
                return <>{username} deleted task "<span class="highlight">{deletedTaskTitle}</span>".</>;
              case 'assign':
                const assignedToUserId = typeof action.details.to === 'object' ? action.details.to._id : action.details.to;
                const assignedToUser = getUsernameById(assignedToUserId);
                return <>{username} assigned task "<span class="highlight">{taskTitle}</span>" to <span class="highlight">{assignedToUser}</span>{action.details.smart ? ' (smart assigned)' : ''}.</>;
              default:
                return <>{username} performed a "<span class="highlight">{action.action}</span>" action on task "<span class="highlight">{taskTitle}</span>".</>;
            }
          })()}
        </span>
      </li>
    );
  };

  if (loading) {
    return <div className="activity-log-panel"><p>Loading activity log...</p></div>;
  }

  if (error) {
    return <div className="activity-log-panel error"><p>{error}</p></div>;
  }

  return (
    <div className="activity-log-panel">
      <h3>Recent Activity</h3>
      {actions.length === 0 ? (
        <p>No recent activity.</p>
      ) : (
        <ul className="activity-list">
          {actions.map((action, index) => formatAction(action))}
        </ul>
      )}
    </div>
  );
}

export default ActivityLogPanel; 