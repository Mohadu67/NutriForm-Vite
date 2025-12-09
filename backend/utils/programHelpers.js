const mongoose = require('mongoose');
const logger = require('../config/logger');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

/**
 * Valide et convertit un ID en ObjectId MongoDB
 */
const validateProgramId = (id) => {
  if (!id) {
    throw new ValidationError("program_id_missing");
  }

  if (typeof id !== 'string' || id.length !== 24) {
    throw new ValidationError("invalid_program_id_format");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("invalid_program_id");
  }

  return new mongoose.Types.ObjectId(id);
};

/**
 * Récupère un programme et vérifie l'accès
 */
const getProgramWithAccess = async (WorkoutProgram, id, options = {}) => {
  const { userId, isAdmin, requireActive = true } = options;

  const program = await WorkoutProgram.findById(id);

  if (!program) {
    throw new NotFoundError("program_not_found");
  }

  // Vérifier accès
  const isAccessible = program.isPublic || program.status === 'public';
  if (!isAccessible || (requireActive && !program.isActive)) {
    if (!userId || (program.userId?.toString() !== userId && !isAdmin)) {
      throw new ForbiddenError("access_denied");
    }
  }

  return program;
};

/**
 * Vérifie que l'utilisateur est propriétaire ou admin
 */
const checkOwnership = (program, userId, isAdmin) => {
  if (!isAdmin && (!program.userId || program.userId.toString() !== userId)) {
    throw new ForbiddenError("not_program_owner");
  }
};

module.exports = {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  validateProgramId,
  getProgramWithAccess,
  checkOwnership
};
