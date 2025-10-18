const Joi = require('joi');

// Validation middleware factory
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }
    next();
  };
}

// Project validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(200).messages({
    'string.empty': 'Project name is required',
    'string.min': 'Project name must be at least 1 character',
    'string.max': 'Project name must not exceed 200 characters',
  }),
  description: Joi.string().allow('').max(1000).messages({
    'string.max': 'Description must not exceed 1000 characters',
  }),
});

// Task validation schemas
const createTaskSchema = Joi.object({
  columnId: Joi.string().required().messages({
    'string.empty': 'columnId is required',
  }),
  title: Joi.string().required().trim().min(1).max(200).messages({
    'string.empty': 'Task title is required',
    'string.min': 'Task title must be at least 1 character',
    'string.max': 'Task title must not exceed 200 characters',
  }),
  description: Joi.string().allow('').max(2000).messages({
    'string.max': 'Description must not exceed 2000 characters',
  }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).messages({
    'string.min': 'Task title must be at least 1 character',
    'string.max': 'Task title must not exceed 200 characters',
  }),
  description: Joi.string().allow('').max(2000).messages({
    'string.max': 'Description must not exceed 2000 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one field (title or description) is required',
});

const moveTaskSchema = Joi.object({
  destColumnId: Joi.string().required().messages({
    'string.empty': 'destColumnId is required',
  }),
  beforeTaskId: Joi.string().allow(null, '').optional(),
  afterTaskId: Joi.string().allow(null, '').optional(),
});

// ObjectId validation middleware
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        error: `Invalid ${paramName} format`,
      });
    }
    next();
  };
}

module.exports = {
  validate,
  validateObjectId,
  createProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
};
