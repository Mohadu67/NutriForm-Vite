const HIITProgram = require('../models/HIITProgram');

/**
 * Obtenir tous les programmes HIIT actifs
 */
exports.getAllPrograms = async (req, res) => {
  try {
    console.log('🔍 [HIIT] Récupération des programmes...');
    console.log('🔍 [HIIT] Nom de collection:', HIITProgram.collection.name);

    // Test direct
    const all = await HIITProgram.find({});
    console.log(`🔍 [HIIT] Total en DB (sans filtre): ${all.length}`);

    const programs = await HIITProgram.find({ isActive: true })
      .select('-__v')
      .sort({ level: 1, totalDuration: 1 })
      .lean();

    console.log(`✅ [HIIT] ${programs.length} programmes actifs trouvés`);

    res.json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error('❌ [HIIT] Erreur lors de la récupération des programmes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des programmes',
    });
  }
};

/**
 * Obtenir un programme HIIT par ID
 */
exports.getProgramById = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await HIITProgram.findById(id).select('-__v').lean();

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Programme introuvable',
      });
    }

    res.json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du programme:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du programme',
    });
  }
};

/**
 * Créer un nouveau programme HIIT (Admin only)
 */
exports.createProgram = async (req, res) => {
  try {
    const { title, description, level, totalDuration, trainer, imageUrl, exercises } = req.body;

    const program = await HIITProgram.create({
      title,
      description,
      level,
      totalDuration,
      trainer,
      imageUrl,
      exercises,
    });

    res.status(201).json({
      success: true,
      message: 'Programme HIIT créé avec succès',
      data: program,
    });
  } catch (error) {
    console.error('Erreur lors de la création du programme:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du programme',
    });
  }
};

/**
 * Mettre à jour un programme HIIT (Admin only)
 */
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const program = await HIITProgram.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Programme introuvable',
      });
    }

    res.json({
      success: true,
      message: 'Programme mis à jour avec succès',
      data: program,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du programme:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du programme',
    });
  }
};

/**
 * Supprimer un programme HIIT (Admin only - soft delete)
 */
exports.deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await HIITProgram.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Programme introuvable',
      });
    }

    res.json({
      success: true,
      message: 'Programme supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du programme:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du programme',
    });
  }
};
