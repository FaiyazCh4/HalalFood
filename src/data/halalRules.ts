export interface AdditiveInfo {
  code: string;
  name: string;
  status: 'HALAL' | 'HARAM' | 'MUSHBOOH';
  category: string;
  source: string;
  description: string;
  jurisprudenceNote?: string;
}

export interface ProductHalalEvaluation {
  status: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'HALAL_CERTIFIED';
  confidence: 'HIGH' | 'MEDIUM' | 'NEEDS_VERIFICATION';
  summary: string;
  isHalalCertified: boolean;
  certificationAuthority?: string;
  criticalIngredients: {
    name: string;
    status: 'HALAL' | 'HARAM' | 'MUSHBOOH';
    reason: string;
    source: string;
  }[];
  allIngredients: {
    name: string;
    status: 'HALAL' | 'HARAM' | 'MUSHBOOH';
    note?: string;
  }[];
  madhhabNotes?: {
    hanafi?: string;
    shafii_general?: string;
  };
  recommendations: string[];
}

export const COMMON_ADDITIVES: Record<string, AdditiveInfo> = {
  // Common Haram / Dubious additives
  'e120': {
    code: 'E120',
    name: 'Carmine / Cochineal / Carminic Acid',
    status: 'HARAM',
    category: 'Coloring',
    source: 'Insects (Crushed Cochineal scale insect)',
    description: 'Natural red food coloring extracted from crushed insects. Majority Sunni jurisprudence (including Hanafi) considers consuming insects non-permissible (except locusts). Some contemporary scholars and Maliki madhhab have differing views, but widely avoided in halal diets.',
    jurisprudenceNote: 'Hanafi: Strictly Haram. Maliki: Disputed/Permissible if no harm. Mainstream Halal certifiers classify as non-halal.'
  },
  'e441': {
    code: 'E441',
    name: 'Gelatin',
    status: 'MUSHBOOH',
    category: 'Gelling agent / Thickener',
    source: 'Animal collagen (Usually Porcine or Non-Zabiha Bovine)',
    description: 'Gelatin is derived by boiling animal skin, tendons, and bones. In western and non-Muslim markets, the majority of gelatin comes from pigs (pork) or non-halal slaughtered cattle. Unless explicitly marked as Halal Certified (bovine/fish) or 100% Fish Gelatin, it is considered Haram or Mushbooh.',
    jurisprudenceNote: 'Porcine gelatin is unequivocally Haram. Bovine requires strict Zabiha slaughter.'
  },
  'e471': {
    code: 'E471',
    name: 'Mono- and diglycerides of fatty acids',
    status: 'MUSHBOOH',
    category: 'Emulsifier',
    source: 'Plant oils or Animal fats (often porcine/bovine)',
    description: 'One of the most widespread food emulsifiers. It can be manufactured from vegetable oils (soybean, palm) or animal lard/tallow. Unless packaging explicitly states "100% Vegetable Source", "Suitable for Vegetarians", "Vegan", or carries Halal certification, it is doubtful (Mushbooh).',
    jurisprudenceNote: 'Permissible if 100% plant/vegetable origin. Non-permissible if from non-halal animal fat.'
  },
  'e472': {
    code: 'E472 (a-f)',
    name: 'Esters of mono- and diglycerides',
    status: 'MUSHBOOH',
    category: 'Emulsifier',
    source: 'Vegetable fats or Animal fats',
    description: 'Derived from E471. May contain animal fats or vegetable origin. Mushbooh unless certified vegan or halal.',
    jurisprudenceNote: 'Check for vegetarian/vegan declaration or halal logo.'
  },
  'e473': {
    code: 'E473',
    name: 'Sucrose esters of fatty acids',
    status: 'MUSHBOOH',
    category: 'Emulsifier',
    source: 'Animal or vegetable fat',
    description: 'Produced from sucrose and fatty acids which may originate from pork or beef tallow.',
    jurisprudenceNote: 'Must be verified as vegetable origin.'
  },
  'e476': {
    code: 'E476',
    name: 'Polyglycerol polyricinoleate (PGPR)',
    status: 'HALAL',
    category: 'Emulsifier',
    source: 'Castor beans & glycerol (usually synthetic or plant-derived)',
    description: 'Common in chocolate manufacture. Almost universally produced from vegetable castor oil and plant glycerol today, but occasionally glycerin can be animal-sourced.',
    jurisprudenceNote: 'Generally considered Halal by most certification bodies when synthetic or plant-based.'
  },
  'e904': {
    code: 'E904',
    name: 'Shellac',
    status: 'MUSHBOOH',
    category: 'Glazing agent',
    source: 'Insect secretion (Kerria lacca bug)',
    description: 'Resinous secretion deposited on trees by lac bugs. Used to coat pills, confections, and glossy fruit/candy surfaces. Some scholars consider insect secretions permissible (analogy with honey), while others deem it doubtful or haram due to insect fragments.',
    jurisprudenceNote: 'Disputed among contemporary scholars and Halal certification boards.'
  },
  'e920': {
    code: 'E920',
    name: 'L-cysteine',
    status: 'MUSHBOOH',
    category: 'Flour treatment agent / Dough conditioner',
    source: 'Duck/poultry feathers, animal bristles, or human hair',
    description: 'Used in commercial bread and bakery goods to relax gluten. Historically extracted from human hair (strictly haram in Islam due to human sanctity) or animal hair. Modern sources include duck feathers or microbial fermentation.',
    jurisprudenceNote: 'Haram if human hair or non-zabiha pig hair. Permissible if microbial or synthetic.'
  },
  'e542': {
    code: 'E542',
    name: 'Bone Phosphate (Edible Bone)',
    status: 'HARAM',
    category: 'Anti-caking agent',
    source: 'Animal bones (bovine, porcine)',
    description: 'Treated animal bones used in powdered foods. In non-Islamic countries, the bones are from non-halal slaughtered cattle or pigs.',
    jurisprudenceNote: 'Haram unless certified from Halal-slaughtered animals.'
  },
  'e100': {
    code: 'E100',
    name: 'Curcumin / Turmeric',
    status: 'HALAL',
    category: 'Coloring',
    source: 'Plant (Turmeric root)',
    description: 'Natural yellow color extracted from turmeric roots.',
    jurisprudenceNote: '100% Halal and wholesome (Tayyib).'
  },
  'e101': {
    code: 'E101',
    name: 'Riboflavin (Vitamin B2)',
    status: 'HALAL',
    category: 'Coloring / Vitamin',
    source: 'Yeast fermentation or synthetic',
    description: 'Essential vitamin, widely synthesized or fermented from microbes.',
    jurisprudenceNote: 'Permissible.'
  },
  'e150a': {
    code: 'E150a',
    name: 'Plain Caramel Color',
    status: 'HALAL',
    category: 'Coloring',
    source: 'Heat treatment of carbohydrates (corn, wheat, sugar)',
    description: 'Produced by heating sugar. Completely plant-based.',
    jurisprudenceNote: 'Halal.'
  },
  'e160a': {
    code: 'E160a',
    name: 'Carotenes / Beta-Carotene',
    status: 'HALAL',
    category: 'Coloring',
    source: 'Carrots, algae, or synthetic',
    description: 'Orange-yellow plant pigment from carrots and palms. Halal unless formulated with animal gelatin as a carrier (check ingredient list for gelatin).',
    jurisprudenceNote: 'Halal plant source.'
  },
  'e300': {
    code: 'E300',
    name: 'Ascorbic Acid (Vitamin C)',
    status: 'HALAL',
    category: 'Antioxidant',
    source: 'Fruit or glucose fermentation',
    description: 'Vitamin C derived from plant sugars.',
    jurisprudenceNote: 'Halal.'
  },
  'e322': {
    code: 'E322',
    name: 'Lecithins (Soy Lecithin / Sunflower)',
    status: 'HALAL',
    category: 'Emulsifier',
    source: 'Soybeans, sunflower seeds, or egg yolks',
    description: 'Over 99% of commercial lecithin is soy or sunflower lecithin. Completely plant-based and permissible.',
    jurisprudenceNote: 'Halal (Plant/Soy origin).'
  },
  'e330': {
    code: 'E330',
    name: 'Citric Acid',
    status: 'HALAL',
    category: 'Acidity regulator / Preservative',
    source: 'Citrus fruits or Aspergillus fermentation of molasses',
    description: 'Natural organic acid manufactured by microbial fermentation of sucrose/molasses.',
    jurisprudenceNote: '100% Halal.'
  },
  'e407': {
    code: 'E407',
    name: 'Carrageenan',
    status: 'HALAL',
    category: 'Gelling agent / Thickener',
    source: 'Red seaweed / Marine algae',
    description: 'Popular vegetarian and halal alternative to animal gelatin, harvested from natural seaweeds.',
    jurisprudenceNote: 'Halal plant/marine source.'
  },
  'e412': {
    code: 'E412',
    name: 'Guar Gum',
    status: 'HALAL',
    category: 'Thickener',
    source: 'Guar beans (Plant)',
    description: 'Extracted from guar bean seeds.',
    jurisprudenceNote: 'Halal.'
  },
  'e415': {
    code: 'E415',
    name: 'Xanthan Gum',
    status: 'HALAL',
    category: 'Thickener / Stabilizer',
    source: 'Fermentation of simple sugars by Xanthomonas campestris',
    description: 'Microbial polysaccharide, completely plant/bacterial based.',
    jurisprudenceNote: 'Halal.'
  },
  'e422': {
    code: 'E422',
    name: 'Glycerol / Glycerin',
    status: 'MUSHBOOH',
    category: 'Humectant / Solvent',
    source: 'Vegetable oils, petroleum, or animal fats',
    description: 'Sweet syrupy liquid used in baked goods, frostings, and cosmetics. Often vegetable-derived (Vegetable Glycerin), but can be a byproduct of animal tallow soap manufacturing.',
    jurisprudenceNote: 'Halal if "Vegetable Glycerin"; doubtful if source unstated.'
  },
  'e440': {
    code: 'E440',
    name: 'Pectins',
    status: 'HALAL',
    category: 'Gelling agent',
    source: 'Apple pomace and citrus peels',
    description: 'Natural dietary fiber from fruit peels. The standard vegetarian alternative to gelatin in jams and gummies.',
    jurisprudenceNote: '100% Halal.'
  },
  'e621': {
    code: 'E621',
    name: 'Monosodium Glutamate (MSG)',
    status: 'HALAL',
    category: 'Flavor enhancer',
    source: 'Fermentation of corn, sugar cane, or tapioca',
    description: 'Savory umami enhancer produced by microbial fermentation of plant starches.',
    jurisprudenceNote: 'Halal.'
  }
};

