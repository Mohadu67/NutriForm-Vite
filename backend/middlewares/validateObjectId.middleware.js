const mongoose = require('mongoose');

/**
 * Middleware pour valider les ObjectId MongoDB dans les parametres de route
 * @param {string} paramName - Nom du parametre a valider (default: 'id')
 * @returns {Function} Middleware Express
 *
 * @example
 * // Valider req.params.id
 * router.get('/:id', validateObjectId(), getById);
 *
 * // Valider req.params.programId
 * router.get('/program/:programId', validateObjectId('programId'), getProgram);
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        error: `missing_${paramName}`,
        message: `Le parametre ${paramName} est requis`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: `invalid_${paramName}`,
        message: `Le parametre ${paramName} n'est pas un ID valide`
      });
    }

    next();
  };
}

/**
 * Valide plusieurs ObjectId en une seule fois
 * @param {string[]} paramNames - Liste des noms de parametres a valider
 * @returns {Function} Middleware Express
 *
 * @example
 * router.get('/:userId/program/:programId', validateObjectIds(['userId', 'programId']), handler);
 */
function validateObjectIds(paramNames) {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];

      if (!id) {
        return res.status(400).json({
          error: `missing_${paramName}`,
          message: `Le parametre ${paramName} est requis`
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: `invalid_${paramName}`,
          message: `Le parametre ${paramName} n'est pas un ID valide`
        });
      }
    }

    next();
  };
}

module.exports = { validateObjectId, validateObjectIds };
