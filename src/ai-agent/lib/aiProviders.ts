import {
  AyaDeepAnalysis,
  AyaGenerationResult,
  AyaLandingPageBlueprint,
  AyaMarketingStrategy,
  AyaProductCategory,
  AyaProductInput,
  IAyaAIProvider,
  MarketingSkillContext,
} from '../types/ayaTypes';
import { AYA_SYSTEM_INSTRUCTION, buildAyaGenerationPrompt } from '../prompts/ayaPrompts';

export function detectProductCategory(product: AyaProductInput): {
  category: AyaProductCategory;
  isRegulated: boolean;
} {
  const combined = `${product.productName} ${product.productDescription} ${product.optionalInfo}`.toLowerCase();

  if (
    /caffeine|coffee|energy|espresso|matcha|pre-workout|focus|alert|كافيين|قهوة|طاقة|تركيز|ماتشا/.test(
      combined
    )
  ) {
    return { category: 'caffeine_energy', isRegulated: true };
  }
  if (
    /serum|cream|wrinkle|retinol|skin|acne|collagen|vitamin c|moistur|cleanser|سيروم|كريم|بشرة|تجاعيد|ريتينول|كولاجين|مرطب/.test(
      combined
    )
  ) {
    return { category: 'skincare_beauty', isRegulated: true };
  }
  if (
    /hair|shampoo|argan|keratin|beard|scalp|oil|شعر|شامبو|أركان|اركان|كيراتين|تساقط|لحية|زيت/.test(
      combined
    )
  ) {
    return { category: 'hair_care', isRegulated: true };
  }
  if (
    /supplement|vitamin|magnesium|omega|probiotic|weight|slim|fitness|posture|health|مكمل|فيتامين|ماغنيسيوم|تنحيف|وزن|صحة|مشد|ظهر/.test(
      combined
    )
  ) {
    return { category: 'supplement_wellness', isRegulated: true };
  }
  if (
    /perfume|fragrance|oud|eau de parfum|scent|musk|عطر|عود|مسك|بارفان|رائحة/.test(combined)
  ) {
    return { category: 'perfume_fragrance', isRegulated: false };
  }
  if (
    /watch|smart|earbuds|headphone|charger|camera|led|electronic|bluetooth|portable|ساعة|سماعات|ذكي|شاحن|كاميرا|إلكتروني|بلوتوث/.test(
      combined
    )
  ) {
    return { category: 'electronics_gadget', isRegulated: false };
  }
  if (
    /kitchen|blender|cleaner|vacuum|organizer|lamp|home|cook|مطبخ|خلاط|مكنسة|منظم|منزل|مصباح/.test(
      combined
    )
  ) {
    return { category: 'home_kitchen', isRegulated: false };
  }
  if (
    /jacket|shoes|sneaker|dress|abaya|hoodie|bag|leather|ملابس|حذاء|حقيبة|جلد|عباية|قميص/.test(
      combined
    )
  ) {
    return { category: 'fashion_apparel', isRegulated: false };
  }

  return { category: 'general_ecommerce', isRegulated: false };
}

/**
 * Isolated DEMO AI Provider (`DemoAIProvider`)
 * Synthesizes product-specific, category-adaptive, skill-context-driven strategy and copy
 * without requiring an external LLM key or modifying production databases.
 */
export class DemoAIProvider implements IAyaAIProvider {
  public readonly providerName = 'DemoAIProvider' as const;

  public async generateFullLandingPage(params: {
    product: AyaProductInput;
    skillContext: MarketingSkillContext | null;
    customStrategyOverride?: AyaMarketingStrategy | null;
  }): Promise<AyaGenerationResult> {
    const { product, skillContext, customStrategyOverride } = params;
    const { category, isRegulated } = detectProductCategory(product);
    const lang = product.language || 'ar';

    const frameworksUsed =
      skillContext && skillContext.detectedFrameworks.length > 0
        ? skillContext.detectedFrameworks
        : [
            'PAS (Problem-Agitate-Solve)',
            'COD Risk-Reversal & Micro-Commitment',
            'Value Stack & Price Anchoring',
          ];

    const rulesApplied =
      skillContext && skillContext.extractedPrinciples.length > 0
        ? skillContext.extractedPrinciples.slice(0, 4)
        : [
            'Lead with immediate problem-state recognition in the hero hook.',
            'Explain the functional mechanism clearly before presenting the offer.',
            'Address delivery and payment-on-inspection objections directly.',
          ];

    const analysis = this.buildCategoryAnalysis(
      product,
      category,
      isRegulated,
      frameworksUsed,
      rulesApplied,
      lang
    );

    const strategy: AyaMarketingStrategy = customStrategyOverride
      ? { ...customStrategyOverride }
      : {
          targetAudience: analysis.targetCustomer,
          mainProblem: analysis.customerProblem,
          desiredOutcome: analysis.customerDesire,
          mainAngle: `${analysis.emotionalAngle} + ${analysis.practicalAngle}`,
          secondaryAngles: [
            analysis.practicalAngle,
            analysis.offerPositioning,
            `Applied Framework: ${frameworksUsed[0]}`,
          ],
          objections: analysis.objections,
          keyBenefits: analysis.productBenefits,
          offerStrategy: analysis.offerPositioning,
          ctaStrategy: analysis.ctaStrategy,
          socialProofStrategy: product.verifiedSocialProofProvided.trim()
            ? lang === 'ar'
              ? 'عرض تجارب الزبناء الموثقة التي وفرها المتجر فقط دون أي مبالغة.'
              : 'Display only the merchant-supplied verified customer feedback without exaggeration.'
            : lang === 'ar'
              ? 'عدم اختلاق أي تقييمات وهمية؛ استبدالها بقسم إرشادي يوصي بإضافة فيديو فتح العلبة (Unboxing) وصور حقيقية للمنتج.'
              : 'Zero fabricated testimonials; render a structured Social Proof Recommendation placeholder advising real unboxing media.',
          urgencyStrategy: analysis.urgencyMechanism,
        };

    const blueprint = this.buildBlueprint(product, category, isRegulated, strategy, lang);

    const safetyComplianceNotes = isRegulated
      ? [
          'Regulated Category Detected (Wellness / Cosmetics / Nutrition): Enforced non-medical support phrasing ("helps support", "designed to", "يساعد على دعم").',
          'Zero unsupported clinical statistics, disease claims, or guaranteed timelines generated.',
          'Zero fabricated customer reviews or fake star ratings included.',
        ]
      : [
          'Direct-Response CRO Integrity Verified: Zero fabricated customer reviews or fake statistics.',
          'Offer pricing and discount math strictly reflect user-supplied product inputs.',
        ];

    return {
      providerUsed: 'DemoAIProvider',
      generatedAt: Date.now(),
      analysis,
      strategy,
      blueprint,
      safetyComplianceNotes,
    };
  }

