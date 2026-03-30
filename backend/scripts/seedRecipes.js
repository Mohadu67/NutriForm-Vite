const path = require('path');
const mongoose = require('mongoose');
const Recipe = require(path.join(__dirname, '..', 'models', 'Recipe'));
const User = require(path.join(__dirname, '..', 'models', 'User'));
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const recipes = [
  {
    title: "Bowl Protéiné du Champion",
    slug: "bowl-proteine-champion",
    description: "Un bowl complet riche en protéines pour la prise de masse, avec quinoa, poulet grillé et avocat. Parfait après l'entraînement !",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
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
    _assignAuthor: 'nono',
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
    _assignAuthor: 'nono',
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
  },

  // ============================================
  // NOUVELLES RECETTES MEAL PREP (5 portions)
  // ============================================

  {
    title: "Poulet Crémeux Healthy avec Riz et Légumes",
    slug: "poulet-cremeux-healthy-riz-legumes",
    description: "Un meal prep complet et crémeux avec du poulet, du riz basmati et des légumes variés. La sauce au fromage blanc remplace la crème pour un résultat léger mais gourmand.",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    goal: ['muscle_gain', 'maintenance'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 25,
    totalTime: 40,
    servings: 5,
    nutrition: {
      calories: 2900,
      proteins: 238,
      carbs: 313,
      fats: 63,
      fiber: 30
    },
    ingredients: [
      { name: "Escalope de poulet", quantity: 500, unit: "g" },
      { name: "Riz basmati", quantity: 300, unit: "g" },
      { name: "Poivrons", quantity: 200, unit: "g" },
      { name: "Haricots verts", quantity: 200, unit: "g" },
      { name: "Oignon", quantity: 200, unit: "g" },
      { name: "Mais", quantity: 200, unit: "g" },
      { name: "Haricots rouges", quantity: 200, unit: "g" },
      { name: "Fromage blanc 0%", quantity: 200, unit: "g" },
      { name: "Sauce tomate", quantity: 100, unit: "g" },
      { name: "Huile", quantity: 2, unit: "c. a soupe" },
      { name: "Oignon", quantity: 1, unit: "piece" },
      { name: "Ail", quantity: 2, unit: "gousses" },
      { name: "Paprika", quantity: 1, unit: "c. a cafe" },
      { name: "Curry ou curcuma", quantity: 1, unit: "c. a cafe" },
      { name: "Herbes de Provence", quantity: 1, unit: "c. a cafe" },
      { name: "Sel et poivre", quantity: 1, unit: "pincee" }
    ],
    instructions: [
      "Rincer le riz basmati puis le cuire dans l'eau bouillante salee environ 10-12 min. Egoutter sans ajouter d'huile.",
      "Couper le poulet en morceaux. Faire chauffer 1 c. a soupe d'huile dans une poele.",
      "Ajouter l'oignon emince et l'ail, puis le poulet. Cuire jusqu'a ce qu'il soit dore.",
      "Ajouter la sauce tomate, le paprika, le curry, les herbes de Provence, sel et poivre. Melanger.",
      "Baisser le feu et ajouter le fromage blanc 0%. Melanger doucement sans faire bouillir fort pour eviter que ca tranche.",
      "Dans une autre poele, chauffer 1 c. a soupe d'huile. Ajouter tous les legumes (poivrons, haricots verts, mais, haricots rouges) et cuire 10-15 min. Assaisonner.",
      "Assembler dans chaque tupperware : 120 g de riz cuit, 150 g de poulet cremeux, 200 g de legumes."
    ],
    tags: ['high_protein', 'meal_prep', 'budget_friendly'],
    dietType: ['none'],
    views: 0,
    likes: []
  },
  {
    title: "Poelee Cremeuse Viande Hachee, Pommes de Terre et Legumes",
    slug: "poelee-cremeuse-viande-hachee-pommes-de-terre-legumes",
    description: "Une poelee complete et cremeuse avec viande hachee 5%, pommes de terre et legumes. Sauce au fromage blanc et creme legere pour un plat gourmand mais equilibre.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    goal: ['maintenance', 'muscle_gain'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 30,
    totalTime: 45,
    servings: 5,
    nutrition: {
      calories: 3000,
      proteins: 188,
      carbs: 275,
      fats: 100,
      fiber: 35
    },
    ingredients: [
      { name: "Viande hachee 5% MG", quantity: 500, unit: "g" },
      { name: "Pommes de terre", quantity: 800, unit: "g" },
      { name: "Legumes surgeles (brocoli, carottes, haricots verts)", quantity: 1000, unit: "g" },
      { name: "Fromage blanc 0%", quantity: 200, unit: "g" },
      { name: "Creme legere 15%", quantity: 100, unit: "ml" },
      { name: "Huile", quantity: 2, unit: "c. a soupe" },
      { name: "Oignon", quantity: 1, unit: "piece" },
      { name: "Ail", quantity: 2, unit: "gousses" },
      { name: "Paprika", quantity: 1, unit: "c. a cafe" },
      { name: "Ail en poudre", quantity: 1, unit: "c. a cafe" },
      { name: "Herbes de Provence", quantity: 1, unit: "c. a cafe" },
      { name: "Sel et poivre", quantity: 1, unit: "pincee" }
    ],
    instructions: [
      "Eplucher et couper les pommes de terre en cubes. Les cuire dans l'eau bouillante salee 10-15 min (tendres mais pas en puree). Egoutter.",
      "Chauffer 1 c. a soupe d'huile. Faire revenir l'oignon et l'ail, puis ajouter la viande hachee. Bien faire dorer et assaisonner genereusement.",
      "Dans une autre poele, chauffer 1 c. a soupe d'huile. Ajouter les legumes surgeles et cuire jusqu'a evaporation de l'eau. Assaisonner.",
      "Dans la poele de la viande, baisser le feu. Ajouter la creme legere et le fromage blanc. Melanger a feu doux pour une texture cremeuse mais legere.",
      "Ajouter les pommes de terre et les legumes dans la viande cremeuse. Melanger le tout et laisser mijoter 5 min.",
      "Repartir dans 5 tupperwares. Astuce : remplacer une partie des pommes de terre par de la patate douce ou ajouter des champignons pour plus de volume et de gout."
    ],
    tags: ['high_protein', 'meal_prep', 'budget_friendly', 'family_friendly'],
    dietType: ['none'],
    views: 0,
    likes: []
  },
  {
    title: "Pates Cremeuses Facon Boeuf Bourguignon Healthy",
    slug: "pates-cremeuses-boeuf-bourguignon-healthy",
    description: "Des pates completes dans une sauce facon bourguignon cremeuse et legere. Le vin rouge, les carottes et les champignons donnent un gout de plat mijote, le fromage blanc allegé le tout.",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    goal: ['muscle_gain', 'maintenance'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'medium',
    prepTime: 15,
    cookTime: 40,
    totalTime: 55,
    servings: 5,
    nutrition: {
      calories: 3250,
      proteins: 213,
      carbs: 350,
      fats: 88,
      fiber: 25
    },
    ingredients: [
      { name: "Boeuf hache 5% (ou morceaux bourguignon maigres)", quantity: 500, unit: "g" },
      { name: "Pates completes", quantity: 300, unit: "g" },
      { name: "Carottes", quantity: 400, unit: "g" },
      { name: "Oignon", quantity: 1, unit: "piece" },
      { name: "Ail", quantity: 2, unit: "gousses" },
      { name: "Champignons", quantity: 200, unit: "g", optional: true },
      { name: "Vin rouge", quantity: 150, unit: "ml", optional: true },
      { name: "Fromage blanc 0%", quantity: 200, unit: "g" },
      { name: "Creme legere 12-15%", quantity: 100, unit: "ml" },
      { name: "Concentre de tomate", quantity: 1, unit: "c. a soupe" },
      { name: "Cube de bouillon boeuf", quantity: 1, unit: "piece" },
      { name: "Huile", quantity: 2, unit: "c. a soupe" },
      { name: "Thym", quantity: 1, unit: "c. a cafe" },
      { name: "Laurier", quantity: 1, unit: "feuille" },
      { name: "Paprika", quantity: 1, unit: "c. a cafe" },
      { name: "Sel et poivre", quantity: 1, unit: "pincee" }
    ],
    instructions: [
      "Cuire les pates dans l'eau salee. Egoutter en gardant un peu d'eau de cuisson (important pour la sauce).",
      "Chauffer 1 c. a soupe d'huile. Faire revenir l'oignon et l'ail, puis ajouter le boeuf. Bien faire dorer pour le gout bourguignon.",
      "Ajouter les carottes en rondelles et les champignons. Cuire 5-7 min.",
      "Verser le vin rouge et laisser reduire 3-5 min. Ajouter le concentre de tomate, le cube de bouillon dissous dans 200 ml d'eau, le thym et le laurier.",
      "Laisser mijoter 15-20 min a feu doux (essentiel pour developper les saveurs).",
      "Baisser le feu, ajouter la creme legere et le fromage blanc. Melanger doucement sans faire bouillir. Ajouter un peu d'eau de cuisson des pates si besoin.",
      "Incorporer les pates dans la sauce, melanger et laisser 2-3 min. Repartir dans 5 tupperwares. Astuce : une touche de moutarde ou de paprika fume change tout."
    ],
    tags: ['high_protein', 'meal_prep'],
    dietType: ['none'],
    views: 0,
    likes: []
  },
  {
    title: "Burrito Bowl Cremeux Meal Prep",
    slug: "burrito-bowl-cremeux-meal-prep",
    description: "Un burrito bowl gourmand avec patate douce rotie, boeuf epice et une sauce cremeuse au fromage blanc et fromage rape. Gout presque cheat meal mais 100% healthy.",
    image: "https://images.unsplash.com/photo-1543339308-d595c4fced46?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    goal: ['muscle_gain', 'maintenance'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 25,
    totalTime: 40,
    servings: 5,
    nutrition: {
      calories: 3000,
      proteins: 200,
      carbs: 300,
      fats: 83,
      fiber: 40
    },
    ingredients: [
      { name: "Viande hachee 5%", quantity: 500, unit: "g" },
      { name: "Patate douce", quantity: 600, unit: "g" },
      { name: "Haricots rouges (boite)", quantity: 400, unit: "g" },
      { name: "Poivron", quantity: 1, unit: "piece" },
      { name: "Oignon", quantity: 1, unit: "piece" },
      { name: "Fromage blanc 0%", quantity: 200, unit: "g" },
      { name: "Fromage rape (emmental ou mozzarella)", quantity: 30, unit: "g" },
      { name: "Concentre de tomate", quantity: 1, unit: "c. a soupe" },
      { name: "Eau ou lait", quantity: 10, unit: "cl" },
      { name: "Huile", quantity: 2, unit: "c. a soupe" },
      { name: "Paprika", quantity: 1, unit: "c. a cafe" },
      { name: "Cumin", quantity: 1, unit: "c. a cafe" },
      { name: "Piment doux", quantity: 1, unit: "c. a cafe", optional: true },
      { name: "Sel et poivre", quantity: 1, unit: "pincee" }
    ],
    instructions: [
      "Prechauffer le four a 200 degres C. Couper la patate douce en cubes, melanger avec 1 c. a soupe d'huile et des epices. Enfourner 20-25 min jusqu'a obtenir un resultat croustillant et fondant.",
      "Poele chaude + 1 c. a soupe d'huile. Faire revenir l'oignon puis la viande hachee. Bien griller pour le gout.",
      "Ajouter paprika, cumin, sel, poivre. Puis ajouter le poivron coupe et les haricots rouges. Cuire 5-7 min.",
      "Preparer la sauce : dans un bol, melanger fromage blanc, fromage rape, concentre de tomate, epices et un peu d'eau ou lait. La texture doit etre legerement liquide (elle epaissira a la chauffe).",
      "Assembler dans chaque tupperware : patate douce rotie, boeuf epice avec legumes, sauce cremeuse par-dessus (ne pas trop melanger pour un meilleur rendu au rechauffage).",
      "Rechauffage : ajouter 1-2 c. a soupe d'eau, micro-ondes 2-3 min, puis melanger. La sauce devient cremeuse et fondante."
    ],
    tags: ['high_protein', 'meal_prep', 'budget_friendly'],
    dietType: ['none'],
    views: 0,
    likes: []
  },
  {
    title: "Quinoa Cremeux au Poulet et Legumes One Pot Healthy",
    slug: "quinoa-cremeux-poulet-legumes-one-pot",
    description: "Un one pot cremeux au quinoa, poulet et legumes colores. Le quinoa apporte proteines et fibres, la sauce fromage blanc et creme legere rend le tout fondant sans culpabilite.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    goal: ['muscle_gain', 'health', 'maintenance'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'easy',
    prepTime: 10,
    cookTime: 25,
    totalTime: 35,
    servings: 5,
    nutrition: {
      calories: 2750,
      proteins: 200,
      carbs: 288,
      fats: 68,
      fiber: 30
    },
    ingredients: [
      { name: "Quinoa", quantity: 400, unit: "g" },
      { name: "Escalope de poulet ou dinde", quantity: 500, unit: "g" },
      { name: "Legumes (brocoli, carottes, poivrons, petits pois)", quantity: 1000, unit: "g" },
      { name: "Oignon", quantity: 1, unit: "piece" },
      { name: "Ail", quantity: 2, unit: "gousses" },
      { name: "Fromage blanc 0%", quantity: 200, unit: "g" },
      { name: "Creme legere", quantity: 100, unit: "ml" },
      { name: "Concentre de tomate ou sauce tomate", quantity: 1, unit: "c. a soupe" },
      { name: "Huile", quantity: 2, unit: "c. a soupe" },
      { name: "Paprika ou curry doux", quantity: 1, unit: "c. a cafe" },
      { name: "Herbes (persil, coriandre ou basilic)", quantity: 1, unit: "c. a soupe", optional: true },
      { name: "Sel et poivre", quantity: 1, unit: "pincee" }
    ],
    instructions: [
      "Couper le poulet en cubes. Chauffer 1 c. a soupe d'huile dans une poele, ajouter le poulet, l'oignon et l'ail. Bien dorer.",
      "Ajouter les legumes et cuire 5-7 min. Assaisonner avec paprika ou curry, sel et poivre.",
      "Rincer le quinoa et le cuire separement dans l'eau salee pendant 12 min. Egoutter.",
      "Melanger le fromage blanc, la creme legere, le concentre de tomate et les epices. Verser sur le poulet et les legumes, melanger doucement a feu doux.",
      "Incorporer le quinoa cuit dans la preparation cremeuse. Bien melanger pour que tout soit enrobe.",
      "Repartir dans 5 tupperwares. Saupoudrer d'herbes fraiches apres le rechauffage pour plus de fraicheur."
    ],
    tags: ['high_protein', 'meal_prep', 'budget_friendly'],
    dietType: ['none'],
    views: 0,
    likes: []
  },

  // ============================================
  // DESSERTS & SUCRE (par nono)
  // ============================================

  {
    title: "Fondant au Chocolat Healthy",
    slug: "fondant-chocolat-healthy",
    description: "Un fondant au chocolat avec coeur coulant, allege grace a la compote de pomme et l'huile de coco. 30-40% moins calorique qu'un fondant classique mais toujours ultra gourmand.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['health', 'maintenance'],
    mealType: ['snack'],
    category: 'sweet',
    difficulty: 'easy',
    prepTime: 10,
    cookTime: 15,
    totalTime: 25,
    servings: 6,
    nutrition: {
      calories: 1260,
      proteins: 40,
      carbs: 128,
      fats: 78,
      fiber: 10
    },
    ingredients: [
      { name: "Chocolat noir 70%", quantity: 80, unit: "g" },
      { name: "Chocolat au lait", quantity: 50, unit: "g", optional: true },
      { name: "Beurre ou huile de coco", quantity: 50, unit: "g" },
      { name: "Compote de pomme non sucree", quantity: 2, unit: "c. a soupe" },
      { name: "Farine complete ou farine d'avoine", quantity: 45, unit: "g" },
      { name: "Sucre complet (muscovado ou rapadura)", quantity: 50, unit: "g" },
      { name: "Oeufs", quantity: 3, unit: "pieces" },
      { name: "Sel", quantity: 1, unit: "pincee" },
      { name: "Cacao pur non sucre", quantity: 1, unit: "c. a soupe", optional: true }
    ],
    instructions: [
      "Prechauffer le four a 180 degres C.",
      "Faire fondre le chocolat et le beurre (ou huile de coco) au bain-marie ou micro-ondes 30-40 sec.",
      "Melanger les oeufs et le sucre dans un bol jusqu'a ce que le melange blanchisse.",
      "Ajouter le chocolat fondu et la compote de pomme, bien melanger.",
      "Incorporer la farine, le cacao et le sel delicatement.",
      "Verser dans un moule beurre ou chemise de papier cuisson.",
      "Cuire 12-15 min : le dessus doit etre pris mais le coeur fondant. Pour un vrai coeur coulant, sortir a 12 min."
    ],
    tags: ['quick'],
    dietType: ['vegetarian'],
    views: 0,
    likes: []
  },
  {
    title: "Cookies Chocolat Healthy",
    slug: "cookies-chocolat-healthy",
    description: "Des cookies au chocolat fondants avec 40% moins de graisse et 50% moins de sucre que la recette classique. Farine complete et chocolat noir pour un gouter gourmand sans culpabilite.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['health', 'maintenance'],
    mealType: ['snack'],
    category: 'sweet',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 12,
    totalTime: 27,
    servings: 12,
    nutrition: {
      calories: 2700,
      proteins: 66,
      carbs: 264,
      fats: 162,
      fiber: 18
    },
    ingredients: [
      { name: "Chocolat noir", quantity: 150, unit: "g" },
      { name: "Beurre ou huile de coco", quantity: 150, unit: "g" },
      { name: "Oeufs", quantity: 2, unit: "pieces" },
      { name: "Sucre roux", quantity: 100, unit: "g" },
      { name: "Farine complete", quantity: 250, unit: "g" },
      { name: "Levure chimique", quantity: 1, unit: "c. a cafe" },
      { name: "Sel", quantity: 1, unit: "pincee" },
      { name: "Extrait de vanille", quantity: 1, unit: "c. a cafe", optional: true }
    ],
    instructions: [
      "Prechauffer le four a 180 degres C.",
      "Faire fondre le beurre (ou huile de coco) avec le chocolat au bain-marie ou micro-ondes.",
      "Battre les oeufs avec le sucre jusqu'a obtenir un melange legerement mousseux.",
      "Ajouter le chocolat fondu et melanger.",
      "Incorporer la farine, la levure et le sel delicatement.",
      "Former 12 boules et les deposer sur une plaque recouverte de papier cuisson.",
      "Cuire 10-12 min : le centre doit rester legerement mou pour des cookies fondants. Pour plus de croquant, cuire 1-2 min de plus."
    ],
    tags: ['quick', 'family_friendly'],
    dietType: ['vegetarian'],
    views: 0,
    likes: []
  },
  {
    title: "Fluffy aux Fruits Rouges Healthy",
    slug: "fluffy-fruits-rouges-healthy",
    description: "Un dessert aerien et leger a base de blancs en neige, fromage blanc et fruits rouges. Seulement 115-175 kcal par part pour un resultat fondant et gourmand.",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['weight_loss', 'health'],
    mealType: ['snack'],
    category: 'sweet',
    difficulty: 'easy',
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    servings: 3,
    nutrition: {
      calories: 350,
      proteins: 36,
      carbs: 60,
      fats: 15,
      fiber: 6
    },
    ingredients: [
      { name: "Fruits rouges (framboises, myrtilles, fraises)", quantity: 150, unit: "g" },
      { name: "Blancs d'oeufs", quantity: 3, unit: "pieces" },
      { name: "Jaune d'oeuf", quantity: 1, unit: "piece" },
      { name: "Sucre complet ou miel", quantity: 2, unit: "c. a soupe" },
      { name: "Fromage blanc 0%", quantity: 100, unit: "g" },
      { name: "Farine complete ou fecule de mais", quantity: 10, unit: "g" },
      { name: "Vanille liquide", quantity: 1, unit: "c. a cafe" },
      { name: "Amandes effilees", quantity: 10, unit: "g", optional: true }
    ],
    instructions: [
      "Prechauffer le four a 180 degres C.",
      "Monter les blancs en neige avec une pincee de sel jusqu'a ce qu'ils soient bien fermes.",
      "Melanger le jaune d'oeuf, le sucre, la vanille, le fromage blanc et la farine jusqu'a obtenir une pate homogene.",
      "Incorporer delicatement les blancs en neige avec une spatule, en faisant un mouvement de bas en haut pour conserver l'air.",
      "Ajouter les fruits rouges dans la pate (garder quelques-uns pour la decoration).",
      "Verser dans un petit moule ou des ramequins individuels.",
      "Enfourner 15-20 min : le dessus doit etre legerement dore et le centre fondant.",
      "Decorer avec les fruits restants et les amandes effilees. Servir tiede."
    ],
    tags: ['quick', 'low_fat'],
    dietType: ['vegetarian'],
    views: 0,
    likes: []
  },
  {
    title: "Mousse au Chocolat Healthy",
    slug: "mousse-chocolat-healthy",
    description: "La vraie mousse au chocolat classique, allegee : chocolat noir, oeufs et c'est tout. Seulement 135 kcal par part, ultra cremeuse et intense en chocolat.",
    image: "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['weight_loss', 'health'],
    mealType: ['snack'],
    category: 'sweet',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 0,
    totalTime: 15,
    servings: 3,
    nutrition: {
      calories: 400,
      proteins: 27,
      carbs: 45,
      fats: 75,
      fiber: 6
    },
    ingredients: [
      { name: "Chocolat noir 70%", quantity: 100, unit: "g" },
      { name: "Oeufs", quantity: 3, unit: "pieces" },
      { name: "Miel ou sirop d'erable", quantity: 2, unit: "c. a soupe" },
      { name: "Sel", quantity: 1, unit: "pincee" },
      { name: "Cafe soluble", quantity: 1, unit: "c. a cafe", optional: true }
    ],
    instructions: [
      "Faire fondre le chocolat doucement au bain-marie ou micro-ondes (30-40 sec). Laisser tiedir legerement.",
      "Separer les blancs des jaunes.",
      "Melanger les jaunes d'oeufs avec le chocolat fondu et le miel jusqu'a obtenir une texture lisse.",
      "Monter les blancs en neige avec une pincee de sel jusqu'a ce qu'ils soient fermes.",
      "Incorporer delicatement les blancs dans le melange chocolat-jaunes, en soulevant la pate pour garder l'air et la legerete.",
      "Repartir la mousse dans des verrines ou ramequins.",
      "Refrigerer 2-3 heures pour que la mousse prenne bien. Decorer avec fruits rouges ou copeaux de chocolat."
    ],
    tags: ['quick', 'no_sugar'],
    dietType: ['vegetarian'],
    views: 0,
    likes: []
  },

  // ============================================
  // PLATS SALE (par nono)
  // ============================================

  {
    title: "Salade Avocat, Crevettes et Citron",
    slug: "salade-avocat-crevettes-citron",
    description: "Une salade fraiche et legere aux crevettes, avocat et citron. Riche en proteines et bons lipides, parfaite pour un repas rapide et equilibre.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['weight_loss', 'health'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 0,
    totalTime: 15,
    servings: 2,
    nutrition: {
      calories: 700,
      proteins: 50,
      carbs: 35,
      fats: 40,
      fiber: 12
    },
    ingredients: [
      { name: "Crevettes decortiquees cuites", quantity: 200, unit: "g" },
      { name: "Avocat", quantity: 1, unit: "piece" },
      { name: "Citron", quantity: 1, unit: "piece" },
      { name: "Roquette ou jeunes pousses", quantity: 100, unit: "g" },
      { name: "Concombre", quantity: 0.5, unit: "piece" },
      { name: "Tomates cerises", quantity: 8, unit: "pieces" },
      { name: "Huile d'olive extra vierge", quantity: 1, unit: "c. a soupe" },
      { name: "Sel et poivre", quantity: 1, unit: "pincee" },
      { name: "Graines de sesame ou noix concassees", quantity: 1, unit: "c. a soupe", optional: true },
      { name: "Coriandre ou persil frais", quantity: 1, unit: "c. a soupe", optional: true }
    ],
    instructions: [
      "Couper l'avocat en cubes, le concombre en demi-rondelles et les tomates cerises en deux.",
      "Assaisonner les crevettes avec sel, poivre, zestes de citron et un filet de jus de citron.",
      "Preparer la vinaigrette : melanger huile d'olive, jus de citron, sel et poivre.",
      "Dans un saladier, disposer la roquette, le concombre, les tomates et l'avocat.",
      "Ajouter les crevettes, arroser de vinaigrette et saupoudrer de graines ou noix et herbes fraiches."
    ],
    tags: ['quick', 'high_protein', 'low_carb'],
    dietType: ['pescatarian', 'gluten_free'],
    views: 0,
    likes: []
  },
  {
    title: "Poke Bowl Healthy Saumon Teriyaki",
    slug: "poke-bowl-saumon-teriyaki",
    description: "Un poke bowl complet avec saumon teriyaki maison, riz vinaire, avocat, cottage cheese et edamame. Des bons gras, des proteines et un gout incroyable.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['muscle_gain', 'health'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'medium',
    prepTime: 20,
    cookTime: 15,
    totalTime: 35,
    servings: 2,
    nutrition: {
      calories: 1100,
      proteins: 76,
      carbs: 104,
      fats: 44,
      fiber: 12
    },
    ingredients: [
      { name: "Riz japonais ou riz rond", quantity: 200, unit: "g" },
      { name: "Vinaigre de riz", quantity: 2, unit: "c. a soupe" },
      { name: "Miel ou sirop d'erable (pour riz)", quantity: 1, unit: "c. a soupe" },
      { name: "Filet de saumon", quantity: 300, unit: "g" },
      { name: "Sauce soja reduite en sel", quantity: 2, unit: "c. a soupe" },
      { name: "Miel ou sirop d'erable (pour teriyaki)", quantity: 2, unit: "c. a soupe" },
      { name: "Gingembre rape", quantity: 2, unit: "c. a cafe" },
      { name: "Ail emince", quantity: 2, unit: "c. a cafe" },
      { name: "Avocat", quantity: 1, unit: "piece" },
      { name: "Cottage cheese", quantity: 100, unit: "g" },
      { name: "Grains de grenade", quantity: 50, unit: "g" },
      { name: "Edamame cuits", quantity: 100, unit: "g" },
      { name: "Concombre", quantity: 0.5, unit: "piece" },
      { name: "Carotte rapee", quantity: 75, unit: "g" },
      { name: "Oignons frits", quantity: 2, unit: "c. a soupe" },
      { name: "Guacamole maison", quantity: 2, unit: "c. a soupe", optional: true },
      { name: "Sauce sriracha", quantity: 2, unit: "c. a soupe", optional: true }
    ],
    instructions: [
      "Cuire le riz, puis melanger avec le vinaigre de riz, le miel et une pincee de sel. Laisser tiedir.",
      "Melanger sauce soja, miel, gingembre et ail. Mariner le saumon 10-15 min dans cette sauce.",
      "Cuire le saumon 8-10 min a la poele, puis le couper en cubes ou lanieres.",
      "Preparer les garnitures : couper l'avocat et le concombre, raper la carotte, rechauffer les edamame.",
      "Monter les bols : base de riz vinaire, saumon teriyaki, legumes disposes, cottage cheese, grenade.",
      "Parsemer d'oignons frits, ajouter guacamole et sriracha selon le gout."
    ],
    tags: ['high_protein', 'meal_prep'],
    dietType: ['pescatarian'],
    views: 0,
    likes: []
  },
  {
    title: "Pizza Healthy au Poulet et Creme Legere",
    slug: "pizza-healthy-poulet-creme-legere",
    description: "Une pizza maison avec pate au yaourt, base creme legere et garniture poulet-legumes. Seulement 407 kcal par personne pour une pizza complete et gourmande.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['maintenance', 'health'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'medium',
    prepTime: 15,
    cookTime: 20,
    totalTime: 35,
    servings: 2,
    nutrition: {
      calories: 815,
      proteins: 70,
      carbs: 75,
      fats: 27,
      fiber: 8
    },
    ingredients: [
      { name: "Farine complete", quantity: 120, unit: "g" },
      { name: "Yaourt nature 0%", quantity: 60, unit: "g" },
      { name: "Levure chimique", quantity: 1, unit: "c. a cafe" },
      { name: "Sel", quantity: 1, unit: "pincee" },
      { name: "Blanc de poulet cuit et emince", quantity: 150, unit: "g" },
      { name: "Creme fraiche legere ou fromage blanc 0%", quantity: 2, unit: "c. a soupe" },
      { name: "Ail", quantity: 1, unit: "gousse" },
      { name: "Oignon rouge", quantity: 0.5, unit: "piece" },
      { name: "Champignons", quantity: 50, unit: "g", optional: true },
      { name: "Poivron", quantity: 50, unit: "g" },
      { name: "Fromage rape leger", quantity: 40, unit: "g" },
      { name: "Origan et basilic", quantity: 1, unit: "c. a cafe" }
    ],
    instructions: [
      "Melanger farine, levure, sel et herbes sechees. Ajouter le yaourt et petrir jusqu'a obtenir une pate homogene. Ajouter un peu d'eau si necessaire.",
      "Etaler la pate sur une plaque recouverte de papier cuisson (epaisseur environ 0.5 cm).",
      "Melanger creme fraiche ou fromage blanc avec l'ail ecrase, sel et poivre. Etaler uniformement sur la pate.",
      "Disposer le poulet emince, le poivron, les champignons et l'oignon sur la base creme.",
      "Parsemer de fromage rape et d'herbes.",
      "Prechauffer le four a 200 degres C. Cuire 15-20 min jusqu'a ce que la pate soit doree et le fromage fondu."
    ],
    tags: ['high_protein', 'budget_friendly'],
    dietType: ['none'],
    views: 0,
    likes: []
  },
  {
    title: "Tacos Poulet Cremeux, Frites et Ricotta",
    slug: "tacos-poulet-cremeux-frites-ricotta",
    description: "Des tacos gourmands avec poulet cremeux a la ricotta, frites au four croustillantes et legumes frais. Environ 280 kcal par taco, bien moins calorique qu'un taco classique.",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['maintenance', 'muscle_gain'],
    mealType: ['lunch', 'dinner'],
    category: 'salty',
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 25,
    totalTime: 40,
    servings: 4,
    nutrition: {
      calories: 1110,
      proteins: 72,
      carbs: 108,
      fats: 44,
      fiber: 8
    },
    ingredients: [
      { name: "Blanc de poulet", quantity: 200, unit: "g" },
      { name: "Ricotta", quantity: 50, unit: "g" },
      { name: "Creme fraiche legere", quantity: 2, unit: "c. a soupe" },
      { name: "Ail", quantity: 1, unit: "gousse" },
      { name: "Paprika", quantity: 1, unit: "c. a cafe" },
      { name: "Pommes de terre", quantity: 200, unit: "g" },
      { name: "Huile d'olive", quantity: 1, unit: "c. a soupe" },
      { name: "Tortillas completes", quantity: 4, unit: "pieces" },
      { name: "Roquette", quantity: 50, unit: "g" },
      { name: "Tomate", quantity: 1, unit: "piece" },
      { name: "Emmental rape", quantity: 40, unit: "g" },
      { name: "Oignon rouge", quantity: 0.5, unit: "piece" },
      { name: "Sel et poivre", quantity: 1, unit: "pincee" }
    ],
    instructions: [
      "Prechauffer le four a 200 degres C. Couper les pommes de terre en batonnets, melanger avec l'huile, sel et paprika. Cuire 20-25 min en retournant a mi-cuisson.",
      "Couper le poulet en petits morceaux. Poeler jusqu'a ce qu'il soit dore.",
      "Ajouter la ricotta, la creme, l'ail, sel, poivre et paprika. Cuire 2-3 min jusqu'a texture cremeuse.",
      "Faire revenir l'oignon emince dans une poele avec un peu d'huile jusqu'a ce qu'il soit dore et fondant.",
      "Rechauffer les tortillas si necessaire. Etaler le poulet cremeux, ajouter quelques frites, tomate en des, roquette, emmental et oignon grille.",
      "Replier et servir immediatement."
    ],
    tags: ['high_protein', 'family_friendly'],
    dietType: ['none'],
    views: 0,
    likes: []
  },
  {
    title: "Pancakes Healthy a la Whey Vanille",
    slug: "pancakes-healthy-whey-vanille",
    description: "Des pancakes moelleux et riches en proteines grace a la whey vanille. Seulement 300 kcal pour 4 pancakes avec 25 g de proteines, parfaits pour un petit-dejeuner sportif.",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
    isPremium: false,
    isPublished: true,
    isOfficial: true,
    _assignAuthor: 'nono',
    goal: ['muscle_gain', 'performance'],
    mealType: ['breakfast', 'snack'],
    category: 'sweet',
    difficulty: 'easy',
    prepTime: 5,
    cookTime: 10,
    totalTime: 15,
    servings: 2,
    nutrition: {
      calories: 300,
      proteins: 25,
      carbs: 30,
      fats: 7,
      fiber: 4
    },
    ingredients: [
      { name: "Farine complete", quantity: 70, unit: "g" },
      { name: "Whey vanille", quantity: 30, unit: "g" },
      { name: "Levure chimique", quantity: 1, unit: "c. a cafe" },
      { name: "Sel", quantity: 1, unit: "pincee" },
      { name: "Oeuf", quantity: 1, unit: "piece" },
      { name: "Lait (vache ou vegetal)", quantity: 135, unit: "ml" },
      { name: "Huile de coco fondue", quantity: 1, unit: "c. a soupe" },
      { name: "Fruits rouges ou banane (topping)", quantity: 50, unit: "g", optional: true },
      { name: "Sirop d'erable leger", quantity: 1, unit: "c. a soupe", optional: true }
    ],
    instructions: [
      "Melanger les ingredients secs : farine, whey, levure et sel dans un bol.",
      "Melanger les ingredients liquides : oeuf, lait et huile.",
      "Incorporer les liquides aux secs et melanger jusqu'a obtenir une pate lisse. Ajuster le lait si necessaire (pate epaisse mais coulante).",
      "Chauffer une poele antiadhesive legerement huilee.",
      "Verser une petite louche de pate pour chaque pancake. Cuire 2-3 min de chaque cote, jusqu'a ce que des bulles apparaissent et que le dessous soit dore.",
      "Servir chaud avec fruits, yaourt ou un filet de sirop d'erable."
    ],
    tags: ['quick', 'high_protein'],
    dietType: ['vegetarian'],
    views: 0,
    likes: []
  }
];

async function seedRecipes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecte a MongoDB');

    // Chercher l'utilisateur "nono" pour assigner comme auteur
    const nono = await User.findOne({ pseudo: 'nono' });
    if (nono) {
      console.log(`Auteur trouve : ${nono.pseudo} (${nono._id})`);
    } else {
      console.log('Auteur "nono" non trouve en base, les recettes marquees _assignAuthor seront sans auteur');
    }

    // Inserer seulement les recettes dont le slug n'existe pas deja
    let inserted = 0;
    for (const recipe of recipes) {
      const exists = await Recipe.findOne({ slug: recipe.slug });
      if (!exists) {
        // Assigner l'auteur si marque
        if (recipe._assignAuthor && nono) {
          recipe.author = nono._id;
        }
        delete recipe._assignAuthor;
        await Recipe.create(recipe);
        console.log(`  + ${recipe.title}`);
        inserted++;
      } else {
        console.log(`  = ${recipe.title} (deja presente)`);
      }
    }

    console.log(`${inserted} nouvelles recettes ajoutees (${recipes.length - inserted} deja presentes)`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedRecipes();
