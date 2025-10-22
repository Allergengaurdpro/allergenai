// Canadian Priority Food Allergens
// Based on Health Canada and CFIA regulations (as of 2024)
// Source: Food Allergy Canada & Health Canada
//
// These are the 11 priority allergens that account for 90% of allergic reactions in Canada.
// Federal regulations require these allergens to be clearly declared on food labels.
// Reference: Canada Food and Drug Regulations (Enhanced Labelling, 2012)

export const CANADIAN_ALLERGENS = [
  {
    name: 'Peanuts',
    keywords: [
      'peanut', 'peanuts', 'groundnut', 'ground nut', 'arachis', 'monkey nut',
      'peanut oil', 'peanut butter', 'peanut flour', 'peanut protein'
    ],
    priority: 'high'
  },
  {
    name: 'Tree Nuts',
    keywords: [
      'almond', 'almonds', 'brazil nut', 'brazil nuts', 'cashew', 'cashews',
      'hazelnut', 'hazelnuts', 'filbert', 'filberts', 'macadamia', 'macadamias',
      'pecan', 'pecans', 'pine nut', 'pine nuts', 'pignolia', 'pinon',
      'pistachio', 'pistachios', 'walnut', 'walnuts', 'butternut', 'butternuts',
      'chestnut', 'chestnuts', 'hickory nut', 'hickory nuts',
      'tree nut', 'tree nuts', 'nut', 'nuts'
    ],
    priority: 'high'
  },
  {
    name: 'Milk',
    keywords: [
      'milk', 'dairy', 'lactose', 'casein', 'caseinate', 'whey', 'butter',
      'cream', 'cheese', 'yogurt', 'yoghurt', 'ghee', 'buttermilk',
      'milk powder', 'milk solids', 'skim milk', 'whole milk', 'condensed milk',
      'evaporated milk', 'curds', 'custard', 'pudding', 'ice cream',
      'lactalbumin', 'lactoglobulin', 'lactoferrin', 'rennet', 'kefir'
    ],
    priority: 'high'
  },
  {
    name: 'Eggs',
    keywords: [
      'egg', 'eggs', 'albumin', 'albumen', 'ovalbumin', 'ovotransferrin',
      'lysozyme', 'mayonnaise', 'egg white', 'egg yolk', 'egg powder',
      'dried egg', 'egg solids', 'meringue', 'globulin', 'livetin',
      'ovovitellin', 'vitellin', 'eggnog'
    ],
    priority: 'high'
  },
  {
    name: 'Fish',
    keywords: [
      'fish', 'anchovy', 'anchovies', 'bass', 'catfish', 'cod', 'flounder',
      'grouper', 'haddock', 'hake', 'halibut', 'herring', 'mahi mahi', 'mahi-mahi',
      'perch', 'pike', 'pollock', 'salmon', 'sardine', 'sardines', 'sole',
      'snapper', 'swordfish', 'tilapia', 'trout', 'tuna', 'turbot', 'mackerel',
      'fish sauce', 'fish oil', 'fish stock', 'surimi', 'imitation crab'
    ],
    priority: 'high'
  },
  {
    name: 'Shellfish',
    keywords: [
      'shellfish', 'crustacean', 'crustaceans', 'crab', 'crayfish', 'crawfish',
      'lobster', 'prawn', 'prawns', 'shrimp', 'shrimps', 'clam', 'clams',
      'mussel', 'mussels', 'oyster', 'oysters', 'scallop', 'scallops',
      'mollusc', 'mollusk', 'molluscs', 'mollusks', 'cuttlefish', 'squid',
      'octopus', 'abalone', 'cockle', 'periwinkle', 'sea urchin', 'barnacle'
    ],
    priority: 'high'
  },
  {
    name: 'Soy',
    keywords: [
      'soy', 'soya', 'soybean', 'soybeans', 'soy bean', 'soy beans',
      'edamame', 'tofu', 'tempeh', 'miso', 'natto', 'soy sauce', 'tamari',
      'soy lecithin', 'lecithin', 'soy protein', 'soy flour', 'soy milk',
      'soy oil', 'textured vegetable protein', 'tvp', 'hydrolyzed soy protein'
    ],
    priority: 'high'
  },
  {
    name: 'Wheat',
    keywords: [
      // English keywords
      'wheat', 'wheat flour', 'whole wheat', 'gluten', 'wheat gluten',
      'semolina', 'durum', 'spelt', 'kamut', 'bulgur', 'couscous', 'farina',
      'graham', 'graham flour', 'triticale', 'wheat bran', 'wheat germ',
      'wheat starch', 'vital wheat gluten', 'seitan', 'fu', 'wheat protein',
      'enriched flour', 'all-purpose flour', 'bread flour', 'cake flour',
      // French keywords (Blé = Wheat)
      'blé', 'ble', 'farine de blé', 'farine de ble', 'gluten de blé', 'gluten de ble',
      'amidon de blé', 'son de blé', 'germe de blé', 'protéine de blé', 'proteine de ble',
      'semoule de blé', 'farine enrichie'
    ],
    priority: 'high'
  },
  {
    name: 'Sesame',
    keywords: [
      'sesame', 'sesame seed', 'sesame seeds', 'tahini', 'tahina',
      'sesame oil', 'sesame paste', 'sesamol', 'sesamolin', 'til',
      'benne', 'benne seed', 'gingelly', 'simsim', 'halvah', 'halva'
    ],
    priority: 'high'
  },
  {
    name: 'Mustard',
    keywords: [
      'mustard', 'mustard seed', 'mustard seeds', 'mustard oil', 'mustard flour',
      'mustard powder', 'dijon mustard', 'yellow mustard', 'brown mustard',
      'black mustard', 'mustard greens'
    ],
    priority: 'medium'
  },
  {
    name: 'Sulphites',
    keywords: [
      'sulphite', 'sulphites', 'sulfite', 'sulfites', 'sulfur dioxide',
      'sulphur dioxide', 'potassium bisulfite', 'potassium bisulphite',
      'sodium bisulfite', 'sodium bisulphite', 'sodium metabisulfite',
      'sodium metabisulphite', 'potassium metabisulfite', 'sodium sulfite',
      'sodium sulphite', 'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228'
    ],
    priority: 'medium'
  }
];