  private buildCategoryAnalysis(
    product: AyaProductInput,
    category: AyaProductCategory,
    isRegulated: boolean,
    frameworks: string[],
    rules: string[],
    lang: 'ar' | 'fr' | 'en'
  ): AyaDeepAnalysis {
    const pName = product.productName.trim() || 'المنتج';
    const priceLabel = `${product.price || '199'} ${product.currency || 'DH'}`;
    const hasDiscount = Boolean(product.oldPrice && Number(product.oldPrice) > Number(product.price));
    const discountPct = hasDiscount
      ? Math.round(
          ((Number(product.oldPrice) - Number(product.price)) / Number(product.oldPrice)) * 100
        )
      : null;

    if (lang === 'ar') {
      const profiles: Record<
        AyaProductCategory,
        {
          customer: string;
          problem: string;
          desire: string;
          motivation: string;
          emotional: string;
          practical: string;
          benefits: string[];
          objections: string[];
        }
      > = {
        caffeine_energy: {
          customer:
            product.targetAudience ||
            'المهنيون، الطلبة، والسائقون الذين يحتاجون إلى يقظة ذهنية سريعة ونظيفة خلال اليوم دون عناء تحضير القهوة أو هبوط الطاقة المفاجئ.',
          problem:
            'الشعور بالخمول الذهني وتشتت التركيز في منتصف اليوم، مع ضيق الوقت أو الإزعاج الناتج عن المشروبات السكرية الثقيلة.',
          desire:
            'الحصول على دفعة تركيز ونشاط متوازنة وسريعة في أي مكان وزمان بسهولة تامة.',
          motivation: 'الحفاظ على الإنتاجية العالية واليقظة الذهنية بأسلوب عملي وسريع.',
          emotional: 'الشعور بالحضور الذهني والسيطرة على مهام اليوم منذ اللحظة الأولى.',
          practical: `استخدام عملي سريع بجرعة مدروسة من ${pName} يغنيك عن الانتظار والتكلفة اليومية المتكررة.`,
          benefits: [
            'يساعد على دعم اليقظة الذهنية والتركيز أثناء العمل أو الدراسة',
            'تصميم عملي سهل الحمل والاستخدام في أي وقت دون تحضير معقد',
            'تركيبة متوازنة مصممة لتفادي الشعور بالثقل أو الإزعاج الهضمي',
            'توفير اقتصادي مقارنة بشراء مشروبات الطاقة أو القهوة المختصة يومياً',
          ],
          objections: [
            'هل يسبب التوتر أو الخفقان؟ (تم تصميمه بجرعة متوازنة للاستخدام اليومي المعتدل)',
            'كيف يتم الدفع والاستلام؟ (الدفع نقداً عند الاستلام بعد معاينة الطرد)',
            'كم تدوم العلبة الواحدة؟ (تغطي الاحتياج اليومي بتكلفة أقل بكثير من البدائل)',
          ],
        },
        skincare_beauty: {
          customer:
            product.targetAudience ||
            'النساء والرجال الباحثون عن روتين عناية بالبشرة يدعم نضارتها ومظهرها الصحي بتركيبة لطيفة وموثوقة.',
          problem:
            'مظهر البشرة المجهدة أو الجافة وفقدان الإشراقة الطبيعية بسبب العوامل اليومية واستخدام منتجات غير مناسبة.',
          desire:
            'بشرة تبدو أكثر نعومة وترطيباً وإشراقاً مع روتين يومي بسيط ومريح.',
          motivation: 'استعادة الثقة في المظهر اليومي عبر عناية مدروسة ولطيفة على البشرة.',
          emotional: 'إحساس متجدد بالنضارة والعناية الذاتية الراقية كل صباح ومساء.',
          practical: `تركيبة ${pName} المصممة لدعم ترطيب البشرة وتحسين ملمسها تدريجياً ضمن روتينك اليومي.`,
          benefits: [
            'يساعد على دعم ترطيب البشرة ومنحها ملمساً ناعماً ومريحاً',
            'مصمم للمساعدة في تحسين مظهر الخطوط الدقيقة وإشراقة البشرة',
            'قوام خفيف سريع الامتصاص لا يترك أثراً دهنياً مزعجاً',
            'مناسب للدمج السهل في روتين العناية الصباحي أو المسائي',
          ],
          objections: [
            'هل يناسب مختلف أنواع البشرة؟ (تركيبة لطيفة، ويُنصح بتجربته على جزء صغير أولاً)',
            'متى يظهر التحسن في ملمس البشرة؟ (يرتبط بالاستخدام المنتظم ضمن روتين العناية اليومي)',
            'هل المنتج أصلي ومغلف بإحكام؟ (نعم، يصلك مغلفاً مع إمكانية المعاينة عند الاستلام)',
          ],
        },
        hair_care: {
          customer:
            product.targetAudience ||
            'الأشخاص الذين يعانون من جفاف الشعر، التقصف، أو بهتان المظهر ويبحثون عن عناية مغذية تعيد للشعر حيويته.',
          problem:
            'تشابك الشعر، هيشانه، وفقدان لمعانه الطبيعي نتيجة التصفيف الحراري والعوامل البيئية.',
          desire: 'شعر يبدو أكثر انسيابية، لمعاناً، وسهولة في التصفيف اليومي.',
          motivation: 'الحصول على مظهر شعر صحي ومرتب في المنزل دون جلسات باهظة التكلفة.',
          emotional: 'الثقة بمظهر شعر حيوي ولامع يلفت الأنظار في كل مناسبة.',
          practical: `عناية مركزة عبر ${pName} تساعد على تغذية خصلات الشعر وحمايتها من الجفاف.`,
          benefits: [
            'يساعد على ترطيب خصلات الشعر الجافة وتقليل مظهر الهيشان',
            'يمنح الشعر لمعاناً طبيعياً وملمساً حريرياً يسهل تصفيفه',
            'تركيبة مدروسة لا تثقل الشعر وتناسب الاستخدام المنتظم',
            'يساعد في دعم مظهر الأطراف المتقصفة وحمايتها أثناء التصفيف',
          ],
          objections: [
            'هل يترك الشعر دهنياً؟ (قوام متوازن يُمتص بسهولة عند وضع الكمية المناسبة)',
            'هل يصلح للشعر المصبوغ أو المعالج؟ (مصمم ليكون لطيفاً ومرطباً لمختلف أنواع الشعر)',
            'كيف أضمن التوصل بالمنتج الصحيح؟ (معاينة الطرد قبل الدفع عند الاستلام)',
          ],
        },
        supplement_wellness: {
          customer:
            product.targetAudience ||
            'الأشخاص المهتمون بدعم نشاطهم اليومي وراحتهم الجسدية كجزء من نمط حياة صحي ومتوازن.',
          problem:
            'الإرهاق اليومي أو عدم الانتظام في الحصول على العناصر الداعمة للنشاط والراحة الجسدية.',
          desire: 'دعم التوازن اليومي والنشاط البدني بطريقة عملية ومنتظمة.',
          motivation: 'الاستثمار في الراحة اليومية وجودة الحياة عبر حل عملي سهل الالتزام.',
          emotional: 'الشعور بالحيوية والاستعداد الأفضل لمتطلبات الحياة اليومية.',
          practical: `${pName} مصمم لدعم احتياجك اليومي بسهولة ووضوح في الاستخدام.`,
          benefits: [
            'مصمم للمساعدة في دعم النشاط والتوازن اليومي للجسم',
            'سهل الاستخدام والدمج ضمن جدولك اليومي دون تعقيد',
            'جودة تصنيع وتغليف محكم يحافظ على خصائص المنتج',
            'توصيل سريع لباب المنزل مع الدفع عند الاستلام',
          ],
          objections: [
            'هل يعتبر بديلاً عن النظام الغذائي أو الاستشارة الطبية؟ (لا، هو مكمل داعم لنمط حياة متوازن)',
            'كيف أعرف طريقة الاستخدام الصحيحة؟ (مرفق بإرشادات استخدام واضحة ومفصلة)',
            'هل الدفع آمن؟ (لا تدفع أي درهم مسبقاً — الدفع نقداً عند الاستلام)',
          ],
        },
        perfume_fragrance: {
          customer:
            product.targetAudience ||
            'عشاق العطور الراقية الباحثون عن حضور عطري مميز وثبات أنيق يناسب الإطلالات اليومية والمناسبات.',
          problem:
            'العطور التقليدية التي تتلاشى رائحتها سريعاً أو تفتقر إلى التميز والتوازن في النوتات العطرية.',
          desire: 'بصمة عطرية فاخرة تجمع بين الجاذبية، الرقي، والفوحان المتوازن.',
          motivation: 'ترك انطباع لا يُنسى يعكس الذوق الرفيع والأناقة الشخصية.',
          emotional: 'حضور واثق وجاذبية هادئة ترافقك طوال ساعات اليوم.',
          practical: `توليفة عطرية متقنة في ${pName} تمنحك تجربة فاخرة بسعر مدروس.`,
          benefits: [
            'توليفة عطرية متوازنة تجمع بين الافتتاحية المنعشة والقاعدة الدافئة',
            'مصمم ليمنحك فوحاناً أنيقاً يدوم لساعات طويلة على الملابس',
            'زجاجة وتغليف فاخر مناسب للاستخدام الشخصي أو كهدية راقية',
            'قيمة استثنائية مقابل السعر مع خدمة التوصيل لباب المنزل',
          ],
          objections: [
            'هل الرائحة قوية أم هادئة؟ (متوازنة بعناية لتناسب الاستخدام اليومي والمناسبات)',
            'هل التغليف محمي أثناء الشحن؟ (نعم، تغليف مقاوم للصدمات مع معاينة عند الاستلام)',
            'كم يستغرق التوصيل؟ (توصيل سريع خلال 24 إلى 48 ساعة لأغلب المدن)',
          ],
        },
        electronics_gadget: {
          customer:
            product.targetAudience ||
            'الباحثون عن أجهزة وإكسسوارات تقنية عملية تجمع بين الأداء الموثوق، سهولة التشغيل، والتصميم العصري.',
          problem:
            'الأجهزة المعقدة أو ضعيفة الجودة التي تتعطل بسرعة ولا تقدم الأداء العملي المطلوب يومياً.',
          desire: 'جهاز ذكي وعملي يشتغل بكفاءة فور إخراجه من العلبة ويوفر الوقت والجهد.',
          motivation: 'ترقية التجربة اليومية بأداة تقنية موثوقة وعالية القيمة.',
          emotional: 'راحة البال والاعتمادية العالية في كل استخدام.',
          practical: `${pName} يجمع بين المواصفات العملية وسهولة الاستخدام المباشر (Plug & Play).`,
          benefits: [
            'تصميم عصري متين بمكونات مختارة للاستخدام اليومي المستمر',
            'تشغيل فوري وسهل دون إعدادات معقدة',
            'أداء عملي مستقر يلبي احتياجك في المنزل أو أثناء التنقل',
            'معاينة الطرد والتأكد من المنتج عند الاستلام قبل الدفع',
          ],
          objections: [
            'هل يأتي بجميع ملحقاته في العلبة؟ (نعم، العلبة كاملة وجاهزة للتشغيل المباشر)',
            'هل الاستخدام سهل؟ (مزود بتصميم بديهي ودليل استخدام واضح)',
            'ماذا لو أردت التأكد عند الاستلام؟ (الدفع نقداً عند الاستلام بعد المعاينة)',
          ],
        },
        home_kitchen: {
          customer:
            product.targetAudience ||
            'الأسر وأصحاب المنازل الذين يبحثون عن حلول ذكية لتوفير الوقت والجهد وتنظيم المهام اليومية في البيت والمطبخ.',
          problem:
            'ضياع الوقت والجهد في المهام المنزلية المتكررة باستخدام أدوات تقليدية غير عملية.',
          desire: 'إنجاز مهام المنزل والمطبخ بسرعة، نظافة، وأقل مجهود ممكن.',
          motivation: 'توفير الوقت اليومي للعائلة والراحة مع الحفاظ على ترتيب المنزل.',
          emotional: 'الشعور بالراحة والتنظيم في كل زاوية من المنزل.',
          practical: `${pName} يختصر عليك الخطوات المتعبة بتصميم ذكي سهل التنظيف والتخزين.`,
          benefits: [
            'يوفر الوقت والمجهود في المهام اليومية داخل المنزل أو المطبخ',
            'خامات عملية متينة وسهلة التنظيف بعد كل استخدام',
            'حجم مدمج وتصميم ذكي لا يشغل مساحة كبيرة في التخزين',
            'حل اقتصادي عملي يدوم طويلاً مع دفع آمن عند الاستلام',
          ],
          objections: [
            'هل سهل التنظيف والفك؟ (نعم، صُمم ليكون عملياً وسريع التنظيف في ثوانٍ)',
            'هل الخامات تتحمل الاستخدام اليومي؟ (مصنوع من مواد متينة مخصصة للاستخدام المتكرر)',
            'كيف أطلبه الآن؟ (املأ الاستمارة وسيصلك لباب البيت والدفع عند الاستلام)',
          ],
        },
        fashion_apparel: {
          customer:
            product.targetAudience ||
            'الباحثون عن إطلالة أنيقة تجمع بين جودة الخياطة، راحة الارتداء طوال اليوم، والتصميم العصري.',
          problem:
            'القطع التي تبدو جميلة في الصور لكنها تفتقر إلى الراحة أو جودة القماش والتفصيل في الواقع.',
          desire: 'قطعة أنيقة ومريحة بقصة متقنة وخامة ممتازة تناسب مختلف الإطلالات.',
          motivation: 'الجمع بين الأناقة الراقية والراحة العملية بسعر مناسب.',
          emotional: 'الثقة الكاملة بالمظهر والأناقة في كل خطوة.',
          practical: `${pName} مصمم بخامة مريحة وتفاصيل دقيقة تمنحك إطلالة متكاملة.`,
          benefits: [
            'خامة مختارة بعناية تمنحك راحة ممتازة طوال ساعات الارتداء',
            'قصة أنيقة وعصرية يسهل تنسيقها في الإطلالات اليومية والمناسبات',
            'تشطيبات وخياطة متقنة تحافظ على رونق القطعة مع الاستخدام',
            'إمكانية معاينة المنتج عند التوصل به قبل الدفع',
          ],
          objections: [
            'كيف أختار المقاس أو اللون المناسب؟ (يمكنك تحديد خيارك بدقة وسنؤكده معك هاتفياً)',
            'هل القماش مريح؟ (نعم، خامة عملية لطيفة ومناسبة للاستخدام الطويل)',
            'هل الدفع عند الاستلام متاح؟ (نعم، الدفع نقداً عند الاستلام في جميع المدن)',
          ],
        },
        general_ecommerce: {
          customer:
            product.targetAudience ||
            `الزبناء الباحثون عن جودة موثوقة وقيمة حقيقية عند اقتناء ${pName} مع خدمة توصيل سريعة ودفع آمن عند الاستلام.`,
          problem:
            'صعوبة إيجاد منتج يجمع بين الجودة العملية، السعر العادل، وسرعة التوصيل دون مخاطرة الدفع المسبق.',
          desire: `الحصول على ${pName} بمواصفات عملية ممتازة وتجربة شراء سهلة ومضمونة.`,
          motivation: 'حل عملي موثوق يوفر الوقت والمال مع ضمان المعاينة عند الاستلام.',
          emotional: 'الشعور بالاطمئنان والرضا عن اختيار منتج عملي يخدم احتياجك اليومي.',
          practical: `${pName} يقدم أداءً عملياً مدروساً مقابل سعر تنافسي (${priceLabel}).`,
          benefits: [
            product.productDescription
              ? `مواصفات مدروسة: ${product.productDescription.slice(0, 90)}`
              : `تصميم عملي متقن يلبي الاحتياج اليومي بكفاءة عالية`,
            'جودة تصنيع ممتازة تضمن استخداماً مريحاً وموثوقاً',
            'قيمة عالية مقابل السعر مع عرض خاص لفترة الطلب الحالية',
            'شحن سريع لباب المنزل مع الدفع نقداً عند الاستلام',
          ],
          objections: [
            'هل المنتج مطابق للوصف؟ (نعم، مع إمكانية المعاينة عند الاستلام قبل الدفع)',
            'كم يستغرق التوصيل؟ (بين 24 و48 ساعة في أغلب المدن مع تأكيد هاتفي سريع)',
            'هل توجد مصاريف خفية؟ (لا، السعر المعروض واضح والدفع عند الاستلام)',
          ],
        },
      };

      const p = profiles[category];
      return {
        detectedCategory: category,
        isRegulatedHealthOrCosmetic: isRegulated,
        targetCustomer: p.customer,
        customerProblem: p.problem,
        customerDesire: p.desire,
        buyingMotivation: p.motivation,
        objections: p.objections,
        productBenefits: p.benefits,
        emotionalAngle: p.emotional,
        practicalAngle: p.practical,
        offerPositioning: hasDiscount
          ? `عرض توفير مباشر: اقتنِ ${pName} بسعر ${priceLabel} بدلاً من ${product.oldPrice} ${product.currency} (خصم ${discountPct}%) ${product.discountOffer ? `— ${product.discountOffer}` : ''}`
          : `عرض مباشر بقيمة عالية: ${pName} بسعر ${priceLabel} ${product.discountOffer ? `مع ${product.discountOffer}` : 'مع توصيل سريع لباب المنزل'}`,
        urgencyMechanism:
          product.discountOffer ||
          'العرض الحالي مرتبط بالدفعة المتوفرة للشحن الفوري دون استخدام عدادات وهمية.',
        trustRequirements: [
          'الدفع نقداً عند الاستلام (Cash on Delivery) لإزالة أي مخاطرة مالية',
          'تأكيد هاتفي مباشر لمراجعة العنوان وتفاصيل الطلب مع الزبون',
          'شفافية كاملة في عرض السعر والمواصفات الحقيقية دون وعود مبالغ فيها',
        ],
        ctaStrategy:
          'زر طلب واضح ومباشر يركز على "اطلب الآن — الدفع عند الاستلام" مع طمأنة فورية أسفل الزر.',
        landingPageStructure: [
          '1. Hero Section (Hook + Headline + Value Price + Direct COD CTA)',
          '2. Problem Agitation (Why status-quo solutions fail)',
          '3. Core Benefits Grid (4 concrete daily-life outcomes)',
          '4. Product Mechanism & Solution (Why this product works)',
          '5. How It Works (3 simple steps)',
          '6. Social Proof / Verification Section (Honest proof or collection guide)',
          '7. Offer Stack & Price Comparison',
          '8. Objection-Handling FAQ',
          '9. Final Risk-Free COD CTA',
        ],
        appliedSkillsFromZip: [...frameworks, ...rules.slice(0, 2)],
      };
    }

    // English / French fallback analysis
    return {
      detectedCategory: category,
      isRegulatedHealthOrCosmetic: isRegulated,
      targetCustomer:
        product.targetAudience ||
        `Discerning buyers looking for a reliable, practical solution with ${pName} and risk-free Cash-on-Delivery checkout.`,
      customerProblem: `Frustration with inconsistent alternatives that waste time and fail to deliver dependable daily results.`,
      customerDesire: `Experience immediate convenience, dependable quality, and clear value with ${pName}.`,
      buyingMotivation: `Practical daily upgrade backed by zero upfront payment risk (Pay on Delivery).`,
      objections: [
        'Will it work as described for my daily routine?',
        'Is payment really collected only upon delivery?',
        'How fast will my order arrive after confirmation?',
      ],
      productBenefits: [
        `Purpose-built design tailored for ${pName}`,
        isRegulated
          ? 'Formulated to help support your daily routine safely and comfortably'
          : 'Engineered for reliable day-to-day performance and durability',
        'Simple, friction-free usage right out of the box',
        'Protected by Cash-on-Delivery inspection upon arrival',
      ],
      emotionalAngle: 'Confidence and peace of mind knowing you chose a well-crafted solution.',
      practicalAngle: `Clear functional utility at ${priceLabel} with zero upfront payment risk.`,
      offerPositioning: hasDiscount
        ? `Special Offer: ${priceLabel} instead of ${product.oldPrice} ${product.currency} (Save ${discountPct}%) ${product.discountOffer}`
        : `Direct Value Offer: ${priceLabel} ${product.discountOffer || 'with fast doorstep delivery'}`,
      urgencyMechanism:
        product.discountOffer ||
        'Genuine batch availability for immediate dispatch without fake countdown timers.',
      trustRequirements: [
        'Cash on Delivery (Pay only when the package arrives)',
        'Phone confirmation call before dispatch',
        'Honest, transparent product specifications',
      ],
      ctaStrategy: 'Action-oriented COD button paired with risk-reversal micro-copy.',
      landingPageStructure: [
        '1. Hero Section (Hook + Headline + Offer + COD CTA)',
        '2. Problem & Friction Section',
        '3. Key Benefits Breakdown',
        '4. Solution & Mechanism',
        '5. 3-Step How It Works',
        '6. Authentic Social Proof / Verification Guide',
        '7. Value Offer Stack',
        '8. Objection-Crushing FAQ',
        '9. Final COD Call-To-Action',
      ],
      appliedSkillsFromZip: [...frameworks, ...rules.slice(0, 2)],
    };
  }

