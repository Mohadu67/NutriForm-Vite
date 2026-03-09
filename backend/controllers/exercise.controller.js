const Exercise = require('../models/Exercise');
const validator = require('validator');

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

    return res.json({
      success: true,
      data: enrichedExercises,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        pages: Math.ceil(total / limit),
        hasMore: (parseInt(page) * parseInt(limit)) < total,
      }
    });
  } catch (error) {
    console.error('[EXERCISES] Get error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des exercices'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Exercice non trouve'
      });
    }

    // Increment usage count
    exercise.usageCount += 1;
    await exercise.save();

    return res.json({
      success: true,
      data: enrichExerciseWithImage(exercise, req)
    });
  } catch (error) {
    console.error('[EXERCISES] Get one error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation de l\'exercice'
    });
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
    console.error('[EXERCISES] Get by category error:', error);
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
    console.error('[EXERCISES] Get by muscle error:', error);
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
    console.error('[EXERCISES] Get categories error:', error);
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
    console.error('[EXERCISES] Get muscles error:', error);
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
    console.error('[EXERCISES] Get popular error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation',
    });
  }
};

// ============ ADMIN ROUTES ============

/**
 * Update exercise (Admin)
 * PUT /api/exercises/:id
 */
exports.updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log(`[ADMIN] Update exercise ${id} by ${req.user?.email || 'unknown'}`);

    // Sanitization XSS pour les champs texte
    if (updateData.name) {
      updateData.name = validator.escape(updateData.name.trim());
    }
    if (updateData.explanation) {
      updateData.explanation = validator.escape(updateData.explanation.trim());
    }
    if (updateData.primaryMuscle) {
      updateData.primaryMuscle = validator.escape(updateData.primaryMuscle.trim());
    }
    if (updateData.secondaryMuscles && Array.isArray(updateData.secondaryMuscles)) {
      updateData.secondaryMuscles = updateData.secondaryMuscles.map(m => validator.escape(m.trim()));
    }
    if (updateData.equipment && Array.isArray(updateData.equipment)) {
      updateData.equipment = updateData.equipment.map(e => validator.escape(e.trim()));
    }
    if (updateData.tips && Array.isArray(updateData.tips)) {
      updateData.tips = updateData.tips.map(t => validator.escape(t.trim()));
    }

    // Validation des URLs
    if (updateData.mainImage && updateData.mainImage.trim() !== '') {
      if (!validator.isURL(updateData.mainImage, { protocols: ['http', 'https'], require_protocol: true })) {
        return res.status(400).json({
          success: false,
          message: 'URL de l\'image principale invalide. Doit commencer par http:// ou https://',
        });
      }
    }
    if (updateData.videoUrl && updateData.videoUrl.trim() !== '') {
      if (!validator.isURL(updateData.videoUrl, { protocols: ['http', 'https'], require_protocol: true })) {
        return res.status(400).json({
          success: false,
          message: 'URL de la vidéo invalide. Doit commencer par http:// ou https://',
        });
      }
    }

    const exercise = await Exercise.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercice non trouve'
      });
    }

    console.log(`[ADMIN] Exercise updated: ${exercise.name} (${exercise.exoId}) by ${req.user?.email || 'unknown'}`);

    res.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error('[EXERCISES] Update error:', error);
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

    console.log(`[ADMIN] Delete exercise ${id} by ${req.user?.email || 'unknown'}`);

    // Soft delete
    const exercise = await Exercise.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercice non trouve'
      });
    }

    console.log(`[ADMIN] Exercise soft-deleted: ${exercise.name} (${exercise.exoId}) by ${req.user?.email || 'unknown'}`);

    res.json({
      success: true,
      message: 'Exercice supprime',
    });
  } catch (error) {
    console.error('[EXERCISES] Delete error:', error);
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
    console.error('[EXERCISES] Bulk insert error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'insertion',
      insertedCount: error.insertedDocs?.length || 0,
    });
  }
};

/**
 * Create a single exercise (Admin only)
 * POST /api/admin/exercises
 */
