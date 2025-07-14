import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import './Kanban.css'; // We will create this CSS file
import { useTaskStore } from '../../store/taskStore';

function TaskCard({ task, index, onEditClick, onDeleteClick, onSmartAssignClick }) {
  const users = useTaskStore(state => state.users);

  // Determine the assigned username based on whether task.assignedTo is an object or a string ID
  let assignedUsername = 'Unassigned';
  if (task.assignedTo) {
    if (typeof task.assignedTo === 'object' && task.assignedTo.username) {
      // Case 1: task.assignedTo is already a populated user object
      assignedUsername = task.assignedTo.username;
    } else if (typeof task.assignedTo === 'string') {
      // Case 2: task.assignedTo is a user ID string (e.g., for newly created/assigned tasks)
      const userFound = users.find(u => u._id === task.assignedTo);
      if (userFound) {
        assignedUsername = userFound.username;
      }
    }
  }

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
        >
          <h3 className="task-card-title">{task.title}</h3>
          <p className="task-card-description">{task.description}</p>
          <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
          <div className="task-assigned-to">
            Assigned to: {assignedUsername}
          </div>
          <div className="task-card-actions">
            <button onClick={() => onEditClick(task)} className="btn btn-sm btn-outline">Edit</button>
            <button onClick={() => onDeleteClick(task._id)} className="btn btn-sm btn-danger">Delete</button>
            <button onClick={() => onSmartAssignClick(task._id)} className="btn btn-sm btn-secondary">Smart Assign</button>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard; 