// Detect allergens from ingredient text
export const detectAllergens = (ingredientText) => {
  if (!ingredientText) return [];

  const text = ingredientText.toLowerCase();
  const detectedAllergens = new Map(); // Use Map to avoid duplicates
  const detectionLog = [];

  // First, extract and prioritize the "Contains:" statement
  const containsStatement = extractAllergenStatement(text);

  CANADIAN_ALLERGENS.forEach(allergen => {
    let foundInContains = false;
    let foundInIngredients = false;
    let matchedKeywords = [];

    // Check in "Contains:" statement first (higher priority)
    if (containsStatement) {
      const containsMatch = allergen.keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s*')}\\b`, 'i');
        if (regex.test(containsStatement)) {
          matchedKeywords.push(keyword);
          return true;
        }
        return false;
      });

      if (containsMatch) {
        foundInContains = true;
      }
    }

    // Check in full ingredient text
    const ingredientMatch = allergen.keywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s*')}\\b`, 'i');
      if (regex.test(text)) {
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
        return true;
      }
      return false;
    });

    if (ingredientMatch) {
      foundInIngredients = true;
    }

    // If found in either location, add to detected list
    if (foundInContains || foundInIngredients) {
      detectedAllergens.set(allergen.name, {
        name: allergen.name,
        priority: allergen.priority,
        detected: true,
        foundInContains,
        foundInIngredients,
        matchedKeywords: matchedKeywords.slice(0, 3) // Keep first 3 matches for reference
      });

      detectionLog.push({
        allergen: allergen.name,
        source: foundInContains ? 'Contains statement' : 'Ingredients list',
        keywords: matchedKeywords.slice(0, 3)
      });
    }
  });

  // Log detection results for debugging
  if (detectionLog.length > 0) {
    console.log('🔍 Allergen Detection Results:');
    detectionLog.forEach(log => {
      console.log(`  ⚠️ ${log.allergen} (${log.source}) - matched: ${log.keywords.join(', ')}`);
    });
  }

  return Array.from(detectedAllergens.values());
};

// Extract allergen statement from ingredient text
export const extractAllergenStatement = (ingredientText) => {
  if (!ingredientText) return null;

  const text = ingredientText.toLowerCase();

  // Multiple patterns to catch various "Contains" statements
  const patterns = [
    /contains?:?\s*([^.\n]+(?:\.[^.\n]+)*)/i,  // Contains: ... (multi-sentence)
    /may contain:?\s*([^.\n]+)/i,              // May contain: ...
    /allergen(?:s)?:?\s*([^.\n]+)/i,          // Allergens: ...
    /allergy information:?\s*([^.\n]+)/i,      // Allergy information: ...
    /contains? traces? of:?\s*([^.\n]+)/i,     // Contains traces of: ...
    /allergen statement:?\s*([^.\n]+)/i,       // Allergen statement: ...
    /allergen\(s\):?\s*([^.\n]+)/i,           // Allergen(s): ...
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const statement = match[1].trim();
      console.log(`📋 Found allergen statement: "${statement}"`);
      return statement;
    }
  }

  return null;
};

// Generate allergen warning level
export const getAllergenWarningLevel = (allergens) => {
  if (allergens.length === 0) return 'none';

  const hasHighPriority = allergens.some(a => a.priority === 'high');

  if (hasHighPriority && allergens.length >= 3) return 'severe';
  if (hasHighPriority) return 'high';
  if (allergens.length >= 2) return 'medium';
  return 'low';
};