exports.createExercise = async (req, res) => {
  try {
    console.log('[ADMIN] Create exercise request by:', req.user?.email || 'unknown');

    let {
      name,
      category,
      type,
      objectives,
      primaryMuscle,
      secondaryMuscles,
      equipment,
      difficulty,
      explanation,
      videoUrl,
      tips,
      restTime,
      recommendedSets,
      recommendedReps,
      mainImage,
    } = req.body;

    // Validation des champs requis
    if (!name || !category || !primaryMuscle || !explanation) {
      console.warn('[ADMIN] Validation failed:', { name, category, primaryMuscle, explanation: !!explanation });
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants: name, category, primaryMuscle, explanation',
        debug: {
          hasName: !!name,
          hasCategory: !!category,
          hasPrimaryMuscle: !!primaryMuscle,
          hasExplanation: !!explanation
        }
      });
    }

    // Sanitization XSS - Échapper les caractères HTML dangereux
    name = validator.escape(name.trim());
    explanation = validator.escape(explanation.trim());
    primaryMuscle = validator.escape(primaryMuscle.trim());

    if (secondaryMuscles && Array.isArray(secondaryMuscles)) {
      secondaryMuscles = secondaryMuscles.map(m => validator.escape(m.trim()));
    }

    if (equipment && Array.isArray(equipment)) {
      equipment = equipment.map(e => validator.escape(e.trim()));
    }

    if (tips && Array.isArray(tips)) {
      tips = tips.map(t => validator.escape(t.trim()));
    }

    // Validation des URLs
    if (mainImage && mainImage.trim() !== '') {
      if (!validator.isURL(mainImage, { protocols: ['http', 'https'], require_protocol: true })) {
        return res.status(400).json({
          success: false,
          message: 'URL de l\'image principale invalide. Doit commencer par http:// ou https://',
        });
      }
    }

    if (videoUrl && videoUrl.trim() !== '') {
      if (!validator.isURL(videoUrl, { protocols: ['http', 'https'], require_protocol: true })) {
        return res.status(400).json({
          success: false,
          message: 'URL de la vidéo invalide. Doit commencer par http:// ou https://',
        });
      }
    }

    // Generate unique exoId - find the highest existing number
    const allExercises = await Exercise.find({}, { exoId: 1 }).lean();

    let maxNumber = 0;
    allExercises.forEach(ex => {
      if (ex.exoId) {
        const match = ex.exoId.match(/exo-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });

    const exoId = `exo-${String(maxNumber + 1).padStart(3, '0')}`;

    // Generate slug from name
    let baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists and increment if necessary
    let slug = baseSlug;
    let slugExists = await Exercise.findOne({ slug });
    let counter = 1;

    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await Exercise.findOne({ slug });
      counter++;
      // Safety limit to avoid infinite loops
      if (counter > 100) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de générer un slug unique. Veuillez choisir un nom très différent.',
        });
      }
    }

    // Combine all muscles for search
    const muscles = [primaryMuscle, ...(secondaryMuscles || [])];

    // Create exercise
    const exercise = new Exercise({
      exoId,
      name,
      slug,
      category,
      type: type || [category],
      objectives: objectives || [],
      primaryMuscle,
      secondaryMuscles: secondaryMuscles || [],
      muscles,
      equipment: equipment || [],
      difficulty: difficulty || 'intermediaire',
      explanation,
      mainImage: mainImage || null,
      videoUrl: videoUrl || null,
      tips: tips || [],
      restTime: restTime || 60,
      recommendedSets: recommendedSets || 3,
      recommendedReps: recommendedReps || '8-12',
      isActive: true,
    });

    await exercise.save();

    console.log(`[ADMIN] Exercise created: ${exercise.name} (${exercise.exoId}) by ${req.user?.email || 'unknown'}`);

    const enrichedExercise = enrichExerciseWithImage(exercise, req);

    res.status(201).json({
      success: true,
      message: 'Exercice créé avec succès',
      exercise: enrichedExercise,
    });
  } catch (error) {
    console.error('[ADMIN] Create exercise error:', error);

    if (error.code === 11000) {
      // Déterminer quel champ cause le conflit
      let conflictField = 'inconnu';
      if (error.keyValue) {
        if (error.keyValue.exoId) conflictField = 'exoId';
        if (error.keyValue.slug) conflictField = 'slug (nom)';
        if (error.keyValue.name) conflictField = 'nom';
      }

      return res.status(400).json({
        success: false,
        message: `Un exercice avec ce ${conflictField} existe déjà. Veuillez choisir un nom différent.`,
        field: conflictField,
        value: error.keyValue
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'exercice',
      error: error.message,
    });
  }
};

/**
 * Seed exercises from JSON files (Admin only)
 * POST /api/exercises/seed
 */
