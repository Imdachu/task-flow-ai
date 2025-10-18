const express = require('express');
const router = express.Router();
const {
  createProject,
  listProjects,
  getProjectBoard,
} = require('../controllers/projects.controller');

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProjectBoard);

module.exports = router;