const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');
require('dotenv').config();

const recipes = [
  {
    title: "Bowl Protéiné du Champion",
    slug: "bowl-proteine-champion",
    description: "Un bowl complet riche en protéines pour la prise de masse, avec quinoa, poulet grillé et avocat. Parfait après l'entraînement !",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    goal: ['muscle_gain', 'performance'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 20,
    totalTime: 35,
    servings: 2,
    nutrition: {
      calories: 520,
      proteins: 45,
      carbs: 52,
      fats: 18,
      fiber: 8
    },
    ingredients: [
      { name: "Quinoa", quantity: 150, unit: "g" },
      { name: "Poulet grillé", quantity: 200, unit: "g" },
      { name: "Avocat", quantity: 1, unit: "pièce" },
      { name: "Tomates cerises", quantity: 150, unit: "g" },
      { name: "Concombre", quantity: 1, unit: "pièce" },
      { name: "Huile d'olive", quantity: 2, unit: "c. à soupe" },
      { name: "Citron", quantity: 1, unit: "pièce" },
      { name: "Sel et poivre", quantity: 1, unit: "pincée" }
    ],
    instructions: [
      "Faire cuire le quinoa selon les instructions du paquet, environ 15 minutes dans de l'eau bouillante salée.",
      "Pendant ce temps, faire griller le poulet à la poêle avec un filet d'huile d'olive, 8-10 minutes de chaque côté.",
      "Couper les tomates cerises en deux, émincer le concombre et couper l'avocat en dés.",
      "Dans un bol, assembler le quinoa, le poulet coupé en morceaux et tous les légumes.",
      "Arroser d'huile d'olive et de jus de citron, assaisonner et mélanger délicatement."
    ],
    tags: ['high_protein', 'meal_prep'],
    dietType: ['none'],
    views: 245,
    likes: []
  },
  {
    title: "Smoothie Bowl Énergétique",
    slug: "smoothie-bowl-energetique",
    description: "Un smoothie bowl coloré et nutritif, parfait pour le petit-déjeuner. Rempli de fruits, de superaliments et de bonnes graisses.",
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800",
    isPremium: true,
    isPublished: true,
    isOfficial: true,
    goal: ['health', 'performance'],
    mealType: ['breakfast', 'snack'],
    category: 'sweet',
    difficulty: 'easy',
    prepTime: 10,
    cookTime: 0,
    totalTime: 10,
    servings: 1,
    nutrition: {
      calories: 380,
      proteins: 12,
      carbs: 58,
      fats: 15,
      fiber: 12
    },
    ingredients: [
      { name: "Bananes congelées", quantity: 2, unit: "pièces" },
      { name: "Myrtilles", quantity: 100, unit: "g" },
      { name: "Lait d'amande", quantity: 200, unit: "ml" },
      { name: "Beurre d'amande", quantity: 2, unit: "c. à soupe" },
      { name: "Graines de chia", quantity: 1, unit: "c. à soupe" },
      { name: "Granola", quantity: 50, unit: "g", optional: true },
      { name: "Fruits frais (fraises, kiwi)", quantity: 100, unit: "g", optional: true },
      { name: "Noix de coco râpée", quantity: 1, unit: "c. à soupe", optional: true }
    ],
    instructions: [
      "Placer les bananes congelées, les myrtilles, le lait d'amande et le beurre d'amande dans un blender.",
      "Mixer à haute vitesse jusqu'à obtenir une texture lisse et crémeuse (environ 1-2 minutes).",
      "Verser dans un bol et lisser la surface avec le dos d'une cuillère.",
      "Disposer joliment le granola, les fruits frais coupés et saupoudrer de graines de chia.",
      "Terminer avec la noix de coco râpée et déguster immédiatement !"
    ],
    tags: ['quick', 'no_sugar'],
    dietType: ['vegetarian'],
    views: 567,
    likes: []
  },
  {
    title: "Salade César Légère & Protéinée",
    slug: "salade-cesar-legere-proteinee",
    description: "Version allégée et healthy de la salade César classique. Parfaite pour la perte de poids sans sacrifier le goût !",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    goal: ['weight_loss', 'maintenance'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 10,
    totalTime: 25,
    servings: 2,
    nutrition: {
      calories: 320,
      proteins: 35,
      carbs: 18,
      fats: 12,
      fiber: 6
    },
    ingredients: [
      { name: "Laitue romaine", quantity: 2, unit: "têtes" },
      { name: "Blanc de poulet", quantity: 300, unit: "g" },
      { name: "Parmesan râpé", quantity: 30, unit: "g" },
      { name: "Croûtons complets", quantity: 50, unit: "g" },
      { name: "Yaourt grec 0%", quantity: 100, unit: "g" },
      { name: "Moutarde de Dijon", quantity: 1, unit: "c. à café" },
      { name: "Jus de citron", quantity: 2, unit: "c. à soupe" },
      { name: "Ail", quantity: 1, unit: "gousse" },
      { name: "Anchois", quantity: 2, unit: "filets", optional: true }
    ],
    instructions: [
      "Faire griller le poulet à la poêle ou au four, assaisonné de sel et poivre, environ 10 minutes.",
      "Laver et essorer la laitue romaine, puis la couper en morceaux.",
      "Préparer la sauce : mélanger le yaourt grec, la moutarde, le jus de citron, l'ail écrasé et les anchois hachés.",
      "Couper le poulet grillé en tranches ou en cubes.",
      "Dans un grand saladier, mélanger la laitue, le poulet, les croûtons et le parmesan.",
      "Ajouter la sauce, mélanger délicatement et servir immédiatement."
    ],
    tags: ['low_carb', 'high_protein', 'low_fat'],
    dietType: ['none'],
    views: 892,
    likes: []
  }
];

async function seedRecipes() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer les recettes existantes (optionnel)
    await Recipe.deleteMany({});
    console.log('🗑️ Recettes existantes supprimées');

    // Insérer les nouvelles recettes
    const createdRecipes = await Recipe.insertMany(recipes);
    console.log(`✅ ${createdRecipes.length} recettes créées avec succès !`);

    createdRecipes.forEach(recipe => {
      console.log(`   📝 ${recipe.title} (${recipe.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedRecipes();
