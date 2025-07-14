const { validationResult } = require("express-validator");
const Task = require("../models/Task");
const User = require("../models/User");
const { logAction } = require("../services/actionLogService");

const columnNames = ["todo", "in progress", "done"];

async function createTask(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { title, description, status, priority, assignedTo } = req.body;
    

    const columnNames = ["todo", "in progress", "done"];
    if (columnNames.includes(title)) {
      return res.status(400).json({
        success: false,
        message:
          "Task title cannot match column names (todo, in progress, done)",
      });
    }

    const existingTask = await Task.findOne({
      title,
      createdBy: req.user.id,
    });
    if (existingTask) {
      return res.status(400).json({
        success: false,
        message: "You already have a task with this title",
      });
    }

    const task = await Task.create({
      title,
      description,
      status: status || "todo",
      priority: priority || "Medium",
      assignedTo: assignedTo || null,
      createdBy: req.user.id,
      lastEditedBy: req.user.id,
      lastEditedAt: Date.now(),
    });

    // action log
    const actionLog = await logAction("create", task._id, req.user.id, {
      title: task.title,
      status: task.status,
    });

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      console.log('Server: Emitting task_created event for task:', task.title);
      io.emit("task_created", { task, action: actionLog });
    }

    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(`Error in createTask: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function getTasks(req, res) {
  try {
    // get query parameters
    const { status, assignedTo } = req.query;
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by assignedTo if provided
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    console.log(query);
    

    // get tasks
    const tasks = await Task.find(query)
      .populate("assignedTo", "username")
      .populate("createdBy", "username")
      .populate("lastEditedBy", "username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(`Error in getTasks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function getTask(req, res) {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "username")
      .populate("createdBy", "username")
      .populate("lastEditedBy", "username");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(`Error in getTask: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function updateTask(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  try {
    const { title, description, status, priority, assignedTo, version } =
      req.body;
    console.log('UPDATE TASK: Request Body:', req.body); // Log incoming body
    console.log('UPDATE TASK: Task ID:', req.params.id); // Log task ID

    let task = await Task.findById(req.params.id);

    if (!task) {
      console.log('UPDATE TASK: Task not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }
    console.log('UPDATE TASK: Current Task in DB:', task.toObject()); // Log current DB task

    if (version && task.version !== parseInt(version)) {
      console.log(`UPDATE TASK: Conflict detected! Client version: ${version}, DB version: ${task.version}`);
      return res.status(409).json({
        success: false,
        message: "Task has been modified by another user",
        currentVersion: task,
        yourVersion: req.body,
      });
    }
    
    const old = {
      title: task.title,
      status: task.status,
      assignedTo: task.assignedTo,
    };
    

    if (title) {
      if (columnNames.includes(title.trim().toLowerCase()))
        return res
          .status(400)
          .json({ success: false, message: "Title cannot match column names" });
      const dup = await Task.findOne({
        title,
        createdBy: task.createdBy,
        _id: { $ne: task._id },
      });
      if (dup)
        return res
          .status(400)
          .json({ success: false, message: "Duplicate title" });
      task.title = title;
    }

    task.description =
      description !== undefined ? description : task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;
    task.lastEditedBy = req.user.id;
    task.lastEditedAt = Date.now();
    task.version += 1;

    await task.save();
    console.log('UPDATE TASK: Task saved successfully. New version:', task.version);

    const action = await logAction("update", task._id, req.user.id, {
      before: old,
      after: {
        title: task.title,
        status: task.status,
        assignedTo: task.assignedTo,
      },
    });

    req.app.get("io")?.emit("task_updated", { task, action });
    console.log('UPDATE TASK: Emitted task_updated socket event.');
    res.json({ success: true, task });
  } catch (error) {
    console.error(`Error in updateTask: ${error.message}`);
    console.log('UPDATE TASK: Full error object:', error); // Log full error object
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Store task info for action log
    const taskInfo = {
      title: task.title,
      status: task.status,
      assignedTo: task.assignedTo,
    };

    await task.deleteOne();

    // Log delete action
    const actionLog = await logAction(
      "delete",
      req.params.id,
      req.user.id,
      taskInfo
    );

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.emit("task_deleted", {
        taskId: req.params.id,
        action: actionLog,
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    console.error(`Error in deleteTask: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function smartAssign(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    const counts = await Task.aggregate([
      { $match: { status: { $ne: "done" }, assignedTo: { $ne: null } } },
      { $group: { _id: "$assignedTo", c: { $sum: 1 } } },
    ]);

    const userCounts = {};
    counts.forEach((u) => (userCounts[u._id] = u.c));
    const users = await User.find();
    const chosen = users.reduce((best, u) => {
      const cur = userCounts[u._id] || 0;
      return cur < (best.count ?? Infinity)
        ? { id: u._id, username: u.username, count: cur }
        : best;
    }, {});

    const old = task.assignedTo;
    task.assignedTo = chosen.id;
    task.lastEditedBy = req.user.id;
    task.lastEditedAt = Date.now();
    task.version += 1;
    await task.save();

    const action = await logAction("assign", task._id, req.user.id, {
      from: old,
      to: chosen.id,
      smart: true,
    });

    const io = req.app.get("io");
    io?.emit("task_assigned", { task, action, smart: true });
    io?.to(`user:${chosen.id}`).emit("task_assigned_to_you", {
      task,
      action,
      smart: true,
    });

    res.json({
      success: true,
      task,
      message: `Assigned to ${chosen.username}`,
    });
  } catch (error) {
    console.error(`Error in smart assigning a task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

module.exports = {
  createTask,
  getTasks,
  getTask,
  deleteTask,
  updateTask,
  smartAssign
}
