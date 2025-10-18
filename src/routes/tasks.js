const express = require('express');
const router = express.Router();
const { createTask, updateTask, deleteTask } = require('../controllers/tasks.controller');

router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;