  private buildBlueprint(
    product: AyaProductInput,
    category: AyaProductCategory,
    isRegulated: boolean,
    strategy: AyaMarketingStrategy,
    lang: 'ar' | 'fr' | 'en'
  ): AyaLandingPageBlueprint {
    const pName = product.productName.trim() || (lang === 'ar' ? 'المنتج المميز' : 'Featured Product');
    const priceStr = `${product.price || '199'} ${product.currency || 'DH'}`;
    const oldPriceStr = product.oldPrice
      ? `${product.oldPrice} ${product.currency || 'DH'}`
      : '';
    const hasDiscount = Boolean(product.oldPrice && Number(product.oldPrice) > Number(product.price));
    const discountStr = hasDiscount
      ? `${Math.round(
          ((Number(product.oldPrice) - Number(product.price)) / Number(product.oldPrice)) * 100
        )}%`
      : product.discountOffer || (lang === 'ar' ? 'عرض خاص' : 'Special Offer');

    const hasVerifiedProof = Boolean(product.verifiedSocialProofProvided.trim());

    if (lang === 'ar') {
      const categoryHooks: Record<AyaProductCategory, { hook: string; visual: string }> = {
        caffeine_energy: {
          hook: 'هل تعاني من هبوط الطاقة وتشتت التركيز في منتصف يومك؟',
          visual:
            'صورة واضحة للمنتج بجانب بيئة عمل عصرية تبرز سهولة الحمل والاستخدام السريع.',
        },
        skincare_beauty: {
          hook: 'روتين عناية مصمم لدعم إشراقة بشرتك ونعومتها كل يوم',
          visual:
            'لقطة قريبة (Close-up) تبرز قوام المنتج النقي وتغليفه الأنيق في إضاءة دافئة.',
        },
        hair_care: {
          hook: 'ودّعي جفاف وهيشان الشعر مع عناية مصممة لدعم اللمعان والنعومة',
          visual:
            'صورة تبرز العبوة الأصلية وقوام المنتج الغني مع خطوات الاستخدام البسيطة.',
        },
        supplement_wellness: {
          hook: 'خطوة يومية بسيطة مصممة لدعم نشاطك وتوازنك الطبيعي',
          visual:
            'صورة نظيفة واحترافية للعبوة توضح المكونات وطريقة الاستخدام اليومي بوضوح.',
        },
        perfume_fragrance: {
          hook: 'بصمة عطرية راقية تجمع بين الفخامة، التميز، والفوحان المتوازن',
          visual:
            'تصوير فاخر لزجاجة العطر يبرز تفاصيل التصميم والنوتات العطرية الأساسية.',
        },
        electronics_gadget: {
          hook: 'الأداء العملي والتصميم الذكي الذي يختصر عليك الوقت والجهد يومياً',
          visual:
            'صورة عالية الدقة للجهاز أثناء التشغيل توضح أبعاده الحقيقية وملحقات العلبة.',
        },
        home_kitchen: {
          hook: 'اجعل مهام منزلك ومطبخك أسرع وأكثر تنظيماً بأقل مجهود',
          visual:
            'لقطة عملية توضح المنتج أثناء الاستخدام الفعلي في المطبخ أو المنزل.',
        },
        fashion_apparel: {
          hook: 'أناقة متقنة وخامة مريحة صُممت لترافقك بثقة طوال اليوم',
          visual:
            'صورة واضحة تبرز جودة القماش، دقة الخياطة، وتفاصيل القصة من عدة زوايا.',
        },
        general_ecommerce: {
          hook: `الحل العملي الموثوق الذي صُمم ليمنحك أفضل تجربة مع ${pName}`,
          visual:
            'صورة واضحة وعالية الجودة للمنتج الحقيقي تبرز أهم مميزاته وتفاصيله.',
        },
      };

      const selectedHook = categoryHooks[category];

      return {
        hero: {
          hook: selectedHook.hook,
          headline: `${pName} — ${strategy.desiredOutcome}`,
          subheadline:
            product.productDescription.trim() ||
            `${strategy.mainAngle}. متوفر الآن مع خدمة التوصيل السريع والدفع نقداً عند الاستلام.`,
          cta: 'اطلب الآن — الدفع عند الاستلام',
          visualDirection: selectedHook.visual,
        },
        problem: {
          headline: 'لماذا لا تمنحك الحلول التقليدية النتيجة التي تبحث عنها؟',
          body: `${strategy.mainProblem} معظم البدائل إما معقدة الاستخدام، أو غير عملية لجدولك اليومي، مما يجعلك تبحث عن حل مدروس يجمع بين الفعالية والسهولة.`,
        },
        benefits: strategy.keyBenefits.map((b, idx) => ({
          title: b,
          description:
            idx === 0
              ? `صُمم ${pName} ليركز مباشرة على ما يهمك في الاستخدام اليومي دون تعقيد.`
              : idx === 1
                ? 'جودة مختارة بعناية لتمنحك تجربة استخدام مريحة وموثوقة من اليوم الأول.'
                : idx === 2
                  ? isRegulated
                    ? 'تركيبة مدروسة تساعد على دعم روتينك اليومي بأمان ولطف.'
                    : 'أداء عملي مستقر يوفر عليك الوقت والتكلفة المتكررة.'
                  : 'توصيل سريع لباب منزلك مع ضمان معاينة الطرد قبل الدفع.',
        })),
        solution: {
          headline: `الحل العملي المدروس: ما الذي يميز ${pName}؟`,
          body: `${strategy.mainAngle}. ${
            product.optionalInfo
              ? `معلومات إضافية: ${product.optionalInfo}. `
              : ''
          }${
            isRegulated
              ? 'تم تطوير هذا المنتج ليساعد على دعم احتياجك اليومي بطريقة مسؤولة وآمنة ضمن روتينك المعتاد.'
              : 'تم تصميم هذا المنتج ليقدم لك توازناً مثالياً بين الجودة العملية والسعر المناسب.'
          }`,
        },
        howItWorks: [
          {
            stepNumber: '01',
            title: 'سجّل طلبك في أقل من دقيقة',
            description:
              'أدخل اسمك، رقم هاتفك، ومدينتك في استمارة الطلب دون أي دفع إلكتروني مسبق.',
          },
          {
            stepNumber: '02',
            title: 'تأكيد هاتفي وشحن سريع',
            description:
              'يتصل بك فريقنا لتأكيد العنوان بدقة ثم يتم شحن طلبك ليصلك خلال 24 إلى 48 ساعة.',
          },
          {
            stepNumber: '03',
            title: 'استلم طلبك وادفع عند الاستلام',
            description:
              'توصل بطردك لباب المنزل أو العمل وادفع نقداً للموزع عند الاستلام بكل اطمئنان.',
          },
        ],
        socialProof: hasVerifiedProof
          ? {
              headline: 'معطيات وتجارب موثقة من المتجر',
              isPlaceholderRecommendation: false,
              recommendationNote:
                'تم إدراج المعطيات الموثقة التي قدمها التاجر فقط دون إضافة أي تقييمات مختلقة.',
              items: [
                {
                  label: 'بيانات موثقة من المتجر',
                  content: product.verifiedSocialProofProvided.trim(),
                  verificationType: 'Verified Merchant Input',
                },
              ],
            }
          : {
              headline: 'إرشادات إثبات الثقة الحقيقي (بدون تقييمات وهمية)',
              isPlaceholderRecommendation: true,
              recommendationNote:
                'التزاماً بمعايير المصداقية الصارمة، لا يقوم AYA باختلاق تقييمات أو أسماء زبناء وهميين. نوصي بإدراج أحد عناصر الإثبات الحقيقية التالية قبل النشر:',
              items: [
                {
                  label: 'فيديو فتح العلبة (Real Unboxing Video)',
                  content: `أضف فيديو قصير (10–15 ثانية) بهاتفك يظهر تغليف ${pName} الحقيقي ومحتويات العلبة كما تصل للزبون.`,
                  verificationType: 'Recommended Visual Proof',
                },
                {
                  label: 'لقطة قريبة للمنتج (Close-Up Demonstration)',
                  content:
                    'أضف صورة غير معدلة تبرز ملمس أو جودة تصنيع المنتج عن قرب لزيادة ثقة الزائر.',
                  verificationType: 'Recommended Product Proof',
                },
                {
                  label: 'تأكيدات الاستلام الحقيقية بعد أولى المبيعات',
                  content:
                    'بعد تسليم الطلبات الأولى، أدرج آراء الزبناء الفعلية بعد استئذانهم.',
                  verificationType: 'Post-Launch Proof',
                },
              ],
            },
        offer: {
          headline: strategy.offerStrategy,
          price: priceStr,
          oldPrice: oldPriceStr,
          discount: discountStr,
          bonuses: [
            'توصيل سريع لباب المنزل في جميع المدن',
            'الدفع نقداً عند الاستلام بعد التوصل بالطرد',
            ...(product.discountOffer ? [product.discountOffer] : []),
          ],
        },
        faq: [
          {
            question: 'كيف تتم عملية الدفع والاستلام؟',
            answer:
              'الدفع يتم نقداً عند الاستلام (Cash on Delivery). لا تحتاج إلى بطاقة بنكية أو دفع مسبق.',
          },
          {
            question: 'كم يستغرق التوصيل لمدينتي؟',
            answer:
              'يتم شحن الطلبات فور تأكيدها هاتفياً، وتصل عادةً خلال 24 إلى 48 ساعة عمل حسب المدينة.',
          },
          {
            question: `ما الذي يميز ${pName}؟`,
            answer:
              product.productDescription.trim() ||
              'يجمع بين الجودة العملية، سهولة الاستخدام، والقيمة المباشرة مقابل السعر.',
          },
        ],
        finalCta: {
          headline: `احصل على ${pName} الآن وادفع عند الاستلام`,
          body: 'سجّل معلوماتك في الاستمارة ليتم حجز طلبك والاتصال بك لتأكيد الشحن السريع لباب منزلك.',
          button: 'تأكيد الطلب الآن — الدفع عند الاستلام',
        },
      };
    }

    // English / French Blueprint
    return {
      hero: {
        hook: `Stop settling for frustrating alternatives — upgrade your daily routine with ${pName}`,
        headline: `${pName}: ${strategy.desiredOutcome}`,
        subheadline:
          product.productDescription.trim() ||
          `${strategy.mainAngle}. Available now with fast doorstep delivery and Cash-on-Delivery checkout.`,
        cta: 'Order Now — Pay on Delivery',
        visualDirection:
          'High-resolution hero photo showing the authentic product packaging and scale in natural lighting.',
      },
      problem: {
        headline: 'Why Ordinary Alternatives Fall Short',
        body: `${strategy.mainProblem} Most options on the market force you to compromise between convenience, quality, and fair pricing.`,
      },
      benefits: strategy.keyBenefits.map((b, idx) => ({
        title: b,
        description:
          idx === 0
            ? `Designed specifically around the core daily use-case of ${pName}.`
            : idx === 1
              ? isRegulated
                ? 'Formulated to help support your daily routine gently and consistently.'
                : 'Built with dependable materials for consistent everyday utility.'
              : idx === 2
                ? 'Zero complicated setup—ready to integrate into your day immediately.'
                : 'Risk-free Cash on Delivery so you only pay when your package arrives.',
      })),
      solution: {
        headline: `The Smarter Approach: How ${pName} Works`,
        body: `${strategy.mainAngle}. ${
          product.optionalInfo ? `Specifications: ${product.optionalInfo}. ` : ''
        }${
          isRegulated
            ? 'Designed to help support your routine with responsible, compliant formulation.'
            : 'Engineered to deliver practical value from day one.'
        }`,
      },
      howItWorks: [
        {
          stepNumber: '01',
          title: 'Submit Your Delivery Details',
          description:
            'Fill out your name, phone number, and city in under 60 seconds—no credit card required.',
        },
        {
          stepNumber: '02',
          title: 'Quick Phone Confirmation & Dispatch',
          description:
            'Our team confirms your delivery address by phone and dispatches your parcel within 24–48h.',
        },
        {
          stepNumber: '03',
          title: 'Receive & Pay Cash on Delivery',
          description:
            'Pay the courier in cash only when your order arrives safely at your doorstep.',
        },
      ],
      socialProof: hasVerifiedProof
        ? {
            headline: 'Verified Merchant Proof',
            isPlaceholderRecommendation: false,
            recommendationNote:
              'Displaying only authentic proof explicitly provided by the merchant.',
            items: [
              {
                label: 'Verified Merchant Note',
                content: product.verifiedSocialProofProvided.trim(),
                verificationType: 'Merchant Supplied',
              },
            ],
          }
        : {
            headline: 'Social Proof Architecture (No Fake Reviews)',
            isPlaceholderRecommendation: true,
            recommendationNote:
              'AYA strictly prohibits fabricating customer reviews or fake statistics. We recommend inserting one of the following authentic proof assets before launching ads:',
            items: [
              {
                label: 'Authentic 15s Unboxing Clip',
                content: `Record a raw smartphone clip opening ${pName} so cold traffic sees the exact physical product.`,
                verificationType: 'Recommended Asset #1',
              },
              {
                label: 'Close-Up Material / Texture Shot',
                content:
                  'Show an unretouched close-up photo highlighting build quality and packaging details.',
                verificationType: 'Recommended Asset #2',
              },
              {
                label: 'Verified Post-Delivery Feedback',
                content:
                  'Add real opt-in customer feedback once your first COD batch is delivered.',
                verificationType: 'Recommended Asset #3',
              },
            ],
          },
      offer: {
        headline: strategy.offerStrategy,
        price: priceStr,
        oldPrice: oldPriceStr,
        discount: discountStr,
        bonuses: [
          'Fast Doorstep Delivery',
          '100% Cash on Delivery (Zero Upfront Risk)',
          ...(product.discountOffer ? [product.discountOffer] : []),
        ],
      },
      faq: [
        {
          question: 'How does Cash on Delivery work?',
          answer:
            'You place your order online without paying anything upfront. You pay cash directly to the courier when the package is delivered to you.',
        },
        {
          question: 'How long does shipping take?',
          answer:
            'Once confirmed by phone, orders are typically delivered within 24 to 48 business hours depending on your city.',
        },
        {
          question: `What makes ${pName} different?`,
          answer:
            product.productDescription.trim() ||
            'It focuses on practical day-to-day performance, straightforward usage, and transparent value.',
        },
      ],
      finalCta: {
        headline: `Ready to Experience ${pName}?`,
        body: 'Complete your delivery details now and pay only when your order arrives at your door.',
        button: 'Confirm Order — Pay on Delivery',
      },
    };
  }
}

