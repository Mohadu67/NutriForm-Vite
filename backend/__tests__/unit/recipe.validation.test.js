const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../server');
const Recipe = require('../../models/Recipe');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Recipe Controller - User Recipes & Validation', () => {
  let premiumToken;
  let premiumUserId;
  let freeToken;
  let freeUserId;
  let adminToken;
  let adminId;

  beforeAll(async () => {
    // Creer un utilisateur premium de test
    const premiumUser = await User.create({
      pseudo: 'premiumuser',
      email: 'premium@example.com',
      motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
      isEmailVerified: true,
      role: 'user',
      isPremium: true,
      premiumSince: new Date(),
      premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    });

    premiumUserId = premiumUser._id.toString();
    premiumToken = jwt.sign(
      { id: premiumUserId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Creer un utilisateur gratuit de test
    const freeUser = await User.create({
      pseudo: 'freeuser',
      email: 'free@example.com',
      motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
      isEmailVerified: true,
      role: 'user',
      isPremium: false
    });

    freeUserId = freeUser._id.toString();
    freeToken = jwt.sign(
      { id: freeUserId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Creer un admin de test
    const adminUser = await User.create({
      pseudo: 'adminuser',
      email: 'admin@example.com',
      motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
      isEmailVerified: true,
      role: 'admin'
    });

    adminId = adminUser._id.toString();
    adminToken = jwt.sign(
      { id: adminId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Nettoyer la base de donnees
    await User.deleteMany({ email: { $in: ['premium@example.com', 'free@example.com', 'admin@example.com'] } });
    await Recipe.deleteMany({ createdBy: 'user' });
  });

  afterEach(async () => {
    // Nettoyer les recettes utilisateur apres chaque test
    await Recipe.deleteMany({ createdBy: 'user' });
  });

  // =====================================================
  // TESTS - Creation de recettes utilisateur
  // =====================================================

  describe('POST /api/recipes/user - createUserRecipe', () => {
    const validRecipe = {
      title: 'Bowl Proteine Maison',
      description: 'Un delicieux bowl riche en proteines pour la recuperation',
      category: 'salty',
      difficulty: 'easy',
      prepTime: 15,
      cookTime: 10,
      servings: 2,
      nutrition: {
        calories: 450,
        proteins: 35,
        carbs: 40,
        fats: 15,
        fiber: 8
      },
      goal: ['muscle_gain', 'health'],
      mealType: ['lunch', 'dinner'],
      tags: ['high_protein', 'quick'],
      dietType: ['none'],
      ingredients: [
        { name: 'Poulet', quantity: 200, unit: 'g', optional: false },
        { name: 'Riz complet', quantity: 150, unit: 'g', optional: false },
        { name: 'Avocat', quantity: 1, unit: 'piece', optional: true }
      ],
      instructions: [
        'Cuire le riz selon les instructions',
        'Griller le poulet avec les epices',
        'Assembler le bowl'
      ]
    };

    it('devrait permettre a un utilisateur premium de creer une recette', async () => {
      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(validRecipe)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.recipe.title).toBe('Bowl Proteine Maison');
      expect(response.body.recipe.status).toBe('private');
      expect(response.body.recipe.createdBy).toBe('user');
      expect(response.body.recipe.isPublished).toBe(false);
      expect(response.body.recipe.author.toString()).toBe(premiumUserId);
    });

    it('devrait rejeter un utilisateur gratuit', async () => {
      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${freeToken}`)
        .send(validRecipe)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter sans authentification', async () => {
      const response = await request(app)
        .post('/api/recipes/user')
        .send(validRecipe)
        .expect(401);
    });

    it('devrait rejeter si titre manquant', async () => {
      const invalidRecipe = { ...validRecipe };
      delete invalidRecipe.title;

      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(invalidRecipe)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('titre');
    });

    it('devrait rejeter si description manquante', async () => {
      const invalidRecipe = { ...validRecipe };
      delete invalidRecipe.description;

      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(invalidRecipe)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('description');
    });

    it('devrait rejeter si ingredients vides', async () => {
      const invalidRecipe = { ...validRecipe, ingredients: [] };

      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(invalidRecipe)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ingredient');
    });

    it('devrait rejeter si instructions vides', async () => {
      const invalidRecipe = { ...validRecipe, instructions: [] };

      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(invalidRecipe)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('instruction');
    });

    it('devrait accepter une recette sans image (utilisateur)', async () => {
      const recipeWithoutImage = { ...validRecipe };
      delete recipeWithoutImage.image;

      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(recipeWithoutImage)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.recipe.image).toBeUndefined();
    });

    it('devrait generer un slug unique', async () => {
      // Creer une premiere recette
      await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(validRecipe);

      // Creer une deuxieme recette avec le meme titre
      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(validRecipe)
        .expect(201);

      expect(response.body.recipe.slug).toMatch(/bowl-proteine-maison-\d+/);
    });

    it('devrait calculer totalTime automatiquement', async () => {
      const response = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send(validRecipe)
        .expect(201);

      expect(response.body.recipe.totalTime).toBe(25); // 15 + 10
    });
  });

  // =====================================================
  // TESTS - Recuperation des recettes utilisateur
  // =====================================================

  describe('GET /api/recipes/user/my-recipes - getUserRecipes', () => {
    beforeEach(async () => {
      // Creer des recettes de test
      await Recipe.create([
        {
          title: 'Recette 1',
          slug: 'recette-1',
          description: 'Description 1',
          category: 'salty',
          difficulty: 'easy',
          prepTime: 10,
          cookTime: 10,
          totalTime: 20,
          servings: 2,
          nutrition: { calories: 300, proteins: 20, carbs: 30, fats: 10 },
          ingredients: [{ name: 'Test', quantity: 100, unit: 'g' }],
          instructions: ['Etape 1'],
          author: premiumUserId,
          createdBy: 'user',
          status: 'private'
        },
        {
          title: 'Recette 2',
          slug: 'recette-2',
          description: 'Description 2',
          category: 'sweet',
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 30,
          totalTime: 50,
          servings: 4,
          nutrition: { calories: 500, proteins: 10, carbs: 60, fats: 20 },
          ingredients: [{ name: 'Test2', quantity: 200, unit: 'g' }],
          instructions: ['Etape 1', 'Etape 2'],
          author: premiumUserId,
          createdBy: 'user',
          status: 'pending'
        }
      ]);
    });

    it('devrait retourner les recettes de l\'utilisateur premium', async () => {
      const response = await request(app)
        .get('/api/recipes/user/my-recipes')
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recipes).toHaveLength(2);
      expect(response.body.recipes[0].author.toString()).toBe(premiumUserId);
    });

    it('devrait rejeter un utilisateur gratuit', async () => {
      const response = await request(app)
        .get('/api/recipes/user/my-recipes')
        .set('Authorization', `Bearer ${freeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('devrait retourner un tableau vide si aucune recette', async () => {
      await Recipe.deleteMany({ createdBy: 'user' });

      const response = await request(app)
        .get('/api/recipes/user/my-recipes')
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recipes).toHaveLength(0);
    });
  });

  // =====================================================
  // TESTS - Modification de recettes utilisateur
  // =====================================================

  describe('PUT /api/recipes/user/:id - updateUserRecipe', () => {
    let recipeId;

    beforeEach(async () => {
      const recipe = await Recipe.create({
        title: 'Recette a modifier',
        slug: 'recette-a-modifier',
        description: 'Description originale',
        category: 'salty',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 10,
        totalTime: 20,
        servings: 2,
        nutrition: { calories: 300, proteins: 20, carbs: 30, fats: 10 },
        ingredients: [{ name: 'Test', quantity: 100, unit: 'g' }],
        instructions: ['Etape 1'],
        author: premiumUserId,
        createdBy: 'user',
        status: 'private'
      });
      recipeId = recipe._id.toString();
    });

    it('devrait permettre de modifier une recette privee', async () => {
      const response = await request(app)
        .put(`/api/recipes/user/${recipeId}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ title: 'Nouveau titre', description: 'Nouvelle description' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recipe.title).toBe('Nouveau titre');
      expect(response.body.recipe.description).toBe('Nouvelle description');
    });

    it('devrait rejeter la modification d\'une recette en pending', async () => {
      await Recipe.findByIdAndUpdate(recipeId, { status: 'pending' });

      const response = await request(app)
        .put(`/api/recipes/user/${recipeId}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ title: 'Nouveau titre' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('privee');
    });

    it('devrait rejeter la modification d\'une recette publique', async () => {
      await Recipe.findByIdAndUpdate(recipeId, { status: 'public' });

      const response = await request(app)
        .put(`/api/recipes/user/${recipeId}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ title: 'Nouveau titre' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter si l\'utilisateur n\'est pas le proprietaire', async () => {
      // Creer un autre utilisateur premium
      const otherUser = await User.create({
        pseudo: 'otheruser',
        email: 'other@example.com',
        motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
        isEmailVerified: true,
        role: 'user',
        isPremium: true,
        premiumSince: new Date(),
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const otherToken = jwt.sign(
        { id: otherUser._id.toString() },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put(`/api/recipes/user/${recipeId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Nouveau titre' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('proprietaire');

      // Cleanup
      await User.findByIdAndDelete(otherUser._id);
    });

    it('devrait rejeter un ID invalide', async () => {
      const response = await request(app)
        .put('/api/recipes/user/invalid-id')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ title: 'Nouveau titre' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('devrait retourner 404 pour une recette inexistante', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/recipes/user/${fakeId}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ title: 'Nouveau titre' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // =====================================================
  // TESTS - Suppression de recettes utilisateur
  // =====================================================

  describe('DELETE /api/recipes/user/:id - deleteUserRecipe', () => {
    let recipeId;

    beforeEach(async () => {
      const recipe = await Recipe.create({
        title: 'Recette a supprimer',
        slug: 'recette-a-supprimer',
        description: 'Description',
        category: 'salty',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 10,
        totalTime: 20,
        servings: 2,
        nutrition: { calories: 300, proteins: 20, carbs: 30, fats: 10 },
        ingredients: [{ name: 'Test', quantity: 100, unit: 'g' }],
        instructions: ['Etape 1'],
        author: premiumUserId,
        createdBy: 'user',
        status: 'private'
      });
      recipeId = recipe._id.toString();
    });

    it('devrait permettre de supprimer une recette privee', async () => {
      const response = await request(app)
        .delete(`/api/recipes/user/${recipeId}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verifier que la recette est supprimee
      const recipe = await Recipe.findById(recipeId);
      expect(recipe).toBeNull();
    });

    it('devrait rejeter si l\'utilisateur n\'est pas le proprietaire', async () => {
      const otherUser = await User.create({
        pseudo: 'deleteother',
        email: 'deleteother@example.com',
        motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
        isEmailVerified: true,
        role: 'user',
        isPremium: true,
        premiumSince: new Date(),
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const otherToken = jwt.sign(
        { id: otherUser._id.toString() },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .delete(`/api/recipes/user/${recipeId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Cleanup
      await User.findByIdAndDelete(otherUser._id);
    });
  });

  // =====================================================
  // TESTS - Proposition au public
  // =====================================================

  describe('POST /api/recipes/user/:id/propose - proposeRecipeToPublic', () => {
    let recipeId;

    beforeEach(async () => {
      const recipe = await Recipe.create({
        title: 'Recette a proposer',
        slug: 'recette-a-proposer',
        description: 'Description',
        image: 'https://example.com/image.jpg',
        category: 'salty',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 10,
        totalTime: 20,
        servings: 2,
        nutrition: { calories: 300, proteins: 20, carbs: 30, fats: 10 },
        ingredients: [{ name: 'Test', quantity: 100, unit: 'g' }],
        instructions: ['Etape 1'],
        author: premiumUserId,
        createdBy: 'user',
        status: 'private'
      });
      recipeId = recipe._id.toString();
    });

    it('devrait permettre de proposer une recette avec image', async () => {
      const response = await request(app)
        .post(`/api/recipes/user/${recipeId}/propose`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recipe.status).toBe('pending');
    });

    it('devrait rejeter une recette sans image', async () => {
      // Supprimer l'image
      await Recipe.findByIdAndUpdate(recipeId, { $unset: { image: 1 } });

      const response = await request(app)
        .post(`/api/recipes/user/${recipeId}/propose`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('image');
    });

    it('devrait rejeter si la recette est deja en pending', async () => {
      await Recipe.findByIdAndUpdate(recipeId, { status: 'pending' });

      const response = await request(app)
        .post(`/api/recipes/user/${recipeId}/propose`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter si la recette est deja publique', async () => {
      await Recipe.findByIdAndUpdate(recipeId, { status: 'public' });

      const response = await request(app)
        .post(`/api/recipes/user/${recipeId}/propose`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('devrait reset rejectionReason lors de la proposition', async () => {
      await Recipe.findByIdAndUpdate(recipeId, { rejectionReason: 'Ancienne raison' });

      const response = await request(app)
        .post(`/api/recipes/user/${recipeId}/propose`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(response.body.recipe.rejectionReason).toBeUndefined();
    });
  });

  // =====================================================
  // TESTS ADMIN - Recettes en attente
  // =====================================================

  describe('GET /api/recipes/admin/pending - getPendingRecipes', () => {
    beforeEach(async () => {
      await Recipe.create([
        {
          title: 'Recette Pending 1',
          slug: 'recette-pending-1',
          description: 'Description',
          image: 'https://example.com/1.jpg',
          category: 'salty',
          difficulty: 'easy',
          prepTime: 10,
          cookTime: 10,
          totalTime: 20,
          servings: 2,
          nutrition: { calories: 300, proteins: 20, carbs: 30, fats: 10 },
          ingredients: [{ name: 'Test', quantity: 100, unit: 'g' }],
          instructions: ['Etape 1'],
          author: premiumUserId,
          createdBy: 'user',
          status: 'pending'
        },
        {
          title: 'Recette Pending 2',
          slug: 'recette-pending-2',
          description: 'Description 2',
          image: 'https://example.com/2.jpg',
          category: 'sweet',
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 30,
          totalTime: 50,
          servings: 4,
          nutrition: { calories: 500, proteins: 10, carbs: 60, fats: 20 },
          ingredients: [{ name: 'Test2', quantity: 200, unit: 'g' }],
          instructions: ['Etape 1', 'Etape 2'],
          author: premiumUserId,
          createdBy: 'user',
          status: 'pending'
        },
        {
          title: 'Recette Privee',
          slug: 'recette-privee',
          description: 'Description privee',
          category: 'salty',
          difficulty: 'hard',
          prepTime: 30,
          cookTime: 60,
          totalTime: 90,
          servings: 6,
          nutrition: { calories: 700, proteins: 40, carbs: 50, fats: 30 },
          ingredients: [{ name: 'Test3', quantity: 300, unit: 'g' }],
          instructions: ['Etape 1'],
          author: premiumUserId,
          createdBy: 'user',
          status: 'private'
        }
      ]);
    });

    it('devrait retourner uniquement les recettes pending pour admin', async () => {
      const response = await request(app)
        .get('/api/recipes/admin/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recipes).toHaveLength(2);
      expect(response.body.recipes.every(r => r.status === 'pending')).toBe(true);
    });

    it('devrait rejeter un utilisateur non-admin', async () => {
      const response = await request(app)
        .get('/api/recipes/admin/pending')
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(403);
    });

    it('devrait inclure les informations de l\'auteur', async () => {
      const response = await request(app)
        .get('/api/recipes/admin/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.recipes[0].author).toBeDefined();
    });
  });

  // =====================================================
  // TESTS ADMIN - Approbation de recettes
  // =====================================================

  describe('POST /api/recipes/admin/:id/approve - approveRecipe', () => {
    let recipeId;

    beforeEach(async () => {
      const recipe = await Recipe.create({
        title: 'Recette a approuver',
        slug: 'recette-a-approuver',
        description: 'Description',
        image: 'https://example.com/image.jpg',
        category: 'salty',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 10,
        totalTime: 20,
        servings: 2,
        nutrition: { calories: 300, proteins: 20, carbs: 30, fats: 10 },
        ingredients: [{ name: 'Test', quantity: 100, unit: 'g' }],
        instructions: ['Etape 1'],
        author: premiumUserId,
        createdBy: 'user',
        status: 'pending'
      });
      recipeId = recipe._id.toString();
    });

    it('devrait permettre a un admin d\'approuver une recette', async () => {
      const response = await request(app)
        .post(`/api/recipes/admin/${recipeId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recipe.status).toBe('public');
      expect(response.body.recipe.isPublished).toBe(true);
    });

    it('devrait rejeter si la recette n\'est pas en pending', async () => {
      await Recipe.findByIdAndUpdate(recipeId, { status: 'private' });

      const response = await request(app)
        .post(`/api/recipes/admin/${recipeId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter un utilisateur non-admin', async () => {
      const response = await request(app)
        .post(`/api/recipes/admin/${recipeId}/approve`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(403);
    });
  });

  // =====================================================
  // TESTS ADMIN - Rejet de recettes
  // =====================================================

  describe('POST /api/recipes/admin/:id/reject - rejectRecipe', () => {
    let recipeId;

    beforeEach(async () => {
      const recipe = await Recipe.create({
        title: 'Recette a rejeter',
        slug: 'recette-a-rejeter',
        description: 'Description',
        image: 'https://example.com/image.jpg',
        category: 'salty',
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 10,
        totalTime: 20,
        servings: 2,
        nutrition: { calories: 300, proteins: 20, carbs: 30, fats: 10 },
        ingredients: [{ name: 'Test', quantity: 100, unit: 'g' }],
        instructions: ['Etape 1'],
        author: premiumUserId,
        createdBy: 'user',
        status: 'pending'
      });
      recipeId = recipe._id.toString();
    });

    it('devrait permettre a un admin de rejeter une recette avec raison', async () => {
      const response = await request(app)
        .post(`/api/recipes/admin/${recipeId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'La recette manque de details' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recipe.status).toBe('private');
      expect(response.body.recipe.isPublished).toBe(false);
      expect(response.body.recipe.rejectionReason).toBe('La recette manque de details');
    });

    it('devrait permettre de rejeter sans raison', async () => {
      const response = await request(app)
        .post(`/api/recipes/admin/${recipeId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recipe.status).toBe('private');
      expect(response.body.recipe.rejectionReason).toMatch(/Aucune raison/);
    });

    it('devrait rejeter si la recette n\'est pas en pending', async () => {
      await Recipe.findByIdAndUpdate(recipeId, { status: 'public' });

      const response = await request(app)
        .post(`/api/recipes/admin/${recipeId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter un utilisateur non-admin', async () => {
      const response = await request(app)
        .post(`/api/recipes/admin/${recipeId}/reject`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ reason: 'Test' })
        .expect(403);
    });
  });

  // =====================================================
  // TESTS - Workflow complet
  // =====================================================

  describe('Workflow complet - Creation -> Proposition -> Approbation/Rejet', () => {
    it('devrait completer le workflow d\'approbation', async () => {
      // 1. Creer une recette
      const createRes = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({
          title: 'Workflow Test Recipe',
          description: 'Test du workflow complet',
          image: 'https://example.com/workflow.jpg',
          category: 'salty',
          difficulty: 'easy',
          prepTime: 15,
          cookTime: 20,
          servings: 2,
          nutrition: { calories: 400, proteins: 30, carbs: 35, fats: 12 },
          ingredients: [{ name: 'Ingredient', quantity: 100, unit: 'g' }],
          instructions: ['Faire cuire']
        })
        .expect(201);

      const recipeId = createRes.body.recipe._id;
      expect(createRes.body.recipe.status).toBe('private');

      // 2. Proposer au public
      const proposeRes = await request(app)
        .post(`/api/recipes/user/${recipeId}/propose`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(proposeRes.body.recipe.status).toBe('pending');

      // 3. Admin approuve
      const approveRes = await request(app)
        .post(`/api/recipes/admin/${recipeId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(approveRes.body.recipe.status).toBe('public');
      expect(approveRes.body.recipe.isPublished).toBe(true);
    });

    it('devrait completer le workflow de rejet et resoumettre', async () => {
      // 1. Creer une recette
      const createRes = await request(app)
        .post('/api/recipes/user')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({
          title: 'Reject Workflow Test',
          description: 'Test du workflow de rejet',
          image: 'https://example.com/reject.jpg',
          category: 'sweet',
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 30,
          servings: 4,
          nutrition: { calories: 500, proteins: 15, carbs: 60, fats: 20 },
          ingredients: [{ name: 'Ingredient', quantity: 200, unit: 'g' }],
          instructions: ['Etape 1']
        })
        .expect(201);

      const recipeId = createRes.body.recipe._id;

      // 2. Proposer au public
      await request(app)
        .post(`/api/recipes/user/${recipeId}/propose`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      // 3. Admin rejette
      const rejectRes = await request(app)
        .post(`/api/recipes/admin/${recipeId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Instructions insuffisantes' })
        .expect(200);

      expect(rejectRes.body.recipe.status).toBe('private');
      expect(rejectRes.body.recipe.rejectionReason).toBe('Instructions insuffisantes');

      // 4. L'utilisateur peut modifier (car status est private)
      const updateRes = await request(app)
        .put(`/api/recipes/user/${recipeId}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ instructions: ['Etape 1 detaillee', 'Etape 2', 'Etape 3'] })
        .expect(200);

      expect(updateRes.body.recipe.instructions).toHaveLength(3);

      // 5. Resoumettre
      const resubmitRes = await request(app)
        .post(`/api/recipes/user/${recipeId}/propose`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);

      expect(resubmitRes.body.recipe.status).toBe('pending');
      expect(resubmitRes.body.recipe.rejectionReason).toBeUndefined();
    });
  });
});