// Format allergens for display
export const formatAllergensDisplay = (allergens) => {
  if (allergens.length === 0) return 'No allergens detected';

  return allergens.map(a => a.name).join(', ');
};

// Get allergen icon/emoji
export const getAllergenIcon = (allergenName) => {
  const icons = {
    'Peanuts': '🥜',
    'Tree Nuts': '🌰',
    'Milk': '🥛',
    'Eggs': '🥚',
    'Fish': '🐟',
    'Shellfish': '🦐',
    'Soy': '🫘',
    'Wheat': '🌾',
    'Sesame': '🫘',
    'Mustard': '🌭',
    'Sulphites': '⚗️'
  };

  return icons[allergenName] || '⚠️';
};

// Get detailed allergen information for education
export const getAllergenInfo = (allergenName) => {
  const info = {
    'Peanuts': {
      icon: '🥜',
      description: 'One of the most common and severe food allergens. Can cause anaphylaxis.',
      commonSources: ['Peanut butter', 'Peanut oil', 'Ground nuts', 'Mixed nuts', 'Baked goods'],
      severity: 'Very High',
      prevalence: 'Affects 1-2% of Canadian children'
    },
    'Tree Nuts': {
      icon: '🌰',
      description: 'Includes almonds, cashews, walnuts, hazelnuts, pecans, pistachios, Brazil nuts, macadamia nuts, and pine nuts.',
      commonSources: ['Nut butters', 'Trail mix', 'Granola', 'Baked goods', 'Nut oils'],
      severity: 'Very High',
      prevalence: 'Common cause of anaphylaxis'
    },
    'Milk': {
      icon: '🥛',
      description: 'Most common food allergy in young children. Includes all dairy products and derivatives.',
      commonSources: ['Butter', 'Cheese', 'Yogurt', 'Whey', 'Casein', 'Cream', 'Ice cream'],
      severity: 'High',
      prevalence: 'Most common in children under 3'
    },
    'Eggs': {
      icon: '🥚',
      description: 'Common childhood allergy. Often outgrown by school age.',
      commonSources: ['Baked goods', 'Mayonnaise', 'Pasta', 'Meringue', 'Albumin'],
      severity: 'High',
      prevalence: 'Affects 1-2% of young children'
    },
    'Fish': {
      icon: '🐟',
      description: 'All types of fish. Usually persists throughout life.',
      commonSources: ['Fish sauce', 'Fish oil', 'Surimi', 'Worcestershire sauce', 'Caesar dressing'],
      severity: 'High',
      prevalence: 'More common in adults'
    },
    'Shellfish': {
      icon: '🦐',
      description: 'Includes crustaceans (shrimp, crab, lobster) and molluscs (clams, oysters, mussels).',
      commonSources: ['Seafood dishes', 'Fish stock', 'Surimi', 'Asian cuisine'],
      severity: 'Very High',
      prevalence: 'Most common adult food allergy'
    },
    'Soy': {
      icon: '🫘',
      description: 'Common in processed foods. Soy lecithin is often tolerated.',
      commonSources: ['Tofu', 'Soy sauce', 'Soy lecithin', 'Edamame', 'Textured vegetable protein'],
      severity: 'Moderate',
      prevalence: 'Common in children, often outgrown'
    },
    'Wheat': {
      icon: '🌾',
      description: 'Includes all wheat varieties and triticale. Different from celiac disease.',
      commonSources: ['Bread', 'Pasta', 'Flour', 'Semolina', 'Couscous', 'Seitan'],
      severity: 'Moderate to High',
      prevalence: 'Common in children'
    },
    'Sesame': {
      icon: '🫘',
      description: 'Increasingly recognized allergen. Can cause severe reactions.',
      commonSources: ['Tahini', 'Hummus', 'Sesame oil', 'Sesame seeds', 'Halvah'],
      severity: 'High',
      prevalence: 'Growing concern in Canada'
    },
    'Mustard': {
      icon: '🌭',
      description: 'Priority allergen unique to Canada and Europe.',
      commonSources: ['Mustard condiments', 'Salad dressings', 'Mayonnaise', 'Pickles', 'Curry'],
      severity: 'Moderate',
      prevalence: 'More common in Canada than US'
    },
    'Sulphites': {
      icon: '⚗️',
      description: 'Food additives and preservatives. Must be declared when ≥10 ppm.',
      commonSources: ['Dried fruits', 'Wine', 'Pickled foods', 'Processed potatoes', 'Baked goods'],
      severity: 'Moderate',
      prevalence: 'Can trigger asthma symptoms'
    }
  };

  return info[allergenName] || null;
};

// Check if product is safe for specific allergies
export const isSafeForAllergies = (productAllergens, userAllergies) => {
  if (!userAllergies || userAllergies.length === 0) return true;

  return !productAllergens.some(allergen =>
    userAllergies.includes(allergen.name)
  );
};
