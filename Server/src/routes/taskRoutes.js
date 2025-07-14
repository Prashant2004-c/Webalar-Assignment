const express = require("express");
const { check } = require("express-validator");
const {
  createTask,
  getTask,
  getTasks,
  updateTask,
  deleteTask,
  smartAssign,
} = require("../controllers/taskController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.get("/", getTasks);
router.post(
  "/",
  [
    check("title", "Title is required").not().isEmpty(),
    check("title", "Title cannot exceed 100 characters").isLength({ max: 100 }),
  ],
  createTask
);

router.get("/:id", getTask);
router.put(
  "/:id",
  [
    check("title", "Title cannot exceed 100 characters")
      .optional()
      .isLength({ max: 100 }),
    check("description", "Description cannot exceed 500 characters")
      .optional()
      .isLength({ max: 500 }),
    check("priority", "Priority must be Low, Medium, or High")
      .optional()
      .isIn(["Low", "Medium", "High"]),
  ],
  updateTask
);
router.delete('/:id', deleteTask);

router.put('/:id/smart-assign', smartAssign);

module.exports = router;
