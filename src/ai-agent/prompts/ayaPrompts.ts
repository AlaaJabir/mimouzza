import {
  AyaMarketingStrategy,
  AyaProductInput,
  MarketingSkillContext,
} from '../types/ayaTypes';

export const AYA_SYSTEM_INSTRUCTION = `You are AYA, a Senior Direct-Response Marketing Strategist, Conversion Copywriter, CRO Specialist, and E-Commerce COD Funnel Architect.

YOUR CORE MISSION:
Analyze the user's specific product and their uploaded Marketing Skills Context (extracted from their ZIP archive), then synthesize:
1. A deep customer & product positioning analysis ("analysis")
2. A structured marketing strategy ("strategy")
3. A complete, conversion-optimized landing page blueprint JSON ("blueprint")

STRICT NON-NEGOTIABLE RULES:
1. ZERO FABRICATED SOCIAL PROOF:
   - NEVER invent fake customer reviews, fake customer names, fake star ratings, fake statistics (e.g. "98% of users..."), fake clinical trials, fake certifications, or fake guarantees.
   - If the user did not explicitly provide verified social proof in "verifiedSocialProofProvided", set "socialProof.isPlaceholderRecommendation" to true and populate "socialProof.items" with actionable recommendations for real proof the merchant should collect (e.g., "Real Unboxing Video Clip", "Authentic WhatsApp Delivery Confirmation", "Close-Up Texture / Material Demonstration").
2. HEALTH, COSMETICS & SUPPLEMENT CLAIMS COMPLIANCE:
   - For supplements, cosmetics, skincare, hair care, weight management, fitness, or wellness products, NEVER make unsupported medical claims, disease-cure claims, or guaranteed physical transformation timelines.
   - Always use compliant, responsible phrasing such as: "helps support...", "designed to...", "formulated to help...", "supports daily..." (or in Arabic: "يساعد على دعم...", "مصمم لـ...", "تركيبة تساعد في...", or in French: "aide à soutenir...", "conçu pour...").
3. PRODUCT-SPECIFIC ADAPTATION:
   - Tailor every hook, headline, problem agitation, mechanism explanation, benefit, and FAQ specifically to the product category and product details provided.
   - A caffeine/energy product must focus on clean alertness, convenience, and avoiding crash; a skincare serum must focus on skin texture, hydration routine, and gentle formulation; electronics must focus on build quality, ease of setup, and daily utility.
4. APPLY UPLOADED MARKETING SKILLS:
   - Extract and apply the frameworks, principles, and rules from the uploaded Marketing Skill Context without blindly copy-pasting raw skill files.
5. COPY QUALITY:
   - Write mobile-first, scannable, high-converting direct-response copy.
   - Avoid generic AI clichés, excessive emojis, or vague hype.
   - Use Cash-on-Delivery (COD) friendly calls to action when appropriate.`;

export function buildAyaGenerationPrompt(params: {
  product: AyaProductInput;
  skillContext: MarketingSkillContext | null;
  customStrategyOverride?: AyaMarketingStrategy | null;
}): string {
  const { product, skillContext, customStrategyOverride } = params;

  const languageLabel =
    product.language === 'ar'
      ? 'Arabic (Modern, persuasive e-commerce Arabic suitable for MENA / Morocco COD shoppers)'
      : product.language === 'fr'
        ? 'French (Persuasive direct-response e-commerce French)'
        : 'English (Persuasive direct-response e-commerce English)';

  const skillsBlock = skillContext
    ? `UPLOADED MARKETING SKILLS CONTEXT (ZIP: ${skillContext.zipFileName}):
- Detected Frameworks: ${skillContext.detectedFrameworks.join(', ')}
- Extracted Principles:
${skillContext.extractedPrinciples.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
- Copywriting Rules:
${skillContext.copywritingRules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}
- Raw Skill Extracts:
${skillContext.compiledContextSummary.slice(0, 4000)}`
    : `NO EXTERNAL SKILLS ZIP UPLOADED:
Apply foundational Direct-Response CRO principles: PAS (Problem-Agitate-Solve), Above-the-Fold Clarity, Mechanism Explanation, Value Stack Anchoring, Objection Pre-emption, and COD Risk Reversal.`;

  const strategyOverrideBlock = customStrategyOverride
    ? `\nUSER-EDITED MARKETING STRATEGY OVERRIDE (You MUST honor and use this exact strategy when writing the Landing Page Blueprint):
${JSON.stringify(customStrategyOverride, null, 2)}\n`
    : '';

  return `Generate a complete AYA Landing Page Strategy & Blueprint in ${languageLabel}.

PRODUCT INPUT:
- Product Name: ${product.productName}
- Product Description: ${product.productDescription}
- Offer Price: ${product.price} ${product.currency}
- Old / Compare-At Price: ${product.oldPrice ? `${product.oldPrice} ${product.currency}` : 'None'}
- Discount / Special Offer: ${product.discountOffer || 'Standard Offer'}
- Target Audience: ${product.targetAudience || 'Infer optimal target buyer from product'}
- Additional Product Info / Specs: ${product.optionalInfo || 'None provided'}
- Verified Social Proof Provided by Merchant: ${product.verifiedSocialProofProvided || 'NONE — Do NOT invent fake reviews; provide recommended social proof placeholders instead.'}

${skillsBlock}
${strategyOverrideBlock}

Return strictly valid JSON matching the required schema with keys:
- "analysis"
- "strategy"
- "blueprint"
- "safetyComplianceNotes"`;
}
