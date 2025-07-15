# Kanban Task Management Application

## Project Overview
This is a full-stack Kanban task management application designed to help users organize their tasks efficiently. It features real-time updates, user authentication, task creation, editing, and drag-and-drop functionality for managing task statuses. The application aims to provide a seamless and collaborative task management experience.

## Tech Stack
### Frontend
*   **React:** A JavaScript library for building user interfaces.
*   **Zustand:** A fast and scalable bearbones state-management solution.
*   **React Router DOM:** For declarative routing in React applications.
*   **Axios:** A promise-based HTTP client for the browser and Node.js.
*   **Socket.IO Client:** For real-time, bidirectional event-based communication.
*   **@hello-pangea/dnd:** A beautiful and accessible drag and drop for lists with React.
*   **Vite:** A build tool that provides a faster and leaner development experience for modern web projects.

### Backend
*   **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine.
*   **Express.js:** A fast, unopinionated, minimalist web framework for Node.js.
*   **MongoDB (via Mongoose):** A NoSQL database and an ODM library for Node.js.
*   **Socket.IO:** For real-time, bidirectional event-based communication.
*   **bcryptjs / bcrypt:** For hashing passwords.
*   **jsonwebtoken:** For implementing JWT-based authentication.
*   **cors:** Node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
*   **dotenv:** Loads environment variables from a `.env` file.
*   **express-validator:** A set of express.js middlewares that wraps validator.js.
*   **nodemon:** A tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.

## Setup and Installation

To run this project locally, follow these steps:

### Prerequisites
*   Node.js (LTS version recommended)
*   MongoDB (Community Edition or MongoDB Atlas account)

### Backend Setup

1.  **Navigate to the Server directory:**
    ```bash
    cd Server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** in the `Server` directory with the following content (replace placeholders with your actual values):
    ```
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    PORT=5050
    ```
    *   `MONGO_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/kanban_db` or a MongoDB Atlas URI).
    *   `JWT_SECRET`: A strong, random string for JWT token encryption.
    *   `PORT`: The port your backend server will run on (e.g., `5050`).

4.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The backend server will start on `http://localhost:5050` (or the port you specified).

### Frontend Setup

1.  **Navigate to the Client directory:**
    ```bash
    cd Client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend application will typically open in your browser at `http://localhost:5173` or a similar address.

## Features and Usage Guide

### Authentication
*   **Register:** New users can create an account.
*   **Login:** Existing users can log in to access the Kanban board.

### Task Management
*   **Create Task:** Click on the "Create New Task" button to open a modal where you can enter task details (title, description, due date, priority, assigned user).
*   **Edit Task:** Click the "Edit" button on a task card to modify its details.
*   **Drag-and-Drop:** Seamlessly drag tasks between "To Do", "In Progress", and "Done" columns to update their status.
*   **Real-time Updates:** Changes made by one user are instantly reflected for all other active users.

### Activity Log
*   A real-time activity log displays actions performed on tasks (e.g., creation, status changes, edits).
*   You can toggle the visibility of the activity log panel.

## Explanations for Smart Assign and Conflict Handling Logic

### Smart Assign Logic
(This section is a placeholder. If there's specific "Smart Assign" logic implemented, please detail it here. For instance, if tasks are automatically assigned based on availability, load, or specific criteria.)
Currently, task assignment is manual. Users can assign tasks to other registered users during task creation or editing.

### Conflict Handling Logic (Optimistic Concurrency Control)
The application implements optimistic concurrency control to handle potential conflicts when multiple users try to modify the same task simultaneously. This is achieved using a versioning mechanism:
1.  Each task document in the database has a `version` field.
2.  When a user fetches a task, they also receive its current `version`.
3.  When a user attempts to update a task (e.g., change status via drag-and-drop or edit task details), the update request includes the `version` of the task they originally fetched.
4.  The backend checks if the `version` in the request matches the current `version` in the database.
    *   If they match, the update is processed, and the `version` field in the database is incremented.
    *   If they do not match (meaning another user has modified the task in the interim), the update is rejected, and the client receives a 409 Conflict error. The user is then prompted with a message "Version conflict and the task has been modified by another user. Please refresh to edit or update the task." to indicate that the task has been updated by someone else and they need to refresh their view to get the latest version.

This approach prevents lost updates by ensuring that modifications are only applied to the most recent version of a task.

## Link to Deployed Live App and Demo Video
*   **Live App:** [https://webalar-assignment-hr2u.vercel.app](https://webalar-assignment-hr2u.vercel.app)
*   **Demo Video:** https://drive.google.com/file/d/1ghL4QyCIXIuoAzsnOL0CZTeDvjuP30w9/view?usp=sharing
