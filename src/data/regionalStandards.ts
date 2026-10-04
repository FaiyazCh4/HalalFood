import { EvaluationData, ProductData } from '../components/ProductResultCard.tsx';

export type RegionalStandardId =
  | 'MY_JAKIM'
  | 'NA_HMA'
  | 'ID_MUI'
  | 'GCC_GSO'
  | 'UK_HMC'
  | 'GLOBAL_SMIIC';

export interface RegionalStandardProfile {
  id: RegionalStandardId;
  countryName: string;
  regionLabel: string;
  flag: string;
  authorityShort: string;
  authorityFull: string;
  standardCode: string;
  primaryMadhhab: string;
  ethanolLimitPercent: number;
  carmineE120Ruling: 'HALAL' | 'HARAM' | 'MUSHBOOH';
  requiresExplicitCertForDairyWhey: boolean;
  requiresHandSlaughterNonStunned: boolean;
  recognizedCertifiers: string[];
  description: string;
  keyCriteria: string[];
}

export const REGIONAL_STANDARDS: Record<RegionalStandardId, RegionalStandardProfile> = {
  MY_JAKIM: {
    id: 'MY_JAKIM',
    countryName: 'Malaysia & Southeast Asia',
    regionLabel: 'Malaysia (JAKIM)',
    flag: '🇲🇾',
    authorityShort: 'JAKIM',
    authorityFull: 'Department of Islamic Development Malaysia (JAKIM)',
    standardCode: 'MS 1500:2019',
    primaryMadhhab: "Shafi'i Consensus (National Fatwa Council)",
    ethanolLimitPercent: 0.01,
    carmineE120Ruling: 'HARAM',
    requiresExplicitCertForDairyWhey: true,
    requiresHandSlaughterNonStunned: false,
    recognizedCertifiers: ['JAKIM', 'MUIS', 'MUI', 'CICOT', 'IFANCA', 'HFA'],
    description:
      'Enforces Malaysian Standard MS 1500 with strict Shafi’i trace-impurity thresholds, zero tolerance for alcoholic flavor carriers, and mandatory JAKIM-recognized foreign Halal certification for animal/dairy derivatives.',
    keyCriteria: [
      'Ethanol in flavoring extracts must not exceed 0.01% in the final product and cannot derive from Khamr.',
      'Carmine / Cochineal (E120) is classified as Haram under Malaysian National Fatwa guidelines.',
      'Uncertified dairy whey, rennet, or E471 emulsifiers are treated as Mushbooh unless backed by a JAKIM-recognized body.',
    ],
  },
  NA_HMA: {
    id: 'NA_HMA',
    countryName: 'North America (USA & Canada)',
    regionLabel: 'North America (HMA / IFANCA)',
    flag: '🇨🇦',
    authorityShort: 'HMA / IFANCA',
    authorityFull: 'Halal Monitoring Authority (HMA Canada) & IFANCA / HFSAA',
    standardCode: 'HMA Zabiha & IFANCA North American Standard',
    primaryMadhhab: 'Hanafi & Multi-Madhhab North American Consensus',
    ethanolLimitPercent: 0.05,
    carmineE120Ruling: 'HARAM',
    requiresExplicitCertForDairyWhey: true,
    requiresHandSlaughterNonStunned: true,
    recognizedCertifiers: ['HMA', 'HFSAA', 'IFANCA', 'ISNA', 'ISWA', 'HALAL TRANSACTIONS OF OMAHA'],
    description:
      'Applies North American HMA & HFSAA hand-slaughtered Zabiha verification alongside IFANCA industrial additive auditing for U.S. and Canadian grocery products.',
    keyCriteria: [
      'Strict hand-slaughtered (Zabiha) requirement without pre-slaughter irreversible stunning for meat & poultry.',
      'Carmine (E120) and L-Cysteine (E920) from avian/human hair are strictly prohibited (Haram) under HMA/Hanafi rules.',
      'Uncertified whey powder, pepsin, rennet, and natural flavors in North American snacks are flagged as Mushbooh.',
    ],
  },
  ID_MUI: {
    id: 'ID_MUI',
    countryName: 'Indonesia',
    regionLabel: 'Indonesia (BPJPH / MUI)',
    flag: '🇮🇩',
    authorityShort: 'BPJPH / MUI',
    authorityFull: 'Badan Penyelenggara Jaminan Produk Halal & LPPOM MUI',
    standardCode: 'SJPH / HAS 23000',
    primaryMadhhab: "Shafi'i Consensus (Majelis Ulama Indonesia Fatwa)",
    ethanolLimitPercent: 0.5,
    carmineE120Ruling: 'HALAL',
    requiresExplicitCertForDairyWhey: true,
    requiresHandSlaughterNonStunned: false,
    recognizedCertifiers: ['BPJPH', 'LPPOM MUI', 'MUI', 'JAKIM', 'MUIS'],
    description:
      'Follows Indonesian Halal Product Assurance Law (SJPH / HAS 23000) and Majelis Ulama Indonesia (MUI) Fatwa Commission rulings.',
    keyCriteria: [
      'Carmine (E120) is permitted as Halal under MUI Fatwa No. 33/2011 (insects with non-flowing blood are tahir).',
      'Fermentation & microbial growth media for enzymes/MSG must be audited free of porcine substrates.',
      'Non-khamr ethanol in food products must remain below 0.5%.',
    ],
  },
  GCC_GSO: {
    id: 'GCC_GSO',
    countryName: 'GCC (Saudi Arabia, UAE, Qatar, Kuwait)',
    regionLabel: 'GCC (GSO / SFDA / MOIAT)',
    flag: '🇸🇦',
    authorityShort: 'GSO / SFDA',
    authorityFull: 'GCC Standardization Organization (GSO) & SFDA / UAE MOIAT',
    standardCode: 'GSO 2055-1',
    primaryMadhhab: 'Hanbali / Maliki / Shafi’i Gulf Consensus',
    ethanolLimitPercent: 0.05,
    carmineE120Ruling: 'MUSHBOOH',
    requiresExplicitCertForDairyWhey: false,
    requiresHandSlaughterNonStunned: false,
    recognizedCertifiers: ['SFDA', 'MOIAT', 'ESMA', 'GSO', 'EIAC', 'GAC'],
    description:
      'Implements unified Gulf Standard GSO 2055-1 used across Saudi Arabia (SFDA), UAE (MOIAT), Qatar, Kuwait, Bahrain, and Oman.',
    keyCriteria: [
      'Zero tolerance for porcine derivatives, blood plasma, or alcohol-bearing confectionery fillings.',
      'Imported meat and poultry require an accredited GSO 2055-1 Islamic slaughter certificate.',
      'Rennet from Halal-slaughtered ruminants or microbial fermentation is permitted.',
    ],
  },
  UK_HMC: {
    id: 'UK_HMC',
    countryName: 'United Kingdom & Europe',
    regionLabel: 'UK & Europe (HMC / HFA)',
    flag: '🇬🇧',
    authorityShort: 'HMC / HFA',
    authorityFull: 'Halal Monitoring Committee (HMC UK) & Halal Food Authority',
    standardCode: 'HMC Non-Stun & European E-Number Standard',
    primaryMadhhab: 'Hanafi & European Scholarly Consensus',
    ethanolLimitPercent: 0.05,
    carmineE120Ruling: 'HARAM',
    requiresExplicitCertForDairyWhey: true,
    requiresHandSlaughterNonStunned: true,
    recognizedCertifiers: ['HMC', 'HFA', 'HALAL CONTROL', 'ARGML MOSQUEE DE PARIS', 'HALAL QUALITY CONTROL'],
    description:
      'Tailored for UK and European supermarkets with strict E-number origin auditing and HMC non-stunned hand-slaughter verification.',
    keyCriteria: [
      'HMC requires 100% non-stunned, hand-slaughtered poultry and meat with inspector-verified labeling.',
      'European E-numbers (E120 Carmine, E441 Gelatin, E471, E542, E904) are audited against Vegetarian Society or HMC logs.',
      'Carmine (E120) is classified as Haram under HMC UK guidelines.',
    ],
  },
  GLOBAL_SMIIC: {
    id: 'GLOBAL_SMIIC',
    countryName: 'Global International',
    regionLabel: 'Global (OIC / SMIIC 1)',
    flag: '🌍',
    authorityShort: 'OIC / SMIIC',
    authorityFull: 'Standards and Metrology Institute for Islamic Countries (OIC/SMIIC)',
    standardCode: 'OIC/SMIIC 1:2019',
    primaryMadhhab: 'Four Sunni Madhhabs (Hanafi, Shafi’i, Maliki, Hanbali)',
    ethanolLimitPercent: 0.1,
    carmineE120Ruling: 'MUSHBOOH',
    requiresExplicitCertForDairyWhey: false,
    requiresHandSlaughterNonStunned: false,
    recognizedCertifiers: ['OIC', 'SMIIC', 'JAKIM', 'MUI', 'IFANCA', 'HMA', 'HMC', 'SFDA'],
    description:
      'International OIC/SMIIC 1 benchmark presenting balanced rulings across all four Sunni schools of jurisprudence.',
    keyCriteria: [
      'Highlights scholarly differences between Hanafi and Shafi’i/Maliki/Hanbali schools on contested additives.',
      'Flags animal-origin emulsifiers (E471/E472) and gelatin without Halal certification as Mushbooh.',
      'Recognizes major accredited national Halal certification bodies worldwide.',
    ],
  },
};

