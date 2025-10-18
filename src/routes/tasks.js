const express = require('express');
const router = express.Router();
const { createTask, updateTask, deleteTask, moveTask } = require('../controllers/tasks.controller');

router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/move', moveTask);

module.exports = router;