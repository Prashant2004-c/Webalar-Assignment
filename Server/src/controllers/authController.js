const User = require('../models/User');
const { validationResult } = require('express-validator');

const { generateToken } = require('../middlewares/auth')

async function register(req,res) {
  
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if(user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with that email or username'
      });
    }

    user = await User.create({
      username,
      email,
      password
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(`Error in register: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}


async function login(req,res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({email}).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if(!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error(`Error in login: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

async function getMe(req,res) {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(`Error in getMe: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(`Error in getAllUsers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  getAllUsers
};