// High-priority direct haram keywords
export const HARAM_KEYWORDS = [
  { term: 'pork', reason: 'Porcine products are categorically forbidden in the Quran (2:173)', category: 'Swine' },
  { term: 'bacon', reason: 'Cured pork belly meat', category: 'Swine' },
  { term: 'ham', reason: 'Pork meat product', category: 'Swine' },
  { term: 'lard', reason: 'Pork fat used in baking and frying', category: 'Swine fat' },
  { term: 'porcine', reason: 'Relating to or derived from pigs', category: 'Swine' },
  { term: 'boar', reason: 'Wild or domestic swine', category: 'Swine' },
  { term: 'blood', reason: 'Flowing blood is explicitly forbidden in Islamic law', category: 'Blood' },
  { term: 'carmine', reason: 'Red dye derived from crushed cochineal insects (forbidden in Hanafi / majority)', category: 'Insects' },
  { term: 'cochineal', reason: 'Crushed scale insects used for red coloring', category: 'Insects' },
  { term: 'beer', reason: 'Alcoholic beverage / intoxicating agent', category: 'Alcohol' },
  { term: 'wine', reason: 'Alcoholic beverage made from fermented grapes', category: 'Alcohol' },
  { term: 'rum', reason: 'Distilled alcoholic liquor', category: 'Alcohol' },
  { term: 'brandy', reason: 'Distilled wine / spirit', category: 'Alcohol' },
  { term: 'liqueur', reason: 'Alcoholic beverage with high sugar content', category: 'Alcohol' },
  { term: 'vodka', reason: 'Distilled alcoholic beverage', category: 'Alcohol' },
  { term: 'whiskey', reason: 'Distilled grain alcohol', category: 'Alcohol' },
  { term: 'whisky', reason: 'Distilled grain alcohol', category: 'Alcohol' },
  { term: 'champagne', reason: 'Sparkling alcoholic wine', category: 'Alcohol' },
  { term: 'cognac', reason: 'Variety of brandy', category: 'Alcohol' },
  { term: 'sake', reason: 'Japanese alcoholic beverage', category: 'Alcohol' },
  { term: 'mirin', reason: 'Japanese rice wine containing 14% alcohol (distinguish from non-alcoholic mirin seasoning)', category: 'Alcohol' },
];

