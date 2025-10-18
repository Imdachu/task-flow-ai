const express = require('express');
const router = express.Router();
const {
  createProject,
  listProjects,
  getProjectBoard,
} = require('../controllers/projects.controller');
const { validate, validateObjectId, createProjectSchema } = require('../middlewares/validate');

router.post('/', validate(createProjectSchema), createProject);
router.get('/', listProjects);
router.get('/:id', validateObjectId('id'), getProjectBoard);

module.exports = router;