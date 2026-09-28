import React, { useState, useRef } from 'react';
import {
  AyaGenerationResult,
  AyaGenerationStage,
  AyaLanguage,
  AyaMarketingStrategy,
  AyaProductInput,
  MarketingSkillContext,
} from '../types/ayaTypes';
import {
  extractMarketingSkillsFromZip,
  createSampleMarketingSkillsContext,
} from '../lib/zipSkillExtractor';
import { demoAIProvider, productionAIProvider } from '../lib/aiProviders';
import { AyaBlueprintRenderer } from '../renderer/AyaBlueprintRenderer';
import { MimouzzaLogo } from '../../components/ui/MimouzzaLogo';
import {
  Upload,
  FileArchive,
  CheckCircle2,
  ShieldAlert,
  Smartphone,
  Monitor,
  RefreshCw,
  Edit3,
  Check,
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Layers,
  Target,
  Code2,
  Copy,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AyaAgentWorkspaceProps {
  onBackToAdmin: () => void;
}

const GENERATION_STAGES: Array<{
  id: AyaGenerationStage;
  label: string;
  description: string;
}> = [
  {
    id: 'ANALYZING_PRODUCT',
    label: 'Analyzing Product',
    description: 'Inspecting product category, offer math, specs, and regulatory sensitivity',
  },
  {
    id: 'ANALYZING_SKILLS',
    label: 'Analyzing Marketing Skills',
    description: 'Extracting CRO frameworks, direct-response rules, and funnel principles from ZIP',
  },
  {
    id: 'BUILDING_CUSTOMER_PROFILE',
    label: 'Building Customer Profile',
    description: 'Mapping buyer persona, core pain points, desires, and top objections',
  },
  {
    id: 'CREATING_MARKETING_ANGLE',
    label: 'Creating Marketing Angle',
    description: 'Synthesizing primary emotional & practical hooks and risk-reversal offer',
  },
  {
    id: 'WRITING_CONVERSION_COPY',
    label: 'Writing Conversion Copy',
    description: 'Drafting mobile-first, compliant direct-response copy sections',
  },
  {
    id: 'BUILDING_LANDING_PAGE',
    label: 'Building Landing Page',
    description: 'Assembling structured JSON blueprint for isolated renderer',
  },
  {
    id: 'READY_FOR_REVIEW',
    label: 'Ready for Review',
    description: 'Strategy, conversion copy, and live preview ready for inspection',
  },
];

function makeProductSvgDataUri(title: string, subtitle: string, bgHex: string, accentHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="#111111" />
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#bg)" rx="48" />
    <circle cx="400" cy="340" r="190" fill="${accentHex}" fill-opacity="0.18" />
    <rect x="260" y="180" width="280" height="330" rx="36" fill="#FFFFFF" fill-opacity="0.95" stroke="${accentHex}" stroke-width="6" />
    <rect x="300" y="230" width="200" height="18" rx="9" fill="${accentHex}" />
    <text x="400" y="340" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="28" fill="#111111">${title}</text>
    <text x="400" y="385" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="18" fill="#555555">${subtitle}</text>
    <rect x="320" y="430" width="160" height="42" rx="21" fill="${accentHex}" />
    <text x="400" y="457" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="16" fill="#FFFFFF">PREMIUM COD</text>
    <text x="400" y="630" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="34" fill="#FFFFFF">${title}</text>
    <text x="400" y="675" text-anchor="middle" font-family="sans-serif" font-weight="500" font-size="22" fill="#E5E5E0">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const PRODUCT_PRESETS: Array<{
  label: string;
  categoryTag: string;
  data: AyaProductInput;
}> = [
  {
    label: 'Caffeine Focus Strips',
    categoryTag: 'Energy / Caffeine',
    data: {
      productName: 'AeroStrip Caffeine + L-Theanine',
      productDescription:
        'شرائح فموية سريعة الذوبان تحتوي على 50ملغ كافيين طبيعي مع إل-ثيانين لدعم التركيز واليقظة الذهنية خلال ثوانٍ دون الحاجة لتحضير القهوة أو المشروبات السكرية.',
      images: [
        makeProductSvgDataUri('AeroStrip Focus', '50mg Caffeine + L-Theanine', '#1E293B', '#FF6B00'),
      ],
      price: '179',
      oldPrice: '260',
      currency: 'DH',
      discountOffer: 'التوصيل مجاني + خصم خاص عند طلب علبتين',
      targetAudience: 'المهنيون، الطلبة، والسائقون الباحثون عن تركيز سريع ونظيف أثناء اليوم',
      optionalInfo: 'علبة تضم 30 شريحة بنكهة النعناع المنعش، خالية من السكر',
      verifiedSocialProofProvided: '',
      language: 'ar',
    },
  },
  {
    label: 'Retinol Night Serum',
    categoryTag: 'Skincare / Cosmetics',
    data: {
      productName: 'Lumière Retinol + Hyaluronic Complex',
      productDescription:
        'سيروم ليلي لطيف مصمم لدعم ترطيب البشرة والمساعدة في تحسين مظهر الخطوط الدقيقة ومنح البشرة ملمساً ناعماً وإشراقاً متجدداً.',
      images: [
        makeProductSvgDataUri('Lumiere Retinol', 'Hyaluronic Night Serum 30ml', '#3B0764', '#C80C32'),
      ],
      price: '219',
      oldPrice: '320',
      currency: 'DH',
      discountOffer: 'توصيل مجاني لجميع المدن والدفع عند الاستلام',
      targetAudience: 'النساء الباحثات عن روتين عناية ليلي يدعم نضارة البشرة وترطيبها',
      optionalInfo: 'عبوة 30ml بقطارة زجاجية، خالٍ من البارابين والعطور القوية',
      verifiedSocialProofProvided: '',
      language: 'ar',
    },
  },
  {
    label: 'Argan Hair Elixir',
    categoryTag: 'Hair Care',
    data: {
      productName: 'Argania Royal Hair Repair Elixir',
      productDescription:
        'إكسير مغذي للشعر بزيت الأركان المغربي النقي والكيراتين النباتي، مصمم لترطيب الخصلات الجافة وتقليل الهيشان ومنح الشعر لمعاناً طبيعياً.',
      images: [
        makeProductSvgDataUri('Argania Royal', 'Pure Moroccan Argan Elixir', '#422006', '#D97706'),
      ],
      price: '189',
      oldPrice: '280',
      currency: 'DH',
      discountOffer: 'عرض خاص: توصيل مجاني لباب المنزل',
      targetAudience: 'النساء اللواتي يعانين من جفاف الشعر والتقصف بسبب التصفيف الحراري',
      optionalInfo: 'عبوة 100ml مركزة تدوم لأكثر من شهرين من الاستخدام المنتظم',
      verifiedSocialProofProvided: '',
      language: 'ar',
    },
  },
  {
    label: 'Smart Portable Espresso',
    categoryTag: 'Electronics / Gadget',
    data: {
      productName: 'BaristaGo Pro Portable Espresso Maker',
      productDescription:
        'آلة إسبريسو محمولة بضغط 20 بار وبطارية قابلة للشحن عبر USB-C، متوافقة مع الكبسولات والبن المطحون لتحضير قهوتك في السيارة أو المكتب أو السفر.',
      images: [
        makeProductSvgDataUri('BaristaGo Pro', '20-Bar Portable Espresso USB-C', '#18181B', '#129A56'),
      ],
      price: '449',
      oldPrice: '650',
      currency: 'DH',
      discountOffer: 'حقيبة حماية مجانية + توصيل مجاني والدفع عند الاستلام',
      targetAudience: 'عشاق القهوة كثيرو التنقل والسفر والموظفون',
      optionalInfo: 'بطارية 7500mAh، تسخين ذاتي، وزن 600 غرام، سهلة التنظيف',
      verifiedSocialProofProvided: '',
      language: 'ar',
    },
  },
];

export const AyaAgentWorkspace: React.FC<AyaAgentWorkspaceProps> = ({ onBackToAdmin }) => {
  // Provider Mode: defaults to DemoAIProvider as strictly requested
  const [providerMode, setProviderMode] = useState<'demo' | 'production'>('demo');

  // Step 1: Product Input State
  const [productInput, setProductInput] = useState<AyaProductInput>({
    productName: '',
    productDescription: '',
    images: [],
    price: '199',
    oldPrice: '299',
    currency: 'DH',
    discountOffer: 'التوصيل مجاني لجميع مدن المغرب + الدفع عند الاستلام',
    targetAudience: '',
    optionalInfo: '',
    verifiedSocialProofProvided: '',
    language: 'ar',
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  // Step 2: Marketing Skills ZIP Context State
  const [skillContext, setSkillContext] = useState<MarketingSkillContext | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const [isExtractingZip, setIsExtractingZip] = useState(false);

  // Generation Pipeline State
  const [stage, setStage] = useState<AyaGenerationStage>('IDLE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [result, setResult] = useState<AyaGenerationResult | null>(null);

  // Strategy Editing & Center Panel Tabs
  const [centerTab, setCenterTab] = useState<'strategy' | 'copy' | 'json'>('strategy');
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [editableStrategy, setEditableStrategy] = useState<AyaMarketingStrategy | null>(null);

  // Preview Controls
  const [viewportMode, setViewportMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isApprovedDemo, setIsApprovedDemo] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProductInput((prev) => ({
            ...prev,
            images: [...prev.images, reader.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setProductInput((prev) => ({
      ...prev,
      images: [...prev.images, trimmed],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setProductInput((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleZipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingZip(true);
    setZipError(null);
    try {
      const extracted = await extractMarketingSkillsFromZip(file);
      setSkillContext(extracted);
    } catch (err: any) {
      setZipError(err?.message || 'Failed to parse Marketing Skills ZIP file.');
    } finally {
      setIsExtractingZip(false);
      e.target.value = '';
    }
  };

  const handleLoadSampleZip = () => {
    setZipError(null);
    setSkillContext(createSampleMarketingSkillsContext());
  };

  const runStagedGeneration = async (customStrategy?: AyaMarketingStrategy | null) => {
    if (!productInput.productName.trim()) {
      setGenerationError('يرجى إدخال اسم المنتج أولاً (Please enter a Product Name in Step 1).');
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);
    setIsApprovedDemo(false);

    const stepDelay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    try {
      setStage('ANALYZING_PRODUCT');
      await stepDelay(320);

      setStage('ANALYZING_SKILLS');
      await stepDelay(320);

      setStage('BUILDING_CUSTOMER_PROFILE');
      await stepDelay(320);

      setStage('CREATING_MARKETING_ANGLE');
      await stepDelay(320);

      setStage('WRITING_CONVERSION_COPY');

      const activeProvider =
        providerMode === 'production' ? productionAIProvider : demoAIProvider;

      const generated = await activeProvider.generateFullLandingPage({
        product: productInput,
        skillContext,
        customStrategyOverride: customStrategy || null,
      });

      setStage('BUILDING_LANDING_PAGE');
      await stepDelay(280);

      setResult(generated);
      setEditableStrategy(generated.strategy);
      setIsEditingStrategy(false);
      setStage('READY_FOR_REVIEW');
    } catch (err: any) {
      setGenerationError(err?.message || 'Error during AYA generation.');
      setStage('IDLE');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyBlueprintJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      JSON.stringify(
        {
          strategy: result.strategy,
          blueprint: result.blueprint,
        },
        null,
        2
      )
    );
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleDownloadBlueprintJson = () => {
    if (!result) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            agent: 'AYA Landing Page Agent',
            generatedAt: new Date(result.generatedAt).toISOString(),
            providerUsed: result.providerUsed,
            product: productInput,
            analysis: result.analysis,
            strategy: result.strategy,
            blueprint: result.blueprint,
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AYA_Blueprint_${(productInput.productName || 'product')
      .replace(/\s+/g, '_')
      .toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeStageIdx = GENERATION_STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#111111] flex flex-col" dir="ltr">
      {/* Top Isolated Workspace Header */}
      <header className="w-full bg-[#C80C32] text-white px-4 sm:px-6 py-3 border-b border-[#a60828] shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store Admin</span>
            </button>
            <div className="h-5 w-px bg-white/25 hidden sm:block" />
            <MimouzzaLogo height={30} />
            <div className="pl-1">
              <div className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>AYA — AI Landing Page Agent</span>
                <span className="text-[11px] font-mono bg-amber-400 text-neutral-950 px-2 py-0.5 rounded font-black">
                  ISOLATED DEMO
                </span>
              </div>
              <div className="text-[11px] text-white/80 hidden md:block">
                Direct-Response Strategy, Skills ZIP Synthesis & Structured CRO Blueprint Engine
              </div>
            </div>
          </div>

          {/* Adapter Toggle: DemoAIProvider vs ProductionAIProvider */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/15">
              <button
                type="button"
                onClick={() => setProviderMode('demo')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  providerMode === 'demo'
                    ? 'bg-white text-[#C80C32] shadow-2xs'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                DemoAIProvider (Default)
              </button>
              <button
                type="button"
                onClick={() => setProviderMode('production')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  providerMode === 'production'
                    ? 'bg-white text-[#C80C32] shadow-2xs'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                ProductionAIProvider (Gemini)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column AI Marketing Workspace */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 xl:grid-cols-12 gap-5 p-4 sm:p-6">
        {/* ============================================================
            LEFT COLUMN (4 cols): PRODUCT INPUT + SKILLS ZIP UPLOAD
            ============================================================ */}
        <div className="xl:col-span-4 space-y-5">
          {/* Quick Test Presets */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#111111]">
                Quick Product Presets (Test Adaptation)
              </span>
              <span className="text-[11px] text-neutral-500">1-Click Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRODUCT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setProductInput(preset.data);
                    setGenerationError(null);
                  }}
                  className="text-left p-2.5 rounded-xl border border-neutral-200 hover:border-[#FF6B00] bg-[#F8F8F6] hover:bg-[#FFF3EB]/60 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-extrabold text-[#111111] truncate">
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {preset.categoryTag}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1 — PRODUCT INPUT */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <div className="text-[11px] font-bold text-[#FF6B00]">STEP 1</div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#111111]">
                  Product Information
                </h2>
              </div>
              {/* Output Language Selector */}
              <select
                value={productInput.language}
                onChange={(e) =>
                  setProductInput((prev) => ({
                    ...prev,
                    language: e.target.value as AyaLanguage,
                  }))
                }
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-200 bg-[#F8F8F6] text-[#111111] cursor-pointer"
              >
                <option value="ar">العربية (COD Arabic)</option>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="space-y-3">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productInput.productName}
                  onChange={(e) =>
                    setProductInput((prev) => ({ ...prev, productName: e.target.value }))
                  }
                  placeholder="e.g., AeroStrip Caffeine / سيروم الريتينول..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Product Description *
                </label>
                <textarea
                  rows={3}
                  value={productInput.productDescription}
                  onChange={(e) =>
                    setProductInput((prev) => ({ ...prev, productDescription: e.target.value }))
                  }
                  placeholder="Describe what the product is, how it works, and its key features..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Price, Old Price & Currency */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Price *</label>
                  <input
                    type="number"
                    value={productInput.price}
                    onChange={(e) =>
                      setProductInput((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs font-mono font-bold text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">
                    Old Price
                  </label>
                  <input
                    type="number"
                    value={productInput.oldPrice}
                    onChange={(e) =>
                      setProductInput((prev) => ({ ...prev, oldPrice: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs font-mono text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">
                    Currency
                  </label>
                  <select
                    value={productInput.currency}
                    onChange={(e) =>
                      setProductInput((prev) => ({ ...prev, currency: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs font-bold text-[#111111]"
                  >
                    <option value="DH">DH (MAD)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>

              {/* Discount / Offer */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Discount / Offer Details
                </label>
                <input
                  type="text"
                  value={productInput.discountOffer}
                  onChange={(e) =>
                    setProductInput((prev) => ({ ...prev, discountOffer: e.target.value }))
                  }
                  placeholder="e.g., Free shipping + Buy 2 Save 25%"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs text-[#111111]"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={productInput.targetAudience}
                  onChange={(e) =>
                    setProductInput((prev) => ({ ...prev, targetAudience: e.target.value }))
                  }
                  placeholder="Who is the ideal buyer for this product?"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs text-[#111111]"
                />
              </div>

              {/* Optional Product Info */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">
                  Optional Product Information / Specs
                </label>
                <input
                  type="text"
                  value={productInput.optionalInfo}
                  onChange={(e) =>
                    setProductInput((prev) => ({ ...prev, optionalInfo: e.target.value }))
                  }
                  placeholder="Ingredients, size, weight, warranty, materials..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs text-[#111111]"
                />
              </div>

              {/* Product Images Upload & URL */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#111111]">Product Image(s)</label>
                  <button
                    type="button"
                    onClick={() => imageFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-[#F8F8F6]/70 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {productInput.images.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    {productInput.images.map((img, i) => (
                      <div
                        key={i}
                        className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 shrink-0 group"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2 — MARKETING SKILLS ZIP INPUT */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <div className="text-[11px] font-bold text-[#FF6B00]">STEP 2</div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#111111]">
                  Marketing Skills ZIP Upload
                </h2>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleZip}
                className="text-xs font-bold text-[#C80C32] hover:underline cursor-pointer"
              >
                Load Sample Skills ZIP
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Upload a <span className="font-mono font-bold">.zip</span> containing your marketing
              frameworks (<span className="font-mono">.md, .txt, .json, .csv, .pdf</span>). AYA
              extracts principles in-memory and blocks any executable files.
            </p>

            <div
              onClick={() => zipInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 hover:border-[#FF6B00] bg-[#F8F8F6] rounded-2xl p-4 text-center cursor-pointer transition-colors space-y-1.5"
            >
              <FileArchive className="w-7 h-7 text-[#FF6B00] mx-auto" />
              <div className="text-xs font-extrabold text-[#111111]">
                {isExtractingZip
                  ? 'Extracting safe text skills from ZIP...'
                  : 'Click to upload Marketing Skills (.zip, .md, .txt, .json)'}
              </div>
              <div className="text-[11px] text-neutral-500">
                Read-only knowledge extraction · Executables strictly ignored
              </div>
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip,.md,.txt,.json,.csv,.pdf"
                onChange={handleZipFileChange}
                className="hidden"
              />
            </div>

            {zipError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{zipError}</span>
              </div>
            )}

            {/* Extracted Skills Context Summary */}
            {skillContext && (
              <div className="bg-[#F8F8F6] rounded-xl border border-neutral-200/90 p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#129A56]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-[200px]">{skillContext.zipFileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSkillContext(null)}
                    className="text-[11px] text-neutral-400 hover:text-rose-600 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="text-[11px] text-neutral-600 flex items-center gap-2">
                  <span>{skillContext.extractedFiles.length} skill files parsed</span>
                  <span>·</span>
                  <span>{skillContext.ignoredEntries.length} non-text/unsafe files ignored</span>
                </div>

                {/* Detected Frameworks */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-[#111111]">
                    Detected Marketing Frameworks:
                  </div>
                  <div className="space-y-1">
                    {skillContext.detectedFrameworks.map((fw, i) => (
                      <div key={i} className="text-[11px] text-neutral-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                        <span>{fw}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extracted Files List */}
                <div className="space-y-1 pt-1 border-t border-neutral-200/80">
                  <div className="text-[11px] font-bold text-[#111111]">Parsed Files:</div>
                  {skillContext.extractedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px] text-neutral-600 font-mono bg-white px-2.5 py-1 rounded border border-neutral-200/60"
                    >
                      <span className="truncate max-w-[190px]">{f.fileName}</span>
                      <span className="text-neutral-400">{Math.round(f.sizeBytes / 1024 || 1)} KB</span>
                    </div>
                  ))}
                </div>

                {/* Blocked / Ignored Files Audit */}
                {skillContext.ignoredEntries.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-neutral-200/80">
                    <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Security Filter (Ignored Entries):</span>
                    </div>
                    {skillContext.ignoredEntries.slice(0, 4).map((ig, i) => (
                      <div key={i} className="text-[10px] text-neutral-500 truncate">
                        {ig.fileName} — {ig.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Primary Generate Button */}
            {generationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {generationError}
              </div>
            )}

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => runStagedGeneration(null)}
              className="w-full py-3.5 px-5 rounded-xl bg-[#C80C32] hover:bg-[#a60828] disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AYA is Generating Strategy & Blueprint...</span>
                </>
              ) : (
                <span>Generate Landing Page</span>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================
            CENTER COLUMN (4 cols): GENERATION STAGES, STRATEGY & COPY
            ============================================================ */}
        <div className="xl:col-span-4 space-y-5">
          {/* Generation Stages Pipeline */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-[#FF6B00]">STEP 3 — WORKFLOW</div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#111111]">
                  AYA Generation Stages
                </h2>
              </div>
              {result && (
                <span className="text-[11px] font-mono text-[#129A56] font-bold">
                  {result.providerUsed}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {GENERATION_STAGES.map((st, idx) => {
                const isCompleted =
                  stage === 'READY_FOR_REVIEW' || (activeStageIdx > idx && activeStageIdx !== -1);
                const isCurrent = stage === st.id && stage !== 'READY_FOR_REVIEW';

                return (
                  <div
                    key={st.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                      isCurrent
                        ? 'bg-[#FFF3EB] border-[#FF6B00] text-[#111111]'
                        : isCompleted
                          ? 'bg-[#E8F8F0]/50 border-[#129A56]/30 text-[#111111]'
                          : 'bg-[#F8F8F6] border-neutral-200/70 text-neutral-400'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCurrent ? (
                        <Loader2 className="w-4 h-4 text-[#FF6B00] animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#129A56]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-neutral-300 inline-block" />
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold">{st.label}</div>
                      <div className="text-[11px] text-neutral-500">{st.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategy & Copy Inspector */}
          {!result ? (
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-8 text-center space-y-2">
              <Target className="w-8 h-8 text-neutral-300 mx-auto" />
              <div className="text-sm font-extrabold text-[#111111]">
                No Strategy Generated Yet
              </div>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                Enter your product details on the left (or select a Quick Preset), optionally
                upload your Marketing Skills ZIP, and click{' '}
                <span className="font-bold text-[#111111]">"Generate Landing Page"</span>.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 space-y-4">
              {/* Segmented Tabs: A. Marketing Strategy | B. Generated Copy | C. Raw JSON */}
              <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-1 p-1 bg-[#F8F8F6] rounded-xl border border-neutral-200/80">
                  <button
                    type="button"
                    onClick={() => setCenterTab('strategy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      centerTab === 'strategy'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-neutral-500 hover:text-[#111111]'
                    }`}
                  >
                    A. Strategy
                  </button>
                  <button
                    type="button"
                    onClick={() => setCenterTab('copy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      centerTab === 'copy'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-neutral-500 hover:text-[#111111]'
                    }`}
                  >
                    B. Generated Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setCenterTab('json')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      centerTab === 'json'
                        ? 'bg-white text-[#111111] shadow-2xs'
                        : 'text-neutral-500 hover:text-[#111111]'
                    }`}
                  >
                    JSON Blueprint
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCenterTab('strategy');
                    setIsEditingStrategy((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-[#111111] text-xs font-bold text-[#111111] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingStrategy ? 'Done Editing' : 'Edit Strategy'}</span>
                </button>
              </div>

              {/* TAB A: MARKETING STRATEGY */}
              {centerTab === 'strategy' && editableStrategy && (
                <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1 text-xs">
                  {/* Safety & Category Audit */}
                  <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/80 space-y-1">
                    <div className="font-extrabold text-[#111111]">
                      Category: <span className="font-mono">{result.analysis.detectedCategory}</span>
                    </div>
                    {result.safetyComplianceNotes.map((note, i) => (
                      <div key={i} className="text-[11px] text-neutral-600">
                        • {note}
                      </div>
                    ))}
                  </div>

                  {isEditingStrategy ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-[#111111] mb-1">
                          Target Audience
                        </label>
                        <textarea
                          rows={2}
                          value={editableStrategy.targetAudience}
                          onChange={(e) =>
                            setEditableStrategy({
                              ...editableStrategy,
                              targetAudience: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-300 bg-[#F8F8F6]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#111111] mb-1">Main Problem</label>
                        <textarea
                          rows={2}
                          value={editableStrategy.mainProblem}
                          onChange={(e) =>
                            setEditableStrategy({
                              ...editableStrategy,
                              mainProblem: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-300 bg-[#F8F8F6]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#111111] mb-1">
                          Desired Outcome
                        </label>
                        <input
                          type="text"
                          value={editableStrategy.desiredOutcome}
                          onChange={(e) =>
                            setEditableStrategy({
                              ...editableStrategy,
                              desiredOutcome: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-300 bg-[#F8F8F6]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#111111] mb-1">Main Angle</label>
                        <textarea
                          rows={2}
                          value={editableStrategy.mainAngle}
                          onChange={(e) =>
                            setEditableStrategy({
                              ...editableStrategy,
                              mainAngle: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-300 bg-[#F8F8F6]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#111111] mb-1">
                          Offer Strategy
                        </label>
                        <input
                          type="text"
                          value={editableStrategy.offerStrategy}
                          onChange={(e) =>
                            setEditableStrategy({
                              ...editableStrategy,
                              offerStrategy: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-300 bg-[#F8F8F6]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => runStagedGeneration(editableStrategy)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-extrabold text-xs cursor-pointer"
                      >
                        Apply Edited Strategy & Regenerate Copy
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/70">
                        <div className="font-extrabold text-[#111111] mb-1">Target Audience</div>
                        <p className="text-neutral-700 leading-relaxed">
                          {result.strategy.targetAudience}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/70">
                        <div className="font-extrabold text-[#111111] mb-1">Main Problem</div>
                        <p className="text-neutral-700 leading-relaxed">
                          {result.strategy.mainProblem}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/70">
                        <div className="font-extrabold text-[#111111] mb-1">Desired Outcome</div>
                        <p className="text-neutral-700 leading-relaxed">
                          {result.strategy.desiredOutcome}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/70">
                        <div className="font-extrabold text-[#111111] mb-1">
                          Main Conversion Angle
                        </div>
                        <p className="text-neutral-700 leading-relaxed">
                          {result.strategy.mainAngle}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/70 space-y-1">
                        <div className="font-extrabold text-[#111111]">Key Benefits</div>
                        {result.strategy.keyBenefits.map((b, i) => (
                          <div key={i} className="text-neutral-700">
                            • {b}
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/70 space-y-1">
                        <div className="font-extrabold text-[#111111]">
                          Customer Objections Addressed
                        </div>
                        {result.strategy.objections.map((obj, i) => (
                          <div key={i} className="text-neutral-700">
                            • {obj}
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/70">
                        <div className="font-extrabold text-[#111111] mb-1">
                          Offer & Urgency Strategy
                        </div>
                        <p className="text-neutral-700 leading-relaxed">
                          {result.strategy.offerStrategy} — {result.strategy.urgencyStrategy}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8F8F6] border border-neutral-200/70">
                        <div className="font-extrabold text-[#111111] mb-1">
                          Social Proof Policy
                        </div>
                        <p className="text-neutral-700 leading-relaxed">
                          {result.strategy.socialProofStrategy}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB B: GENERATED CONVERSION COPY */}
              {centerTab === 'copy' && (
                <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/80 space-y-1.5">
                    <div className="font-extrabold text-[#C80C32]">1. HERO COPY</div>
                    <div>
                      <span className="font-bold">Hook:</span> {result.blueprint.hero.hook}
                    </div>
                    <div>
                      <span className="font-bold">Headline:</span> {result.blueprint.hero.headline}
                    </div>
                    <div>
                      <span className="font-bold">Subheadline:</span>{' '}
                      {result.blueprint.hero.subheadline}
                    </div>
                    <div>
                      <span className="font-bold">Primary CTA:</span> {result.blueprint.hero.cta}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/80 space-y-1.5">
                    <div className="font-extrabold text-[#C80C32]">2. PROBLEM & SOLUTION</div>
                    <div>
                      <span className="font-bold">{result.blueprint.problem.headline}:</span>{' '}
                      {result.blueprint.problem.body}
                    </div>
                    <div className="pt-1 border-t border-neutral-200">
                      <span className="font-bold">{result.blueprint.solution.headline}:</span>{' '}
                      {result.blueprint.solution.body}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/80 space-y-1.5">
                    <div className="font-extrabold text-[#C80C32]">3. BENEFITS BREAKDOWN</div>
                    {result.blueprint.benefits.map((b, i) => (
                      <div key={i}>
                        <span className="font-bold">• {b.title}:</span> {b.description}
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/80 space-y-1.5">
                    <div className="font-extrabold text-[#C80C32]">4. OFFER & FINAL CTA</div>
                    <div>
                      <span className="font-bold">Offer:</span> {result.blueprint.offer.headline} (
                      {result.blueprint.offer.price})
                    </div>
                    <div>
                      <span className="font-bold">Final CTA:</span>{' '}
                      {result.blueprint.finalCta.headline} — {result.blueprint.finalCta.button}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB C: RAW STRUCTURED JSON */}
              {centerTab === 'json' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-600">
                      Structured Strategy & Blueprint JSON
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyBlueprintJson}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8F8F6] border border-neutral-200 text-xs font-bold cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadBlueprintJson}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111111] text-white text-xs font-bold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-neutral-900 text-emerald-300 font-mono text-[11px] max-h-[560px] overflow-auto">
                    {JSON.stringify(
                      {
                        strategy: result.strategy,
                        blueprint: result.blueprint,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================
            RIGHT COLUMN (4 cols): LIVE LANDING PAGE PREVIEW & CONTROLS
            ============================================================ */}
        <div className="xl:col-span-4 flex flex-col space-y-4">
          {/* Preview Action Bar with all 6 required buttons */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-[#111111]">
                Isolated Landing Page Preview
              </div>

              {/* Viewport Toggle Buttons: Preview Mobile / Preview Desktop */}
              <div className="flex items-center gap-1 bg-[#F8F8F6] p-1 rounded-xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setViewportMode('mobile')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    viewportMode === 'mobile'
                      ? 'bg-white text-[#111111] shadow-2xs'
                      : 'text-neutral-500 hover:text-[#111111]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Preview Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    viewportMode === 'desktop'
                      ? 'bg-white text-[#111111] shadow-2xs'
                      : 'text-neutral-500 hover:text-[#111111]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Preview Desktop</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Regenerate | Edit Strategy | Regenerate Copy | Approve */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-100">
              <button
                type="button"
                disabled={!result || isGenerating}
                onClick={() => runStagedGeneration(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F8F6] hover:bg-neutral-200/80 disabled:opacity-40 text-xs font-bold text-[#111111] border border-neutral-200 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                disabled={!result}
                onClick={() => {
                  setCenterTab('strategy');
                  setIsEditingStrategy(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F8F6] hover:bg-neutral-200/80 disabled:opacity-40 text-xs font-bold text-[#111111] border border-neutral-200 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Strategy</span>
              </button>

              <button
                type="button"
                disabled={!result || isGenerating}
                onClick={() => runStagedGeneration(editableStrategy)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F8F6] hover:bg-neutral-200/80 disabled:opacity-40 text-xs font-bold text-[#111111] border border-neutral-200 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Regenerate Copy</span>
              </button>

              <button
                type="button"
                disabled={!result}
                onClick={() => setIsApprovedDemo(true)}
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#129A56] hover:bg-[#0e7d45] disabled:opacity-40 text-xs font-extrabold text-white shadow-2xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            </div>

            {isApprovedDemo && (
              <div className="p-3 rounded-xl bg-[#E8F8F0] border border-[#129A56]/30 text-xs text-[#111111] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#129A56] shrink-0" />
                  <span>
                    <strong className="text-[#129A56]">Approved in DEMO Mode:</strong> Blueprint
                    validated and ready. (Isolated — not published to live store).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBlueprintJson}
                  className="px-2.5 py-1 rounded-md bg-white border border-[#129A56]/30 text-[#129A56] font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Download JSON
                </button>
              </div>
            )}
          </div>

          {/* Live Preview Frame */}
          <div className="flex-1 min-h-[680px] max-h-[820px] rounded-2xl border border-neutral-200/90 overflow-hidden bg-[#EBEAE4]">
            {result ? (
              <AyaBlueprintRenderer
                blueprint={result.blueprint}
                product={productInput}
                viewportMode={viewportMode}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2 text-neutral-500">
                <Layers className="w-10 h-10 text-neutral-300" />
                <div className="text-sm font-extrabold text-[#111111]">
                  Live Landing Page Preview Area
                </div>
                <p className="text-xs max-w-xs leading-relaxed">
                  Once AYA finishes generating your strategy and conversion copy, the interactive
                  mobile & desktop landing page preview will render here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
