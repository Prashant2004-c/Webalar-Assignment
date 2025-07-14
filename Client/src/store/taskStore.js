import { create } from 'zustand';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  activeEditors: {},
  users: [], 

  setTasks: (tasks) => {
    const organized = tasks.reduce((acc, task) => {
      const status = task.status || 'todo';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
      }, { todo: [], 'in progress': [], done: [] }); 

    set({ tasks: organized });
  },
  
  addTask: (task) => {
    set((state) => {
      const status = task.status || 'todo';
      const currentColumnTasks = state.tasks[status] || [];
      return {
        tasks: {
          ...state.tasks,
          [status]: [...currentColumnTasks, task],
        },
      };
    });
  },

  updateTask: (updatedTask) => {
    set((state) => {
      const currentTasks = { ...state.tasks };
      let foundAndUpdated = false;

      for (const status in currentTasks) {
        const index = currentTasks[status].findIndex(t => t._id === updatedTask._id);
        if (index !== -1) {
          if (status !== updatedTask.status) {
            const newTasksInOldColumn = currentTasks[status].filter(t => t._id !== updatedTask._id);
            const newTasksInNewColumn = [...(currentTasks[updatedTask.status] || []), updatedTask];
            return {
              tasks: {
                ...currentTasks,
                [status]: newTasksInOldColumn,
                [updatedTask.status]: newTasksInNewColumn,
              },
            };
          } else {
            const updatedColumnTasks = currentTasks[status].map(t =>
                t._id === updatedTask._id ? updatedTask : t
            );
            foundAndUpdated = true;
            return {
                tasks: {
                    ...currentTasks,
                    [status]: updatedColumnTasks,
                },
            };
          }
        }
      }

      if (!foundAndUpdated) {
        const status = updatedTask.status || 'todo';
        const currentColumnTasks = state.tasks[status] || [];
        return {
          tasks: {
            ...state.tasks,
            [status]: [...currentColumnTasks, updatedTask],
          },
        };
      }

      return state; 
    });
  },

  removeTask: (taskId) => {
    set((state) => {
      const currentTasks = { ...state.tasks };
      for (const status in currentTasks) {
        currentTasks[status] = currentTasks[status].filter((task) => task._id !== taskId);
      }
      return { tasks: currentTasks };
    });
  },

  setActiveEditors: (taskId, editors) => {
    set(state => ({
      activeEditors: {
        ...state.activeEditors,
        [taskId]: editors
      }
    }));
  },

  setUsers: (users) => set({ users }),

  moveTaskLocally: (taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) => {
    set(state => {
      const newTasks = { ...state.tasks };
      const sourceColumn = [...newTasks[sourceColumnId]];
      const [movedTask] = sourceColumn.splice(sourceIndex, 1);

      if (sourceColumnId === destinationColumnId) {
        sourceColumn.splice(destinationIndex, 0, movedTask);
        newTasks[sourceColumnId] = sourceColumn;
      } else {
        const destinationColumn = [...newTasks[destinationColumnId]];
        destinationColumn.splice(destinationIndex, 0, movedTask);
        newTasks[sourceColumnId] = sourceColumn;
        newTasks[destinationColumnId] = destinationColumn;
      }

      movedTask.status = destinationColumnId;

      return { tasks: newTasks };
    });
  },

})); 