export const REGIONAL_STANDARD_STORAGE_KEY = 'halalcheck_regional_standard';
export const REGIONAL_DETECTION_SOURCE_KEY = 'halalcheck_regional_detection_source';

export interface DetectedRegionState {
  standardId: RegionalStandardId;
  detectedCountryName: string;
  isAutoDetected: boolean;
  detectionMethod: 'timezone_locale' | 'manual_selection';
}

/**
 * Automatically detects the user's country & corresponding Halal certification standard
 * from browser Timezone and Locale (with localStorage persistence for user overrides).
 */
export function detectUserRegionalStandard(): DetectedRegionState {
  try {
    const savedId = localStorage.getItem(REGIONAL_STANDARD_STORAGE_KEY) as RegionalStandardId | null;
    const savedSource = localStorage.getItem(REGIONAL_DETECTION_SOURCE_KEY);
    if (savedId && REGIONAL_STANDARDS[savedId] && savedSource === 'manual_selection') {
      return {
        standardId: savedId,
        detectedCountryName: REGIONAL_STANDARDS[savedId].countryName,
        isAutoDetected: false,
        detectionMethod: 'manual_selection',
      };
    }
  } catch {
    // ignore storage errors
  }

  let tz = '';
  let lang = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    lang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
  } catch {
    // ignore
  }

  const tzLower = tz.toLowerCase();

  // 1. Malaysia / Singapore / Brunei -> MY_JAKIM
  if (
    tzLower.includes('kuala_lumpur') ||
    tzLower.includes('kuching') ||
    tzLower.includes('singapore') ||
    tzLower.includes('brunei') ||
    lang.endsWith('-my') ||
    lang.endsWith('-sg') ||
    lang.startsWith('ms')
  ) {
    return {
      standardId: 'MY_JAKIM',
      detectedCountryName: tzLower.includes('singapore') ? 'Singapore (MUIS / JAKIM)' : 'Malaysia',
      isAutoDetected: true,
      detectionMethod: 'timezone_locale',
    };
  }

  // 2. Indonesia -> ID_MUI
  if (
    tzLower.includes('jakarta') ||
    tzLower.includes('makassar') ||
    tzLower.includes('jayapura') ||
    tzLower.includes('pontianak') ||
    lang.startsWith('id')
  ) {
    return {
      standardId: 'ID_MUI',
      detectedCountryName: 'Indonesia',
      isAutoDetected: true,
      detectionMethod: 'timezone_locale',
    };
  }

  // 3. GCC / Middle East -> GCC_GSO
  if (
    tzLower.includes('riyadh') ||
    tzLower.includes('dubai') ||
    tzLower.includes('qatar') ||
    tzLower.includes('kuwait') ||
    tzLower.includes('bahrain') ||
    tzLower.includes('muscat') ||
    lang.endsWith('-sa') ||
    lang.endsWith('-ae') ||
    lang.endsWith('-qa') ||
    lang.endsWith('-kw')
  ) {
    return {
      standardId: 'GCC_GSO',
      detectedCountryName: tzLower.includes('dubai')
        ? 'United Arab Emirates'
        : tzLower.includes('riyadh')
        ? 'Saudi Arabia'
        : 'GCC Region',
      isAutoDetected: true,
      detectionMethod: 'timezone_locale',
    };
  }

  // 4. UK & Europe -> UK_HMC
  if (
    tzLower.startsWith('europe/') ||
    tzLower.includes('london') ||
    lang.endsWith('-gb') ||
    lang.endsWith('-uk') ||
    lang.endsWith('-fr') ||
    lang.endsWith('-de') ||
    lang.endsWith('-nl')
  ) {
    return {
      standardId: 'UK_HMC',
      detectedCountryName:
        tzLower.includes('london') || lang.endsWith('-gb')
          ? 'United Kingdom'
          : 'Europe',
      isAutoDetected: true,
      detectionMethod: 'timezone_locale',
    };
  }

  // 5. North America (USA & Canada) -> NA_HMA
  if (
    tzLower.startsWith('america/') ||
    tzLower.startsWith('us/') ||
    tzLower.startsWith('canada/') ||
    lang.endsWith('-us') ||
    lang.endsWith('-ca')
  ) {
    const isCanada =
      tzLower.includes('toronto') ||
      tzLower.includes('vancouver') ||
      tzLower.includes('montreal') ||
      tzLower.includes('edmonton') ||
      tzLower.includes('winnipeg') ||
      tzLower.includes('halifax') ||
      lang.endsWith('-ca');

    return {
      standardId: 'NA_HMA',
      detectedCountryName: isCanada ? 'Canada' : 'United States',
      isAutoDetected: true,
      detectionMethod: 'timezone_locale',
    };
  }

  // Default fallback for Asia/Other timezones -> MY_JAKIM if in Asia, else NA_HMA
  if (tzLower.startsWith('asia/')) {
    return {
      standardId: 'MY_JAKIM',
      detectedCountryName: `Asia (${tz.split('/')[1]?.replace(/_/g, ' ') || 'Regional'})`,
      isAutoDetected: true,
      detectionMethod: 'timezone_locale',
    };
  }

  return {
    standardId: 'NA_HMA',
    detectedCountryName: 'North America',
    isAutoDetected: true,
    detectionMethod: 'timezone_locale',
  };
}

