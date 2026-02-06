const Exercise = require('../models/Exercise');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

/**
 * Helper function to enrich exercises with image URLs
 */
function enrichExerciseWithImage(exercise, req) {
  const doc = exercise.toObject ? exercise.toObject() : exercise;

  let baseUrl;
  if (req) {
    baseUrl = `${req.protocol}://${req.get('host')}`;
  } else {
    baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
  }

  // Ensure mainImage is a complete URL
  if (doc.mainImage) {
    // If it's already a full URL, keep it
    if (!doc.mainImage.startsWith('http')) {
      // If it's a relative path, make it absolute
      doc.mainImage = `${baseUrl}${doc.mainImage}`;
    }
  } else if (doc.images && doc.images.length > 0) {
    // Try images array if mainImage is not set
    const firstImage = doc.images[0];
    if (typeof firstImage === 'string') {
      doc.mainImage = firstImage.startsWith('http') ? firstImage : `${baseUrl}${firstImage}`;
    } else if (firstImage.url) {
      doc.mainImage = firstImage.url.startsWith('http') ? firstImage.url : `${baseUrl}${firstImage.url}`;
    }
  } else if (doc.slug) {
    // Fallback: construct URL from slug via filename matching
    doc.mainImage = `${baseUrl}/api/exercises/image/${doc.slug}`;
  }

  return doc;
}

/**
 * Get all exercises with optional filters
 * GET /api/exercises
 */
exports.getExercises = async (req, res) => {
  try {
    const {
      q, // search query
      category,
      muscles,
      equipment,
      difficulty,
      type,
    } = req.query;

    // Validation pagination: limit max 100, page min 1
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const filters = {
      category,
      difficulty,
      limit: parseInt(limit),
    };

    // Parse array params
    if (muscles) {
      filters.muscles = Array.isArray(muscles) ? muscles : muscles.split(',');
    }
    if (equipment) {
      filters.equipment = Array.isArray(equipment) ? equipment : equipment.split(',');
    }
    if (type) {
      filters.type = Array.isArray(type) ? type : type.split(',');
    }

    let exercises;
    let total;

    if (q) {
      // Text search
      exercises = await Exercise.search(q, filters);
      total = exercises.length;
    } else {
      // Regular query
      const query = { isActive: true };

      if (category) query.category = category;
      if (filters.muscles) query.muscles = { $in: filters.muscles };
      if (filters.equipment) query.equipment = { $in: filters.equipment };
      if (difficulty) query.difficulty = difficulty;
      if (filters.type) query.type = { $in: filters.type };

      total = await Exercise.countDocuments(query);
      exercises = await Exercise.find(query)
        .sort({ order: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-__v');
    }

    // Enrich with image URLs
    const enrichedExercises = exercises.map(ex => enrichExerciseWithImage(ex, req));

    return sendSuccess(res, enrichedExercises, 200, {
      total,
      page: parseInt(page),
      pageSize: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasMore: (parseInt(page) * parseInt(limit)) < total,
    });
  } catch (error) {
    logger.error('[EXERCISES] Get error:', error);
    return sendError(res, 'server_error', 'Erreur lors de la recuperation des exercices', 500);
  }
};

/**
 * Get exercise by ID or slug
 * GET /api/exercises/:idOrSlug
 */
exports.getExercise = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Try to find by MongoDB _id, exoId, or slug
    let exercise = await Exercise.findOne({
      $or: [
        { _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null },
        { exoId: idOrSlug },
        { slug: idOrSlug },
      ],
      isActive: true,
    }).select('-__v');

    if (!exercise) {
      return sendError(res, 'exercise_not_found', 'Exercice non trouve', 404);
    }

    // Increment usage count
    exercise.usageCount += 1;
    await exercise.save();

    return sendSuccess(res, enrichExerciseWithImage(exercise, req));
  } catch (error) {
    logger.error('[EXERCISES] Get one error:', error);
    return sendError(res, 'server_error', 'Erreur lors de la recuperation de l\'exercice', 500);
  }
};

/**
 * Get exercises by category
 * GET /api/exercises/category/:category
 */
exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;

    const exercises = await Exercise.find({
      category,
      isActive: true,
    })
      .sort({ order: 1, name: 1 })
      .limit(parseInt(limit))
      .select('exoId name slug primaryMuscle mainImage difficulty type');

    res.json({
      success: true,
      data: exercises.map(ex => enrichExerciseWithImage(ex, req)),
      count: exercises.length,
    });
  } catch (error) {
    logger.error('[EXERCISES] Get by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation',
    });
  }
};

/**
 * Get exercises by muscle
 * GET /api/exercises/muscle/:muscle
 */
exports.getByMuscle = async (req, res) => {
  try {
    const { muscle } = req.params;
    const { limit = 50 } = req.query;

    const exercises = await Exercise.find({
      muscles: muscle,
      isActive: true,
    })
      .sort({ order: 1, name: 1 })
      .limit(parseInt(limit))
      .select('exoId name slug primaryMuscle mainImage difficulty type category');

    res.json({
      success: true,
      data: exercises.map(ex => enrichExerciseWithImage(ex, req)),
      count: exercises.length,
    });
  } catch (error) {
    logger.error('[EXERCISES] Get by muscle error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation',
    });
  }
};

/**
 * Get all categories with exercise count
 * GET /api/exercises/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Exercise.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: categories.map(c => ({
        category: c._id,
        count: c.count,
      })),
    });
  } catch (error) {
    logger.error('[EXERCISES] Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des categories',
    });
  }
};

/**
 * Get all muscles with exercise count
 * GET /api/exercises/muscles
 */
exports.getMuscles = async (req, res) => {
  try {
    const muscles = await Exercise.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$muscles' },
      {
        $group: {
          _id: '$muscles',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: muscles.map(m => ({
        muscle: m._id,
        count: m.count,
      })),
    });
  } catch (error) {
    logger.error('[EXERCISES] Get muscles error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des muscles',
    });
  }
};

/**
 * Get popular exercises
 * GET /api/exercises/popular
 */
exports.getPopular = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const exercises = await Exercise.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(parseInt(limit))
      .select('exoId name slug primaryMuscle mainImage difficulty type category usageCount');

    res.json({
      success: true,
      data: exercises.map(ex => enrichExerciseWithImage(ex, req)),
    });
  } catch (error) {
    logger.error('[EXERCISES] Get popular error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation',
    });
  }
};

// ============ ADMIN ROUTES ============

/**
 * Create exercise (Admin)
 * POST /api/exercises
 */
exports.createExercise = async (req, res) => {
  try {
    const exercise = new Exercise(req.body);
    await exercise.save();

    res.status(201).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    logger.error('[EXERCISES] Create error:', error);
    res.status(500).json({
      success: false,
      message: error.code === 11000
        ? 'Un exercice avec cet ID ou slug existe deja'
        : 'Erreur lors de la creation',
    });
  }
};

/**
 * Update exercise (Admin)
 * PUT /api/exercises/:id
 */
exports.updateExercise = async (req, res) => {
  try {
    const { id } = req.params;

    const exercise = await Exercise.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!exercise) {
      return sendError(res, 'exercise_not_found', 'Exercice non trouve', 404);
    }

    res.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    logger.error('[EXERCISES] Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise a jour',
    });
  }
};

/**
 * Delete exercise (Admin)
 * DELETE /api/exercises/:id
 */
exports.deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    const exercise = await Exercise.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!exercise) {
      return sendError(res, 'exercise_not_found', 'Exercice non trouve', 404);
    }

    res.json({
      success: true,
      message: 'Exercice supprime',
    });
  } catch (error) {
    logger.error('[EXERCISES] Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
    });
  }
};

/**
 * Bulk insert exercises (Admin - for migration)
 * POST /api/exercises/bulk
 */
exports.bulkInsert = async (req, res) => {
  try {
    const { exercises } = req.body;

    if (!exercises || !Array.isArray(exercises)) {
      return res.status(400).json({
        success: false,
        message: 'exercises array required',
      });
    }

    const result = await Exercise.insertMany(exercises, {
      ordered: false, // Continue on error
    });

    res.status(201).json({
      success: true,
      inserted: result.length,
    });
  } catch (error) {
    logger.error('[EXERCISES] Bulk insert error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'insertion',
      insertedCount: error.insertedDocs?.length || 0,
    });
  }
};
