const ActionLog = require('../models/ActionLog');


async function logAction(action, taskId, userId, details = {}) {
  try {
    const actionLog = await ActionLog.create({
      action,
      taskId,
      userId,
      details,
      timestamp: Date.now()
    });
    return actionLog;
  } catch (error) {
    console.error(`Error logging action: ${error.message}`);
    // don't fail the main operation if logging fails
    return null;
  }
}

async function getRecentActions(limit = 20) {
  try {
    const actions = await ActionLog.find()
      .sort({timestamp: -1})
      .limit(limit)
      .populate('userId', 'username') 
      .populate('taskId', 'title');
    
    return actions;
  } catch (error) {
    console.error(`Error getting recent actions: ${error.message}`);
    throw error;
  }
}

module.exports = {
  logAction,
  getRecentActions
}