exports.seedExercises = async (req, res) => {
  try {
    console.log('[ADMIN] Seed exercises requested by:', req.user?.email || 'unknown');

    const fs = require('fs');
    const path = require('path');

    const JSON_FILES = {
      muscu: path.join(__dirname, '../../frontend/public/data/exo/muscu.json'),
      cardio: path.join(__dirname, '../../frontend/public/data/exo/cardio.json'),
      yoga: path.join(__dirname, '../../frontend/public/data/exo/yoga.json'),
      meditation: path.join(__dirname, '../../frontend/public/data/exo/meditation.json'),
      natation: path.join(__dirname, '../../frontend/public/data/exo/natation.json'),
      etirement: path.join(__dirname, '../../frontend/public/data/exo/etirement.json'),
      hiit: path.join(__dirname, '../../frontend/public/data/exo/hiit.json'),
    };

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const errors = [];

    for (const [category, filePath] of Object.entries(JSON_FILES)) {
      if (!fs.existsSync(filePath)) {
        console.warn(`[SEED] File not found: ${category} (${filePath})`);
        continue;
      }

      console.log(`[SEED] Processing: ${category}.json`);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      const exercises = data.exercises || [];

      console.log(`[SEED] Found ${exercises.length} exercises in ${category}`);

      for (const exo of exercises) {
        try {
          // Generate exoId if missing
          let exoId = exo.id || exo.exoId;
          if (!exoId) {
            const lastExercise = await Exercise.findOne()
              .sort({ exoId: -1 })
              .select('exoId')
              .lean();

            let maxNum = 0;
            if (lastExercise && lastExercise.exoId) {
              const match = lastExercise.exoId.match(/exo-(\d+)/);
              if (match) maxNum = parseInt(match[1], 10);
            }

            exoId = `exo-${String(maxNum + 1).padStart(3, '0')}`;
          }

          // Check if exercise already exists
          const existing = await Exercise.findOne({
            $or: [
              { exoId },
              { name: exo.name }
            ]
          });

          if (existing) {
            console.log(`[SEED] Already exists: ${exo.name} (${existing.exoId})`);
            totalSkipped++;
            continue;
          }

          // Generate slug if missing
          let slug = exo.slug;
          if (!slug) {
            slug = exo.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
          }

          // Ensure slug uniqueness
          let finalSlug = slug;
          let counter = 1;
          while (await Exercise.findOne({ slug: finalSlug })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
          }

          // Combine muscles
          const muscles = [
            exo.primaryMuscle || exo.muscle || exo.muscles?.[0],
            ...(exo.secondaryMuscles || []),
            ...(Array.isArray(exo.muscles) ? exo.muscles : [])
          ].filter(Boolean);

          // Convert images to mainImage if needed
          let mainImage = exo.mainImage || exo.image || exo.gif || null;
          if (!mainImage && Array.isArray(exo.images) && exo.images.length > 0) {
            mainImage = exo.images[0];
          }

          // Create exercise
          const exercise = new Exercise({
            exoId,
            name: exo.name,
            slug: finalSlug,
            category: exo.category || category,
            type: exo.type || [category],
            objectives: exo.objectives || [],
            primaryMuscle: exo.primaryMuscle || exo.muscle || 'Non spécifié',
            secondaryMuscles: exo.secondaryMuscles || [],
            muscles: muscles.length > 0 ? muscles : [exo.primaryMuscle || 'Non spécifié'],
            equipment: exo.equipment || [],
            difficulty: exo.difficulty || 'intermediaire',
            explanation: exo.explanation || exo.instructions || 'Pas d\'explication disponible',
            mainImage: mainImage || null,
            videoUrl: exo.videoUrl || exo.video || null,
            tips: exo.tips || exo.conseils || [],
            restTime: exo.restTime || 60,
            recommendedSets: exo.recommendedSets || exo.series || 3,
            recommendedReps: exo.recommendedReps || exo.reps || '8-12',
            isActive: true,
            usageCount: exo.usageCount || 0,
          });

          await exercise.save();
          console.log(`[SEED] Imported: ${exo.name} (${exoId})`);
          totalImported++;

        } catch (error) {
          console.error(`[SEED] Error for ${exo.name}:`, error.message);
          totalErrors++;
          errors.push({ name: exo.name, error: error.message });
        }
      }
    }

    const totalInDB = await Exercise.countDocuments();
    console.log(`[SEED] Summary: imported=${totalImported}, skipped=${totalSkipped}, errors=${totalErrors}, total=${totalInDB}`);

    res.json({
      success: true,
      message: 'Seed completed',
      imported: totalImported,
      skipped: totalSkipped,
      errors: totalErrors,
      totalInDatabase: totalInDB,
      errorDetails: errors
    });

  } catch (error) {
    console.error('[SEED] Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du seed des exercices',
      error: error.message,
    });
  }
};