export function saveUserRegionalStandard(
  standardId: RegionalStandardId,
  isManual = true
): DetectedRegionState {
  const profile = REGIONAL_STANDARDS[standardId] || REGIONAL_STANDARDS.NA_HMA;
  try {
    localStorage.setItem(REGIONAL_STANDARD_STORAGE_KEY, standardId);
    localStorage.setItem(
      REGIONAL_DETECTION_SOURCE_KEY,
      isManual ? 'manual_selection' : 'timezone_locale'
    );
  } catch {
    // ignore
  }
  return {
    standardId,
    detectedCountryName: profile.countryName,
    isAutoDetected: !isManual,
    detectionMethod: isManual ? 'manual_selection' : 'timezone_locale',
  };
}

export interface RegionalAssessmentResult {
  standardId: RegionalStandardId;
  authorityShort: string;
  authorityFull: string;
  standardCode: string;
  flag: string;
  countryName: string;
  adjustedStatus: EvaluationData['status'];
  originalStatus: EvaluationData['status'];
  wasStatusAdjusted: boolean;
  regionalSummary: string;
  strictnessAdjustments: string[];
}

/**
 * Dynamically adjusts a product's Halal evaluation based on the active regional certification standard
 * (e.g., Malaysia JAKIM MS 1500 vs North America HMA vs Indonesia BPJPH/MUI vs GCC GSO 2055-1 vs UK HMC).
 */
