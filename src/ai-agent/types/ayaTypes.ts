export type AyaGenerationStage =
  | 'IDLE'
  | 'ANALYZING_PRODUCT'
  | 'ANALYZING_SKILLS'
  | 'BUILDING_CUSTOMER_PROFILE'
  | 'CREATING_MARKETING_ANGLE'
  | 'WRITING_CONVERSION_COPY'
  | 'BUILDING_LANDING_PAGE'
  | 'READY_FOR_REVIEW';

export type AyaLanguage = 'ar' | 'fr' | 'en';

export type AyaProductCategory =
  | 'caffeine_energy'
  | 'skincare_beauty'
  | 'hair_care'
  | 'supplement_wellness'
  | 'perfume_fragrance'
  | 'electronics_gadget'
  | 'home_kitchen'
  | 'fashion_apparel'
  | 'general_ecommerce';

export interface AyaProductInput {
  productName: string;
  productDescription: string;
  images: string[];
  price: string;
  oldPrice: string;
  currency: string;
  discountOffer: string;
  targetAudience: string;
  optionalInfo: string;
  verifiedSocialProofProvided: string;
  language: AyaLanguage;
}

export interface ExtractedSkillFile {
  fileName: string;
  extension: string;
  sizeBytes: number;
  contentSnippet: string;
  fullText: string;
  detectedFrameworks: string[];
  detectedRules: string[];
}

export interface IgnoredZipEntry {
  fileName: string;
  reason: string;
}

export interface MarketingSkillContext {
  zipFileName: string;
  uploadedAt: number;
  extractedFiles: ExtractedSkillFile[];
  ignoredEntries: IgnoredZipEntry[];
  detectedFrameworks: string[];
  extractedPrinciples: string[];
  copywritingRules: string[];
  croCheckpoints: string[];
  compiledContextSummary: string;
}

export interface AyaDeepAnalysis {
  detectedCategory: AyaProductCategory;
  isRegulatedHealthOrCosmetic: boolean;
  targetCustomer: string;
  customerProblem: string;
  customerDesire: string;
  buyingMotivation: string;
  objections: string[];
  productBenefits: string[];
  emotionalAngle: string;
  practicalAngle: string;
  offerPositioning: string;
  urgencyMechanism: string;
  trustRequirements: string[];
  ctaStrategy: string;
  landingPageStructure: string[];
  appliedSkillsFromZip: string[];
}

export interface AyaMarketingStrategy {
  targetAudience: string;
  mainProblem: string;
  desiredOutcome: string;
  mainAngle: string;
  secondaryAngles: string[];
  objections: string[];
  keyBenefits: string[];
  offerStrategy: string;
  ctaStrategy: string;
  socialProofStrategy: string;
  urgencyStrategy: string;
}

export interface AyaLandingPageBlueprint {
  hero: {
    hook: string;
    headline: string;
    subheadline: string;
    cta: string;
    visualDirection: string;
  };
  problem: {
    headline: string;
    body: string;
  };
  benefits: Array<{
    title: string;
    description: string;
  }>;
  solution: {
    headline: string;
    body: string;
  };
  howItWorks: Array<{
    stepNumber: string;
    title: string;
    description: string;
  }>;
  socialProof: {
    headline: string;
    isPlaceholderRecommendation: boolean;
    recommendationNote: string;
    items: Array<{
      label: string;
      content: string;
      verificationType: string;
    }>;
  };
  offer: {
    headline: string;
    price: string;
    oldPrice: string;
    discount: string;
    bonuses: string[];
  };
  faq: Array<{
    question: string;
    answer: string;
  }>;
  finalCta: {
    headline: string;
    body: string;
    button: string;
  };
}

export interface AyaGenerationResult {
  providerUsed: 'DemoAIProvider' | 'ProductionAIProvider';
  generatedAt: number;
  analysis: AyaDeepAnalysis;
  strategy: AyaMarketingStrategy;
  blueprint: AyaLandingPageBlueprint;
  safetyComplianceNotes: string[];
}

export interface IAyaAIProvider {
  readonly providerName: 'DemoAIProvider' | 'ProductionAIProvider';
  generateFullLandingPage(params: {
    product: AyaProductInput;
    skillContext: MarketingSkillContext | null;
    customStrategyOverride?: AyaMarketingStrategy | null;
  }): Promise<AyaGenerationResult>;
}
