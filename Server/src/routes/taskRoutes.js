const express = require("express");
const { check, body } = require("express-validator"); // Import body
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
    body("title", "Title is required").not().isEmpty(), // Use body()
    body("title", "Title cannot exceed 100 characters").isLength({ max: 100 }), // Use body()
  ],
  createTask
);

router.get("/:id", getTask);
router.put(
  "/:id",
  [
    body("title", "Title cannot exceed 100 characters") // Use body()
      .optional()
      .isLength({ max: 100 }),
    body("description", "Description cannot exceed 500 characters") // Use body()
      .optional()
      .isLength({ max: 500 }),
    body("priority", "Priority must be Low, Medium, or High") // Use body()
      .optional()
      .isIn(["Low", "Medium", "High"]),
  ],
  updateTask
);
router.delete('/:id', deleteTask);

router.put('/:id/smart-assign', smartAssign);

module.exports = router;
