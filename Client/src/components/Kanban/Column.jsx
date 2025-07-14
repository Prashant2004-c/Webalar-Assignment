import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import './Kanban.css';

function Column({ columnId, title, tasks, onEditClick, onDeleteClick, onSmartAssignClick }) {
  return (
    <div className="kanban-column card">
      <h2 className="kanban-column-title">{title}</h2>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`task-list ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
                onSmartAssignClick={onSmartAssignClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default Column; 