/**
 * Isolated PRODUCTION AI Provider (`ProductionAIProvider`)
 * Connects to the server-side Gemini endpoint (`/api/aya-agent/generate`).
 * Strictly separated from `DemoAIProvider`.
 */
export class ProductionAIProvider implements IAyaAIProvider {
  public readonly providerName = 'ProductionAIProvider' as const;
  private fallbackDemo = new DemoAIProvider();

  public async generateFullLandingPage(params: {
    product: AyaProductInput;
    skillContext: MarketingSkillContext | null;
    customStrategyOverride?: AyaMarketingStrategy | null;
  }): Promise<AyaGenerationResult> {
    const prompt = buildAyaGenerationPrompt(params);

    const response = await fetch('/api/aya-agent/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: AYA_SYSTEM_INSTRUCTION,
        prompt,
        product: params.product,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(
        errData?.error ||
          `ProductionAIProvider request failed (${response.status}). Switch to Demo Mode or verify GEMINI_API_KEY.`
      );
    }

    const data = await response.json();
    if (data && data.ok && data.result) {
      return {
        ...data.result,
        providerUsed: 'ProductionAIProvider',
        generatedAt: Date.now(),
      };
    }

    // Fallback if structure incomplete
    return this.fallbackDemo.generateFullLandingPage(params);
  }
}

export const demoAIProvider = new DemoAIProvider();
export const productionAIProvider = new ProductionAIProvider();
