import React, { useCallback, useEffect, useState } from 'react'; // Import useState
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import { useTaskStore } from '../../store/taskStore';
import { taskService } from '../../api/taskService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import EditTaskModal from '../Task/EditTaskModal'; // Import the new modal component

const COLUMNS_ORDER = ['todo', 'in progress', 'done'];

function KanbanBoard({ onEditClick, onDeleteClick, onSmartAssignClick }) {
  const { moveTaskLocally, updateTask, addTask, removeTask } = useTaskStore();
  const { logout } = useAuth();
  const socket = useSocket();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const handleEditClick = useCallback((task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  }, []);

  // Handle real-time updates from the backend via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.on('task_created', (data) => {
      console.log('Socket: task_created', data);
      // Removed the if condition to ensure task is always added on creation event
      addTask(data.task);
    });

    socket.on('task_updated', (data) => {
      console.log('Socket: task_updated', data);
      updateTask(data.task);
    });

    socket.on('task_deleted', (data) => {
      console.log('Socket: task_deleted', data);
      removeTask(data.taskId);
    });

    socket.on('task_assigned', (data) => {
      console.log('Socket: task_assigned', data);
      updateTask(data.task);
    });

    // TODO: Implement other socket event handlers (e.g., editing_task, action_logged)

    return () => {
      // Clean up socket listeners on unmount
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
      socket.off('task_assigned');
    };
  }, [socket, addTask, updateTask, removeTask]);

  // Wrap onDragEnd in useCallback to ensure it has the latest `tasks` in its closure
  const onDragEnd = useCallback(async (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside the list or in the same place, do nothing
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;

    // IMPORTANT CHANGE: Get the absolutely latest task from the store here
    // Iterate through all columns to find the task by its ID, ensuring we get the latest version
    let draggedTask = null;
    const currentTasksState = useTaskStore.getState().tasks;
    for (const columnId in currentTasksState) {
      const found = currentTasksState[columnId].find(task => task._id === draggableId);
      if (found) {
        draggedTask = found;
        break;
      }
    }

    if (!draggedTask) {
      console.error("Dragged task not found in current store state:", draggableId);
      return; // Should ideally not happen if data is consistent
    }

    console.log("KanbanBoard: Dragged task before optimistic update:", draggedTask);

    // 1. Optimistic UI Update: Move the task in the frontend immediately
    moveTaskLocally(
      draggableId,
      sourceColumnId,
      destinationColumnId,
      source.index,
      destination.index
    );

    // After optimistic update, re-fetch the task from the store to ensure we have the latest version
    // This is crucial for subsequent API calls for the same task without refresh
    const latestTaskState = useTaskStore.getState().tasks;
    let taskForBackend = null;
    for (const columnId in latestTaskState) {
      const found = latestTaskState[columnId].find(task => task._id === draggableId);
      if (found) {
        taskForBackend = found;
        break;
      }
    }

    if (!taskForBackend) {
      console.error("Task not found in store after optimistic move, cannot update backend:", draggableId);
      // Revert local state or force refresh if task somehow disappeared from store
      window.location.reload(); // Simple revert for now
      return;
    }

    // Prepare update data for backend
    const updatedTaskData = {
      status: destinationColumnId,
      version: taskForBackend.version, // Use the version from the re-fetched task
    };

    console.log("KanbanBoard: Sending updated task data to backend:", updatedTaskData);

    try {
      // 2. API Call to Backend
      const response = await taskService.updateTask(draggableId, updatedTaskData);

      // IMPORTANT: Update the store with the task from the backend response.
      // This ensures the originating client's local task object has the latest version
      // for any subsequent actions by this user. The socket event will confirm/redundantly update.
      updateTask(response.task);

    } catch (err) {
      console.error('Error updating task status on backend:', err);
      console.log('Error object details:', JSON.stringify(err, null, 2));
      console.log('Error status:', err.status);
      console.log('Error response status:', err.response?.status);

      // Revert local state if backend update fails


      if (err.status === 409 || (err.response && err.response.status === 409)) {
        alert("Version conflict: The task has been modified by another user. Please refresh to edit or update the task.");
      } else if (err.status === 401 || (err.response && err.response.status === 401) || err.message?.includes('authorized')) {
        logout();
      } else {
        alert("Failed to update task. Please try again.");
      }
      // Force a full re-fetch to synchronize state with backend on error
      // In a more advanced setup, you'd revert the specific optimistic change
      window.location.reload();
    }
  }, [moveTaskLocally, updateTask, logout]); // Dependencies for useCallback. `tasks` is no longer directly accessed here.

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board grid">
        {COLUMNS_ORDER.map((columnId) => (
          <Column
            key={columnId}
            columnId={columnId}
            title={columnId.charAt(0).toUpperCase() + columnId.slice(1)}
            tasks={useTaskStore.getState().tasks[columnId] || []} // Access latest tasks for rendering
            onEditClick={handleEditClick} // Pass the new handler
            onDeleteClick={onDeleteClick}
            onSmartAssignClick={onSmartAssignClick}
          />
        ))}
      </div>
      {isEditModalOpen && taskToEdit && (
        <EditTaskModal
          task={taskToEdit}
          onClose={handleCloseEditModal}
        />
      )}
    </DragDropContext>
  );
}

export default KanbanBoard; 