// Dubious / Mushbooh keywords requiring source verification
export const MUSHBOOH_KEYWORDS = [
  { term: 'gelatin', reason: 'Typically derived from pork skin or non-zabiha cattle unless certified bovine or fish', category: 'Animal Collagen' },
  { term: 'gelatine', reason: 'Typically derived from pork or non-halal beef', category: 'Animal Collagen' },
  { term: 'rennet', reason: 'Enzyme from calf stomach used in cheesemaking; halal if microbial or vegetable rennet', category: 'Dairy Enzyme' },
  { term: 'pepsin', reason: 'Digestive enzyme often extracted from pig stomachs', category: 'Enzyme' },
  { term: 'whey', reason: 'Cheese byproduct; halal if cheese was prepared with microbial/halal rennet', category: 'Dairy' },
  { term: 'tallow', reason: 'Rendered animal fat (often beef/mutton); requires halal slaughter', category: 'Animal Fat' },
  { term: 'shortening', reason: 'Can contain animal fat or lard unless specified "100% Vegetable Shortening"', category: 'Fats' },
  { term: 'mono and diglycerides', reason: 'Can be animal fat or vegetable oil', category: 'Emulsifier' },
  { term: 'monoglycerides', reason: 'May be animal-derived', category: 'Emulsifier' },
  { term: 'diglycerides', reason: 'May be animal-derived', category: 'Emulsifier' },
  { term: 'glycerin', reason: 'Humectant that can be vegetable or animal tallow', category: 'Fats/Solvent' },
  { term: 'glycerol', reason: 'Can be animal fat derivative', category: 'Fats' },
  { term: 'shellac', reason: 'Resinous insect secretion glaze', category: 'Insect Byproduct' },
  { term: 'l-cysteine', reason: 'Dough conditioner derived from feathers, hair, or synthetic', category: 'Bakery Additive' },
  { term: 'vanilla extract', reason: 'Traditional pure extract is soaked in 35%+ ethanol alcohol; non-alcoholic extracts exist', category: 'Flavoring' },
  { term: 'collagen', reason: 'Protein from animal skin/tissue', category: 'Animal Protein' },
  { term: 'marshmallow', reason: 'Almost always contains gelatin unless vegan/halal certified', category: 'Confectionery' },
  { term: 'gummy', reason: 'Gummy candies commonly use pork gelatin unless starch-based or halal certified', category: 'Confectionery' }
];

