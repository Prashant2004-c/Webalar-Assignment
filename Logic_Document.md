
# Logic Document

## Smart Assign Implementation

The "Smart Assign" feature would provide a mechanism to automatically assign a task to the user who is currently least burdened with active tasks. The implementation would follow these steps:

1.  **Identify Active Tasks:** When a user clicks the "Smart Assign" button on a task, a request would be sent to the backend. The backend would then query the database to count the number of "Todo" and "In Progress" tasks for each user.

2.  **Determine Least Busy User:** The backend logic would iterate through all users and compare their counts of active tasks. The user with the lowest count of active tasks would be identified as the ideal candidate for "Smart Assign." In case of a tie (multiple users having the same minimum number of active tasks), a simple tie-breaking rule could be applied, such as selecting the user who was registered earliest or the one with the lexicographically smallest username.

3.  **Assign Task:** Once the least busy user is determined, the backend would update the specific task's `assignedUser` field to this user's ID.

4.  **Real-Time Update:** After successfully assigning the task, the backend would emit a WebSocket event (e.g., `task_updated` or `task_assigned`) to all connected clients. The frontend would listen for this event and update the task's assignment in real-time on all users' Kanban boards.

This approach ensures that tasks are distributed efficiently among team members, promoting balanced workloads.

## Conflict Handling Implementation

Conflict handling is crucial when multiple users might attempt to modify the same task concurrently. The goal is to prevent data loss and provide a clear resolution mechanism. Our conflict handling strategy would be based on versioning and user choice:

1.  **Version Tracking:** Each task in the database would have a `version` field, which is an integer that increments every time the task is successfully updated. Alternatively, a `lastModifiedAt` timestamp could be used.

2.  **Optimistic Locking on Update:** When a user initiates an edit on a task, the frontend would fetch the task's current data, including its `version`. When the user saves their changes, the update request sent to the backend would include this `version` number.

3.  **Conflict Detection:** On the backend, before applying the update, the received `version` would be compared with the current `version` of the task in the database. If the received `version` does not match the database's current `version` (meaning another user has modified the task since the first user started editing), a conflict is detected.

4.  **Conflict Notification and Resolution:**
    *   **Backend Response:** If a conflict is detected, the backend would reject the update and send a specific error response to the client that initiated the conflicting edit. This response would include both the user's attempted changes and the current state of the task as it exists in the database.
    *   **Frontend UI:** The frontend would then present a "Conflict Resolution" modal or section to the user. This UI would display:
        *   **"Your Version":** The changes the user tried to save.
        *   **"Current Version":** The task's data as it currently exists in the database (modified by the other user).
        *   **Resolution Options:** Buttons or options allowing the user to choose between:
            *   **"Overwrite":** Apply their changes, completely replacing the other user's modifications (the backend would then re-attempt the update, incrementing the version).
            *   **"Merge" (if applicable):** For fields like description, a simple merge might be possible, or it might require manual merging by the user. If merging is not feasible for all fields, this option could be more granular or prompt manual re-editing.
            *   **"Discard":** Discard their changes and refresh the task with the current database version.

5.  **Real-Time Conflict Awareness:** While the conflict resolution is happening for one user, other users might still see the "other user's" update via real-time sync. The system could optionally emit a special WebSocket event to all relevant clients indicating that a conflict is being resolved for a particular task, perhaps temporarily locking it or showing a "currently in conflict" status.

**Example Scenario:**

1.  User A opens Task X (Version 1).
2.  User B opens Task X (Version 1).
3.  User B changes Task X's description and saves. Task X is now Version 2 in the database. All other clients are updated via real-time sync.
4.  User A, still seeing Task X as Version 1, changes its title and tries to save. User A's request includes Version 1.
5.  The backend compares User A's Version 1 with the database's current Version 2. A conflict is detected.
6.  The backend rejects User A's request and sends a conflict error with User A's changes and the database's current (Version 2) state of Task X.
7.  User A's frontend displays a conflict resolution modal: "Your Version" (title changed by A) vs. "Current Version" (description changed by B).
8.  User A can then choose to overwrite, merge, or discard their changes, resolving the conflict. If User A chooses to overwrite, their changes would be applied and the task would become Version 3.

This robust conflict handling mechanism ensures data integrity and a clear user experience, even in highly collaborative environments. 