const { getRecentActions } = require('../services/actionLogService');


async function getRecentActionss(req, res) {
  try {
    
    const limit = parseInt(req.query.limit) || 20;
    
    
    const actions = await getRecentActions(limit);
    
    if (actions.length > 0 && req.app.get('io')) {
      const io = req.app.get('io');
      io.emit('action_logged', actions[0]);
    }
    
    res.status(200).json({
      success: true,
      count: actions.length,
      actions
    });
  } catch (error) {
    console.error(`Error in getRecentActions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

module.exports = {
  getRecentActionss
}