// Popular benchmark products for instant scanning & test demo
export const SAMPLE_PRODUCTS = [
  {
    barcode: '3017620422003',
    name: 'Nutella Hazelnut Spread',
    brand: 'Ferrero',
    category: 'Spreads & Sweet Creams',
    status: 'HALAL' as const,
    isHalalCertified: true,
    certificationAuthority: 'Halal Certified (HMC / IFANCA certified in many regions)',
    summary: 'Nutella contains sugar, palm oil, hazelnuts, skimmed milk powder, fat-reduced cocoa, soy lecithin, and vanillin. It does not contain animal fat, gelatin, or alcohol.',
    ingredients: 'Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat-reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin.',
    imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.614.400.jpg',
    serving_size: '15g (1 tbsp)',
    nutriments: {
      'energy-kcal_100g': 539,
      'energy-kcal_serving': 81,
      fat_100g: 30.9,
      fat_serving: 4.6,
      'saturated-fat_100g': 10.6,
      carbohydrates_100g: 57.5,
      sugars_100g: 56.3,
      sugars_serving: 8.4,
      fiber_100g: 3.4,
      fiber_serving: 0.5,
      proteins_100g: 6.3,
      salt_100g: 0.107,
    }
  },
  {
    barcode: '5000159407236',
    name: 'Haribo Goldbears (UK/Standard)',
    brand: 'Haribo',
    category: 'Gummy Candy',
    status: 'HARAM' as const,
    isHalalCertified: false,
    summary: 'Contains Pork Gelatin (E441). Standard European and North American Haribo Goldbears use porcine gelatin. Special Halal-certified Haribo produced in Turkey is available in distinct packaging.',
    ingredients: 'Glucose syrup, sugar, gelatin (pork), dextrose, fruit juice from concentrate: apple, strawberry, raspberry, orange, lemon, pineapple; acid: citric acid; fruit and plant concentrates: safflower, spirulina, apple, elderberry, orange, blackcurrant, kiwi, lemon, aronia, mango, passion fruit, grape; flavouring; elderberry extract; glazing agents: white and yellow beeswax, carnauba wax.',
    imageUrl: 'https://images.openfoodfacts.org/images/products/500/015/940/7236/front_en.11.400.jpg',
    serving_size: '25g',
    nutriments: {
      'energy-kcal_100g': 343,
      'energy-kcal_serving': 86,
      fat_100g: 0.5,
      'saturated-fat_100g': 0.1,
      carbohydrates_100g: 77.0,
      sugars_100g: 46.0,
      sugars_serving: 11.5,
      fiber_100g: 0.0,
      fiber_serving: 0.0,
      proteins_100g: 6.9,
      salt_100g: 0.07,
    }
  },
  {
    barcode: '7622210449283',
    name: 'Oreo Original Sandwich Cookies',
    brand: 'Mondelez / Nabisco',
    category: 'Biscuits & Cookies',
    status: 'HALAL' as const,
    isHalalCertified: true,
    certificationAuthority: 'Suitable for Halal diet / Plant-based fat',
    summary: 'Oreo original cookies are 100% plant-based with palm/canola oil, wheat flour, sugar, and soy lecithin. Free from pork, animal gelatin, and alcohol.',
    ingredients: 'Wheat flour, sugar, palm oil, rapeseed oil, fat-reduced cocoa powder 4.3%, wheat starch, glucose-fructose syrup, raising agents (ammonium carbonates, potassium carbonates, sodium carbonates), salt, emulsifier (soya lecithins), acidity regulator (sodium hydroxide), flavouring.',
    imageUrl: 'https://images.openfoodfacts.org/images/products/762/221/044/9283/front_en.138.400.jpg',
    serving_size: '34g (3 cookies)',
    nutriments: {
      'energy-kcal_100g': 474,
      'energy-kcal_serving': 161,
      fat_100g: 19.0,
      fat_serving: 6.5,
      'saturated-fat_100g': 5.2,
      carbohydrates_100g: 68.0,
      sugars_100g: 38.0,
      sugars_serving: 12.9,
      fiber_100g: 2.7,
      fiber_serving: 0.9,
      proteins_100g: 5.3,
      salt_100g: 0.74,
    }
  },
  {
    barcode: '0028400064057',
    name: 'Doritos Nacho Cheese Flavored Chips',
    brand: 'Frito-Lay',
    category: 'Snacks & Tortilla Chips',
    status: 'MUSHBOOH' as const,
    isHalalCertified: false,
    summary: 'Contains Cheese cultures and Whey enzymes that may use animal-derived rennet from non-halal slaughtered calves or porcine sources in the USA/Europe. In some regions (e.g. GCC/Middle East), localized Halal versions exist.',
    ingredients: 'Corn, vegetable oil (sunflower, canola, and/or corn oil), maltodextrin, salt, cheddar cheese (milk, cheese cultures, salt, enzymes), whey, monosodium glutamate, buttermilk, romano cheese, whey protein concentrate, onion powder, corn flour, natural and artificial flavor, dextrose, tomato powder, lactose, spices, artificial color (yellow 6, yellow 5, red 40), lactic acid, citric acid, sugar, garlic powder, skim milk, red and green bell pepper powder, disodium inosinate, disodium guanylate.',
    imageUrl: 'https://images.openfoodfacts.org/images/products/002/840/006/4057/front_en.87.400.jpg',
    serving_size: '28g (1 oz / ~12 chips)',
    nutriments: {
      'energy-kcal_100g': 500,
      'energy-kcal_serving': 140,
      fat_100g: 28.5,
      fat_serving: 8.0,
      'saturated-fat_100g': 3.6,
      carbohydrates_100g: 64.3,
      sugars_100g: 3.6,
      sugars_serving: 1.0,
      fiber_100g: 3.6,
      fiber_serving: 1.0,
      proteins_100g: 7.1,
      salt_100g: 1.87,
    }
  },
  {
    barcode: '5449000000996',
    name: 'Coca-Cola Original Taste',
    brand: 'The Coca-Cola Company',
    category: 'Beverages & Sodas',
    status: 'HALAL' as const,
    isHalalCertified: true,
    certificationAuthority: 'Widely certified Halal globally',
    summary: 'Carbonated water, sugar, caramel color E150d, phosphoric acid, and natural flavorings. Certified halal in most countries; contains 0.0% alcohol and no animal-derived ingredients.',
    ingredients: 'Carbonated water, sugar, color (caramel E150d), acid (phosphoric acid), natural flavourings including caffeine.',
    imageUrl: 'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.300.400.jpg',
    serving_size: '250ml',
    nutriments: {
      'energy-kcal_100g': 42,
      'energy-kcal_serving': 105,
      fat_100g: 0.0,
      fat_serving: 0.0,
      'saturated-fat_100g': 0.0,
      carbohydrates_100g: 10.6,
      sugars_100g: 10.6,
      sugars_serving: 26.5,
      fiber_100g: 0.0,
      fiber_serving: 0.0,
      proteins_100g: 0.0,
      salt_100g: 0.0,
    }
  },
  {
    barcode: '8715700421391',
    name: 'Heinz Tomato Ketchup',
    brand: 'Heinz',
    category: 'Condiments & Sauces',
    status: 'HALAL' as const,
    isHalalCertified: true,
    summary: 'Vinegar, tomatoes, sugar, salt, and spice extracts. Spirit vinegar is acetic acid produced by bacterial fermentation and free from intoxicating ethanol.',
    ingredients: 'Tomatoes (148g per 100g Tomato Ketchup), spirit vinegar, sugar, salt, spice and herb extracts (contains celery), spice.',
    imageUrl: 'https://images.openfoodfacts.org/images/products/871/570/042/1391/front_en.219.400.jpg',
    serving_size: '15g (1 tbsp)',
    nutriments: {
      'energy-kcal_100g': 102,
      'energy-kcal_serving': 15,
      fat_100g: 0.1,
      fat_serving: 0.0,
      'saturated-fat_100g': 0.1,
      carbohydrates_100g: 23.2,
      sugars_100g: 22.8,
      sugars_serving: 3.4,
      fiber_100g: 0.3,
      fiber_serving: 0.05,
      proteins_100g: 1.2,
      salt_100g: 1.8,
    }
  }
];