export function applyRegionalCriteriaToEvaluation(
  baseEvaluation: EvaluationData,
  product: ProductData,
  standardId: RegionalStandardId
): { evaluation: EvaluationData; regionalAssessment: RegionalAssessmentResult } {
  const profile = REGIONAL_STANDARDS[standardId] || REGIONAL_STANDARDS.NA_HMA;
  const ingredientsLower = (product.ingredients_text || '').toLowerCase();
  const productNameLower = (product.product_name || '').toLowerCase();
  const combinedText = `${productNameLower} ${ingredientsLower}`;

  let adjustedStatus: EvaluationData['status'] = baseEvaluation.status;
  const adjustments: string[] = [];

  // Clone ingredients lists so we can adjust specific additive rulings per region
  const updatedCritical = (baseEvaluation.criticalIngredients || []).map((item) => ({ ...item }));
  const updatedAll = (baseEvaluation.allIngredients || []).map((item) => ({ ...item }));

  // 1. Check Carmine / Cochineal (E120) regional divergence
  const hasCarmine =
    combinedText.includes('e120') ||
    combinedText.includes('carmine') ||
    combinedText.includes('cochineal') ||
    combinedText.includes('carminic acid');

  if (hasCarmine) {
    if (profile.carmineE120Ruling === 'HARAM') {
      adjustedStatus = 'HARAM';
      adjustments.push(
        `${profile.authorityShort} (${profile.standardCode}) classifies Carmine / Cochineal (E120) as HARAM (prohibited).`
      );
      updatedCritical.forEach((c) => {
        if (c.name.toLowerCase().includes('carmine') || c.name.toLowerCase().includes('e120')) {
          c.status = 'HARAM';
          c.reason = `Classified as Haram under ${profile.authorityShort} (${profile.standardCode}) regional criteria.`;
        }
      });
      updatedAll.forEach((a) => {
        if (a.name.toLowerCase().includes('carmine') || a.name.toLowerCase().includes('e120')) {
          a.status = 'HARAM';
        }
      });
    } else if (profile.carmineE120Ruling === 'HALAL' && adjustedStatus !== 'HARAM') {
      adjustments.push(
        `Under ${profile.authorityShort} (MUI Fatwa No. 33/2011), Carmine (E120) is permitted as Halal (insects with non-flowing blood).`
      );
      updatedCritical.forEach((c) => {
        if (c.name.toLowerCase().includes('carmine') || c.name.toLowerCase().includes('e120')) {
          c.status = 'HALAL';
          c.reason = 'Permitted as Halal under Indonesian MUI Fatwa No. 33/2011.';
        }
      });
    }
  }

  // 2. Check Uncertified Dairy Whey / Rennet / Natural Flavors under strict JAKIM, HMA, or HMC standards
  const hasDairyWheyOrFlavor =
    combinedText.includes('whey') ||
    combinedText.includes('rennet') ||
    combinedText.includes('pepsin') ||
    combinedText.includes('mono- and diglycerides') ||
    combinedText.includes('e471');

  if (
    hasDairyWheyOrFlavor &&
    profile.requiresExplicitCertForDairyWhey &&
    !baseEvaluation.isHalalCertified &&
    adjustedStatus === 'HALAL'
  ) {
    adjustedStatus = 'MUSHBOOH';
    adjustments.push(
      `${profile.authorityShort} (${profile.standardCode}) requires explicit Halal certification for products containing whey, rennet, or E471 emulsifiers.`
    );
  }

  // 3. Check Meat / Poultry products for Hand-Slaughtered Non-Stunned criteria (HMA North America & HMC UK)
  const hasMeatOrPoultry =
    combinedText.includes('chicken') ||
    combinedText.includes('beef') ||
    combinedText.includes('lamb') ||
    combinedText.includes('turkey') ||
    combinedText.includes('meat') ||
    combinedText.includes('poultry');

  if (hasMeatOrPoultry && profile.requiresHandSlaughterNonStunned && adjustedStatus !== 'HARAM') {
    const certAuthUpper = (baseEvaluation.certificationAuthority || '').toUpperCase();
    const isHandSlaughterVerified =
      certAuthUpper.includes('HMA') ||
      certAuthUpper.includes('HMC') ||
      certAuthUpper.includes('HFSAA');

    if (!isHandSlaughterVerified) {
      if (adjustedStatus === 'HALAL') {
        adjustedStatus = 'MUSHBOOH';
      }
      adjustments.push(
        `${profile.authorityShort} requires verified hand-slaughtered (Zabiha), non-stunned meat/poultry certification.`
      );
    }
  }

  // 4. Check Vanilla Extract / Natural Flavoring ethanol carrier rules under Malaysia JAKIM (< 0.01%)
  const hasFlavorExtract =
    combinedText.includes('vanilla extract') ||
    combinedText.includes('natural flavor') ||
    combinedText.includes('natural flavour') ||
    combinedText.includes('flavouring') ||
    combinedText.includes('flavoring');

  if (hasFlavorExtract && standardId === 'MY_JAKIM' && !baseEvaluation.isHalalCertified) {
    adjustments.push(
      `JAKIM MS 1500 enforces a strict ${profile.ethanolLimitPercent}% residual ethanol ceiling on vanilla/flavoring extracts; verify JAKIM or recognized foreign Halal logo.`
    );
  }

  // 5. Check Certification Authority mutual recognition
  if (baseEvaluation.isHalalCertified && baseEvaluation.certificationAuthority) {
    const certUpper = baseEvaluation.certificationAuthority.toUpperCase();
    const isRecognized = profile.recognizedCertifiers.some((rc) => certUpper.includes(rc));
    if (isRecognized) {
      adjustments.push(
        `Certifier "${baseEvaluation.certificationAuthority}" is mutually recognized under ${profile.authorityShort} (${profile.standardCode}).`
      );
    } else {
      adjustments.push(
        `Product holds Halal certification (${baseEvaluation.certificationAuthority}); verify mutual recognition with ${profile.authorityShort} (${profile.standardCode}) for ${profile.countryName}.`
      );
    }
  }

  if (adjustments.length === 0) {
    adjustments.push(
      `Evaluated against ${profile.authorityFull} (${profile.standardCode}) — ingredient profile aligns with regional ${adjustedStatus} criteria.`
    );
  }

  const wasStatusAdjusted = adjustedStatus !== baseEvaluation.status;
  const regionalSummary = wasStatusAdjusted
    ? `[${profile.authorityShort} Regional Adjustment: ${baseEvaluation.status} → ${adjustedStatus}] ${adjustments[0]}`
    : `${baseEvaluation.summary} (Verified under ${profile.authorityShort} · ${profile.standardCode})`;

  const regionalAssessment: RegionalAssessmentResult = {
    standardId: profile.id,
    authorityShort: profile.authorityShort,
    authorityFull: profile.authorityFull,
    standardCode: profile.standardCode,
    flag: profile.flag,
    countryName: profile.countryName,
    adjustedStatus,
    originalStatus: baseEvaluation.status,
    wasStatusAdjusted,
    regionalSummary,
    strictnessAdjustments: adjustments,
  };

  const updatedEvaluation: EvaluationData = {
    ...baseEvaluation,
    status: adjustedStatus,
    summary: wasStatusAdjusted ? regionalSummary : baseEvaluation.summary,
    criticalIngredients: updatedCritical,
    allIngredients: updatedAll,
    recommendations: [
      ...adjustments,
      ...(baseEvaluation.recommendations || []).filter((r) => !adjustments.includes(r)),
    ],
  };

  return {
    evaluation: updatedEvaluation,
    regionalAssessment,
  };
}
