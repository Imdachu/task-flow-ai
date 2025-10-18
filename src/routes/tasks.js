const express = require('express');
const router = express.Router();
const { createTask, updateTask, deleteTask, moveTask } = require('../controllers/tasks.controller');
const {
  validate,
  validateObjectId,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
} = require('../middlewares/validate');

router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validateObjectId('id'), validate(updateTaskSchema), updateTask);
router.delete('/:id', validateObjectId('id'), deleteTask);
router.patch('/:id/move', validateObjectId('id'), validate(moveTaskSchema), moveTask);

module.exports = router;