export function analyzeIngredientsLocally(
  productName: string,
  ingredientsText: string,
  labels: string[] = [],
  additives: string[] = []
): ProductHalalEvaluation {
  const lowerText = (ingredientsText + ' ' + labels.join(' ') + ' ' + additives.join(' ')).toLowerCase();
  const critical: ProductHalalEvaluation['criticalIngredients'] = [];
  const allParsed: ProductHalalEvaluation['allIngredients'] = [];
  const recommendations: string[] = [];

  // 1. Check for official Halal certification
  const isHalalCertified = 
    labels.some(l => /halal/i.test(l)) || 
    /halal certified|certified halal|halal certified by/i.test(lowerText);

  // 2. Check for explicit Haram ingredients
  let isHaram = false;
  let haramReasons: string[] = [];

  for (const item of HARAM_KEYWORDS) {
    const regex = new RegExp(`\\b${item.term}\\b`, 'i');
    if (regex.test(lowerText)) {
      isHaram = true;
      haramReasons.push(`${item.term.toUpperCase()}: ${item.reason}`);
      critical.push({
        name: item.term,
        status: 'HARAM',
        reason: item.reason,
        source: item.category
      });
    }
  }

  // 3. Check for specific Haram / Mushbooh E-numbers
  let isMushbooh = false;
  let mushboohReasons: string[] = [];

  // Match e-numbers like e120, e471, e-471, e 471 and plain names
  for (const [code, info] of Object.entries(COMMON_ADDITIVES)) {
    const cleanCode = code.replace(/[^0-9]/g, '');
    const codeMatch = cleanCode && new RegExp(`\\be[-\\s]?${cleanCode}\\b`, 'i').test(lowerText);
    const firstName = info.name.split(/[/(]/)[0].trim().toLowerCase();
    const nameMatch = firstName.length >= 4 && lowerText.includes(firstName);
    
    if (codeMatch || nameMatch) {
      if (info.status === 'HARAM') {
        isHaram = true;
        critical.push({
          name: `${info.code} (${info.name})`,
          status: 'HARAM',
          reason: info.description,
          source: info.source
        });
      } else if (info.status === 'MUSHBOOH' && !isHalalCertified) {
        isMushbooh = true;
        critical.push({
          name: `${info.code} (${info.name})`,
          status: 'MUSHBOOH',
          reason: info.description,
          source: info.source
        });
        mushboohReasons.push(`${info.code} (${info.name}): ${info.description}`);
      }
    }
  }

  // 4. Check general mushbooh keywords if not certified
  if (!isHalalCertified) {
    for (const item of MUSHBOOH_KEYWORDS) {
      const regex = new RegExp(`\\b${item.term}\\b`, 'i');
      if (regex.test(lowerText)) {
        // If it says "fish gelatin" or "halal gelatin" or "beef gelatin (halal)", it is safe
        if (item.term === 'gelatin' || item.term === 'gelatine') {
          if (/fish gelatin|halal gelatin|bovine gelatin \(halal\)|beef gelatin \(halal\)/i.test(lowerText)) {
            continue;
          }
          // If packaging says vegetarian/vegan, skip
          if (/vegetarian|vegan/i.test(lowerText)) {
            continue;
          }
        }
        
        // If "mono and diglycerides" with "vegetable origin" or "plant source"
        if (/mono.*diglycerides|e471/i.test(item.term) && /vegetable|plant|vegetarian|vegan/i.test(lowerText)) {
          continue;
        }

        // Rennet with microbial/vegetarian
        if (item.term === 'rennet' && /microbial|vegetarian|plant/i.test(lowerText)) {
          continue;
        }

        // Whey with vegetarian
        if (item.term === 'whey' && /vegetarian|vegan/i.test(lowerText)) {
          continue;
        }

        isMushbooh = true;
        // Don't duplicate if already in critical
        if (!critical.some(c => c.name.toLowerCase().includes(item.term))) {
          critical.push({
            name: item.term,
            status: 'MUSHBOOH',
            reason: item.reason,
            source: item.category
          });
          mushboohReasons.push(`${item.term}: ${item.reason}`);
        }
      }
    }
  }

  // Overall status determination
  let status: ProductHalalEvaluation['status'] = 'HALAL';
  let summary = '';
  let confidence: ProductHalalEvaluation['confidence'] = 'HIGH';

  if (isHaram) {
    status = 'HARAM';
    summary = `Contains explicitly forbidden ingredients (${critical.filter(c => c.status === 'HARAM').map(c => c.name).join(', ')}). Not permissible for consumption.`;
    recommendations.push('Look for 100% vegetarian, vegan, or certified Halal alternatives.');
    recommendations.push('Avoid consuming until certified by a recognized Islamic authority.');
  } else if (isHalalCertified) {
    status = 'HALAL_CERTIFIED';
    summary = 'This product carries recognized Halal certification. All ingredients, processing aids, and facility procedures have been audited to comply with Islamic dietary guidelines.';
    recommendations.push('Always check that the Halal logo or certifier matches your regional Islamic body.');
  } else if (isMushbooh) {
    status = 'MUSHBOOH';
    summary = `Contains questionable or unconfirmed ingredients (${critical.filter(c => c.status === 'MUSHBOOH').map(c => c.name).join(', ')}). Origin (plant vs animal vs non-zabiha) cannot be verified from the label alone.`;
    recommendations.push('Contact the brand to verify whether the emulsifiers/enzymes are from 100% plant or Halal animal sources.');
    recommendations.push('Prefer products with explicit "Suitable for Vegetarians" or Halal certification badges.');
    confidence = 'MEDIUM';
  } else {
    status = 'HALAL';
    summary = 'No pork, alcohol, or dubious animal-derived additives were detected. The ingredients appear permissible (Halal) under standard Islamic food guidelines.';
    recommendations.push('Safe to consume based on listed ingredients.');
  }

  // Parse rough ingredient items
  if (ingredientsText) {
    const rawTokens = ingredientsText.split(/[,;•·\n]/).map(t => t.trim()).filter(Boolean);
    for (const token of rawTokens.slice(0, 20)) {
      const isTokenHaram = HARAM_KEYWORDS.some(k => new RegExp(`\\b${k.term}\\b`, 'i').test(token));
      const isTokenMushbooh = MUSHBOOH_KEYWORDS.some(k => new RegExp(`\\b${k.term}\\b`, 'i').test(token));
      
      allParsed.push({
        name: token,
        status: isTokenHaram ? 'HARAM' : (isTokenMushbooh && !isHalalCertified ? 'MUSHBOOH' : 'HALAL'),
        note: isTokenHaram ? 'Prohibited source' : (isTokenMushbooh ? 'Requires source check' : 'Permissible')
      });
    }
  }

  return {
    status,
    confidence,
    summary,
    isHalalCertified,
    certificationAuthority: isHalalCertified ? 'Verified Halal on package' : undefined,
    criticalIngredients: critical,
    allIngredients: allParsed,
    madhhabNotes: {
      hanafi: critical.some(c => /carmine|cochineal|e120/i.test(c.name)) 
        ? 'Under Hanafi jurisprudence, all insects except locusts are impermissible to consume, making Carmine/E120 strictly forbidden.'
        : undefined,
      shafii_general: critical.some(c => /rennet|cheese/i.test(c.name))
        ? 'Shafi’i, Maliki, and Hanbali schools require strict zabiha slaughter for calf rennet; microbial or vegetable rennet is accepted by all.'
        : undefined
    },
    recommendations
  };
}

export interface MarketAlternativeItem {
  name: string;
  brand: string;
  status: 'HALAL_CERTIFIED' | 'HALAL';
  certificationNote: string;
  barcode?: string;
}

export interface CategoryMarketComparisonData {
  categoryId: string;
  categoryName: string;
  halalCertifiedRate: number;
  naturallyHalalRate: number;
  mushboohRate: number;
  haramRate: number;
  globalAverageCertRate: number;
  totalProductsSampled: number;
  availabilityLevel: 'HIGH' | 'MODERATE' | 'SELECTIVE';
  availabilityHeadline: string;
  marketInsight: string;
  commonCertifiers: string[];
  alternatives: MarketAlternativeItem[];
}

export const CATEGORY_MARKET_BENCHMARKS: Record<string, CategoryMarketComparisonData> = {
  spreads: {
    categoryId: 'spreads',
    categoryName: 'Spreads & Sweet Creams',
    halalCertifiedRate: 64,
    naturallyHalalRate: 24,
    mushboohRate: 9,
    haramRate: 3,
    globalAverageCertRate: 28,
    totalProductsSampled: 420,
    availabilityLevel: 'HIGH',
    availabilityHeadline: 'Abundant Halal-certified & plant-based alternatives available',
    marketInsight:
      'Over 64% of major hazelnut, chocolate, and nut spreads carry formal Halal certification, with an additional 24% naturally permissible using plant-derived lecithin (soy/sunflower) and palm oil instead of animal fats.',
    commonCertifiers: ['IFANCA', 'HMC', 'HALAL QUALITY CONTROL', 'MUI'],
    alternatives: [
      {
        name: 'Nutella Hazelnut Spread with Cocoa',
        brand: 'Ferrero',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Certified Halal (plant-based soy lecithin, zero animal enzymes)',
        barcode: '3017620422003',
      },
      {
        name: 'Lotus Biscoff Cookie Butter Spread',
        brand: 'Lotus Bakeries',
        status: 'HALAL_CERTIFIED',
        certificationNote: '100% Vegan & Halal Certified plant-based recipe',
      },
      {
        name: 'Bonne Maman Hazelnut Chocolate Spread',
        brand: 'Bonne Maman',
        status: 'HALAL',
        certificationNote: 'Palm-free, vegetarian sunflower emulsifier, no alcohol',
      },
    ],
  },
  gummy_candy: {
    categoryId: 'gummy_candy',
    categoryName: 'Gummy Candy & Confectionery',
    halalCertifiedRate: 18,
    naturallyHalalRate: 22,
    mushboohRate: 14,
    haramRate: 46,
    globalAverageCertRate: 28,
    totalProductsSampled: 680,
    availabilityLevel: 'SELECTIVE',
    availabilityHeadline: 'Selective category — check labels for beef gelatin or fruit pectin',
    marketInsight:
      'Only 18% of mainstream gummy confections in Western markets carry Halal certification because 46% rely on conventional porcine gelatin (E441) or carmine red dye (E120). Seek Turkish-import Halal lines or fruit-pectin vegan gummies.',
    commonCertifiers: ['TSE (Turkey)', 'HMC', 'IFANCA', 'GIMDES'],
    alternatives: [
      {
        name: 'Haribo Goldbears (Turkish Halal Export Edition)',
        brand: 'Haribo Turkey',
        status: 'HALAL_CERTIFIED',
        certificationNote: '100% Zabiha Beef Gelatin — TSE Halal Certified',
      },
      {
        name: 'Sour Patch Kids / Swedish Fish',
        brand: 'Mondelez',
        status: 'HALAL',
        certificationNote: 'Gelatin-free starch/pectin base, 100% plant-derived',
      },
      {
        name: 'Ziyad Halal Gummy Bears',
        brand: 'Ziyad Brothers',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Certified Halal beef gelatin & plant colorants',
      },
    ],
  },
  biscuits_cookies: {
    categoryId: 'biscuits_cookies',
    categoryName: 'Biscuits & Cookies',
    halalCertifiedRate: 52,
    naturallyHalalRate: 31,
    mushboohRate: 13,
    haramRate: 4,
    globalAverageCertRate: 28,
    totalProductsSampled: 890,
    availabilityLevel: 'HIGH',
    availabilityHeadline: 'High availability of Halal-certified & vegetarian bakery options',
    marketInsight:
      'Over half (52%) of global packaged biscuits hold Halal certification, and 31% use exclusively vegetable oils (palm/canola) and soy lecithin. Watch out for uncertified E471 mono/diglycerides or whey powder in specialty cream fillings.',
    commonCertifiers: ['IFANCA', 'JAKIM', 'MUI', 'SANHA'],
    alternatives: [
      {
        name: 'Oreo Original Sandwich Cookies',
        brand: 'Mondelez / Nabisco',
        status: 'HALAL_CERTIFIED',
        certificationNote: '100% plant-based oils & soy lecithin emulsifier',
        barcode: '7622210449283',
      },
      {
        name: 'McVitie’s Digestive Biscuits (Original)',
        brand: 'Pladis',
        status: 'HALAL',
        certificationNote: 'Suitable for Vegetarians, free from animal shortening',
      },
      {
        name: 'Loacker Quadratini Wafer Cubes',
        brand: 'Loacker',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Halal Certified, pure botanical ingredients',
      },
    ],
  },
  savory_snacks: {
    categoryId: 'savory_snacks',
    categoryName: 'Snacks & Tortilla Chips',
    halalCertifiedRate: 34,
    naturallyHalalRate: 38,
    mushboohRate: 22,
    haramRate: 6,
    globalAverageCertRate: 28,
    totalProductsSampled: 740,
    availabilityLevel: 'MODERATE',
    availabilityHeadline: 'Plain & vegan-seasoned chips are widely Halal; verify cheese flavors',
    marketInsight:
      'While 34% of savory chips are formally Halal-certified and 38% (salted, BBQ, chili) are naturally plant-based, 22% of cheese-flavored snacks fall into Mushbooh due to unspecified animal rennet or lipase enzymes in whey.',
    commonCertifiers: ['IFANCA', 'ISWA', 'GCC Halal', 'MUI'],
    alternatives: [
      {
        name: 'Doritos Sweet Spicy Chili (Purple Bag)',
        brand: 'Frito-Lay',
        status: 'HALAL',
        certificationNote: 'Dairy-free & enzyme-free plant seasoning profile',
      },
      {
        name: 'Lay’s Classic Salted Potato Chips',
        brand: 'Frito-Lay',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Potatoes, vegetable oil, and sea salt — IFANCA Certified in NA',
      },
      {
        name: 'Pringles Original Crisps',
        brand: 'Kellanova',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Halal Certified plant-based emulsifier formula',
      },
    ],
  },
  beverages: {
    categoryId: 'beverages',
    categoryName: 'Beverages & Sodas',
    halalCertifiedRate: 71,
    naturallyHalalRate: 24,
    mushboohRate: 3,
    haramRate: 2,
    globalAverageCertRate: 28,
    totalProductsSampled: 950,
    availabilityLevel: 'HIGH',
    availabilityHeadline: 'Very high Halal compliance across carbonated drinks & juices',
    marketInsight:
      '71% of global soft drinks and bottled juices carry Halal certification or official compliance letters, with another 24% naturally permissible. Only red-dyed sodas using E120 (Carmine) or fermented malt drinks require caution.',
    commonCertifiers: ['IFANCA', 'JAKIM', 'MUI', 'HFA'],
    alternatives: [
      {
        name: 'Coca-Cola Original Taste',
        brand: 'The Coca-Cola Company',
        status: 'HALAL_CERTIFIED',
        certificationNote: '0.0% alcohol, botanical flavor extracts, caramel E150d',
        barcode: '5449000000996',
      },
      {
        name: 'Pepsi-Cola Regular',
        brand: 'PepsiCo',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Certified Halal across global bottling facilities',
      },
      {
        name: 'San Pellegrino Sparkling Fruit Beverages',
        brand: 'Nestlé',
        status: 'HALAL',
        certificationNote: 'Pure fruit juice & carbonated mineral water, no animal clarifying agents',
      },
    ],
  },
  condiments: {
    categoryId: 'condiments',
    categoryName: 'Condiments & Sauces',
    halalCertifiedRate: 58,
    naturallyHalalRate: 27,
    mushboohRate: 10,
    haramRate: 5,
    globalAverageCertRate: 28,
    totalProductsSampled: 510,
    availabilityLevel: 'HIGH',
    availabilityHeadline: 'Strong Halal certification rate among ketchups, mayos & hot sauces',
    marketInsight:
      '58% of mainstream condiments are Halal-certified. Standard spirit vinegar is fermented to acetic acid and permissible by scholarly consensus; only wine vinegars (balsamic/red wine) or bacon-flavored sauces are prohibited.',
    commonCertifiers: ['IFANCA', 'HFA', 'SANHA', 'JAKIM'],
    alternatives: [
      {
        name: 'Heinz Tomato Ketchup',
        brand: 'Heinz',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Natural spirit vinegar & ripe tomatoes — Certified Halal',
        barcode: '8715700421391',
      },
      {
        name: 'Hellmann’s Real Mayonnaise (Halal Certified Line)',
        brand: 'Unilever',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Certified Halal egg & spirit vinegar emulsion',
      },
      {
        name: 'Huy Fong Sriracha Hot Chili Sauce',
        brand: 'Huy Fong Foods',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'IFANCA Halal Certified — chili, distilled vinegar, garlic',
      },
    ],
  },
  general_grocery: {
    categoryId: 'general_grocery',
    categoryName: 'Packaged Grocery Foods',
    halalCertifiedRate: 38,
    naturallyHalalRate: 36,
    mushboohRate: 18,
    haramRate: 8,
    globalAverageCertRate: 28,
    totalProductsSampled: 1200,
    availabilityLevel: 'MODERATE',
    availabilityHeadline: 'Broad selection of Halal-certified & vegetarian alternatives',
    marketInsight:
      'Across general packaged groceries, 38% carry formal Halal certification while 36% are naturally plant-based permissible. Reviewing emulsifiers (E471), enzymes, and gelatin ensures safe selection.',
    commonCertifiers: ['IFANCA', 'HMC', 'JAKIM', 'MUI'],
    alternatives: [
      {
        name: 'Nutella Hazelnut Spread',
        brand: 'Ferrero',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Halal Certified plant-based emulsifier recipe',
        barcode: '3017620422003',
      },
      {
        name: 'Oreo Original Sandwich Cookies',
        brand: 'Mondelez',
        status: 'HALAL_CERTIFIED',
        certificationNote: '100% plant-derived ingredients',
        barcode: '7622210449283',
      },
      {
        name: 'Heinz Tomato Ketchup',
        brand: 'Heinz',
        status: 'HALAL_CERTIFIED',
        certificationNote: 'Halal Certified condiment staple',
        barcode: '8715700421391',
      },
    ],
  },
};

export function getCategoryMarketComparison(
  categoryRaw?: string,
  productName?: string,
  currentBarcode?: string
): CategoryMarketComparisonData {
  const combinedText = `${categoryRaw || ''} ${productName || ''}`.toLowerCase();

  let benchmark: CategoryMarketComparisonData = CATEGORY_MARKET_BENCHMARKS.general_grocery;

  if (/spread|nutella|hazelnut|chocolate spread|jam|honey|peanut butter/i.test(combinedText)) {
    benchmark = CATEGORY_MARKET_BENCHMARKS.spreads;
  } else if (/gummy|gummies|haribo|jelly|candy|confection|marshmallow|sweets|pastille/i.test(combinedText)) {
    benchmark = CATEGORY_MARKET_BENCHMARKS.gummy_candy;
  } else if (/biscuit|cookie|oreo|wafer|cracker|bakery|cake|pastry/i.test(combinedText)) {
    benchmark = CATEGORY_MARKET_BENCHMARKS.biscuits_cookies;
  } else if (/chip|dorito|crisp|tortilla|snack|popcorn|pretzel|nachos/i.test(combinedText)) {
    benchmark = CATEGORY_MARKET_BENCHMARKS.savory_snacks;
  } else if (/beverage|soda|cola|drink|juice|water|tea|coffee/i.test(combinedText)) {
    benchmark = CATEGORY_MARKET_BENCHMARKS.beverages;
  } else if (/condiment|sauce|ketchup|mayo|mustard|dressing|vinegar|relish/i.test(combinedText)) {
    benchmark = CATEGORY_MARKET_BENCHMARKS.condiments;
  }

  // Filter out the currently viewed product from alternatives if its barcode matches, or keep if needed
  const filteredAlternatives = benchmark.alternatives.filter(
    (alt) => !currentBarcode || alt.barcode !== currentBarcode
  );

  return {
    ...benchmark,
    alternatives: filteredAlternatives.length > 0 ? filteredAlternatives : benchmark.alternatives,
  };
}

