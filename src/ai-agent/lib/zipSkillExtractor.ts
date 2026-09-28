import {
  ExtractedSkillFile,
  IgnoredZipEntry,
  MarketingSkillContext,
} from '../types/ayaTypes';

const ALLOWED_SAFE_EXTENSIONS = new Set(['.md', '.txt', '.json', '.csv', '.pdf']);

const BLOCKED_EXECUTABLE_EXTENSIONS = new Set([
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.sh',
  '.bash',
  '.bat',
  '.cmd',
  '.ps1',
  '.msi',
  '.app',
  '.dmg',
  '.pkg',
  '.deb',
  '.rpm',
  '.bin',
  '.com',
  '.scr',
  '.vbs',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.py',
  '.php',
  '.rb',
  '.pl',
  '.jar',
  '.class',
  '.wasm',
  '.apk',
  '.ipa',
]);

const MAX_SINGLE_FILE_BYTES = 512 * 1024; // 512 KB per text file
const MAX_TOTAL_EXTRACTED_BYTES = 5 * 1024 * 1024; // 5 MB max total extracted text
const MAX_FILES_COUNT = 60;

const KNOWN_MARKETING_FRAMEWORKS: Array<{ name: string; keywords: string[] }> = [
  {
    name: 'PAS (Problem-Agitate-Solve)',
    keywords: ['pas', 'problem-agitate-solve', 'problem agitate', 'agitate', 'تفاقم المشكلة'],
  },
  {
    name: 'AIDA (Attention-Interest-Desire-Action)',
    keywords: ['aida', 'attention interest desire action', 'attention-interest'],
  },
  {
    name: 'Hook-Story-Offer (HSO)',
    keywords: ['hook-story-offer', 'hook story offer', 'russell brunson', 'value ladder'],
  },
  {
    name: 'Before-After-Bridge (BAB)',
    keywords: ['before-after-bridge', 'before after bridge', 'desired state'],
  },
  {
    name: 'COD Risk-Reversal & Micro-Commitment',
    keywords: [
      'cash on delivery',
      'cod',
      'الدفع عند الاستلام',
      'risk reversal',
      'micro-commitment',
      'inspection before payment',
    ],
  },
  {
    name: 'Value Stack & Price Anchoring',
    keywords: ['value stack', 'price anchoring', 'anchor price', 'compare at', 'bonus stack'],
  },
  {
    name: 'Objection Pre-emption Matrix',
    keywords: ['objection', 'faq matrix', 'skepticism', 'friction removal', 'الاعتراضات'],
  },
  {
    name: 'Above-the-Fold 5-Second Clarity Test',
    keywords: ['above the fold', '5-second test', 'hero clarity', 'visual hierarchy'],
  },
  {
    name: 'Jobs-To-Be-Done (JTBD) Positioning',
    keywords: ['jtbd', 'jobs to be done', 'functional job', 'emotional job'],
  },
  {
    name: 'Eugene Schwartz Awareness Stages',
    keywords: [
      'awareness stage',
      'problem aware',
      'solution aware',
      'product aware',
      'most aware',
      'schwartz',
    ],
  },
];

function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  if (idx === -1) return '';
  return fileName.slice(idx).toLowerCase().trim();
}

function sanitizeZipPath(rawPath: string): { safe: boolean; cleanPath: string; reason?: string } {
  const normalized = (rawPath || '').replace(/\\/g, '/').trim();
  if (!normalized) {
    return { safe: false, cleanPath: '', reason: 'Empty path' };
  }
  if (normalized.includes('..') || normalized.startsWith('/')) {
    return {
      safe: false,
      cleanPath: normalized,
      reason: 'Blocked path traversal attempt (.. or root path)',
    };
  }
  if (
    normalized.startsWith('__MACOSX/') ||
    normalized.includes('/.__') ||
    normalized.endsWith('.DS_Store')
  ) {
    return {
      safe: false,
      cleanPath: normalized,
      reason: 'Ignored OS metadata file',
    };
  }
  return { safe: true, cleanPath: normalized };
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Browser DecompressionStream is not supported in this environment.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  await writer.write(compressed as unknown as BufferSource);
  await writer.close();

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLen = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      totalLen += value.byteLength;
      if (totalLen > MAX_SINGLE_FILE_BYTES) {
        await reader.cancel();
        throw new Error('File exceeds safe uncompressed size limit (512 KB).');
      }
      chunks.push(value);
    }
  }

  const output = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function extractReadableTextFromPdfBytes(bytes: Uint8Array): string {
  const rawLatin = new TextDecoder('latin1').decode(bytes);
  const matches: string[] = [];

  // Extract parenthesized text strings inside PDF text blocks BT ... ET
  const textRegex = /\(([^()\\]{3,200})\)/g;
  let m: RegExpExecArray | null;
  while ((m = textRegex.exec(rawLatin)) !== null) {
    const cleaned = m[1].replace(/[^\x20-\x7E\u0600-\u06FF]/g, ' ').trim();
    if (cleaned.length >= 3) {
      matches.push(cleaned);
    }
  }

  if (matches.length > 0) {
    return matches.join(' ');
  }
  return '[PDF document uploaded — binary stream filtered; use .md, .txt, .json, or .csv for full text precision]';
}

function analyzeSkillText(text: string, ext: string): {
  frameworks: string[];
  rules: string[];
} {
  const lower = text.toLowerCase();
  const frameworks: string[] = [];

  for (const fw of KNOWN_MARKETING_FRAMEWORKS) {
    if (fw.keywords.some((kw) => lower.includes(kw))) {
      frameworks.push(fw.name);
    }
  }

  const rules: string[] = [];

  if (ext === '.json') {
    try {
      const parsed = JSON.parse(text);
      const collectStrings = (obj: any) => {
        if (!obj) return;
        if (typeof obj === 'string' && obj.trim().length > 12 && obj.trim().length < 220) {
          rules.push(obj.trim());
        } else if (Array.isArray(obj)) {
          obj.slice(0, 15).forEach(collectStrings);
        } else if (typeof obj === 'object') {
          Object.values(obj).slice(0, 15).forEach(collectStrings);
        }
      };
      collectStrings(parsed);
    } catch {
      // Fallback to line parsing
    }
  }

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length < 15 || line.length > 220) continue;
    if (
      line.startsWith('- ') ||
      line.startsWith('* ') ||
      /^\d+[\.\)]\s+/.test(line) ||
      line.toLowerCase().includes('rule:') ||
      line.toLowerCase().includes('principle:') ||
      line.toLowerCase().includes('always ') ||
      line.toLowerCase().includes('never ') ||
      line.includes('قاعدة') ||
      line.includes('مبدأ')
    ) {
      const cleaned = line.replace(/^[-*]\s+|\d+[\.\)]\s+/g, '').trim();
      if (cleaned.length >= 12 && !rules.includes(cleaned)) {
        rules.push(cleaned);
      }
    }
    if (rules.length >= 18) break;
  }

  return { frameworks, rules };
}

/**
 * Pure TypeScript in-memory ZIP parser using Central Directory + Local File Headers.
 * Zero external native dependencies; strictly safe against arbitrary code execution.
 */
export async function extractMarketingSkillsFromZip(
  file: File
): Promise<MarketingSkillContext> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  const extractedFiles: ExtractedSkillFile[] = [];
  const ignoredEntries: IgnoredZipEntry[] = [];
  let totalExtractedBytes = 0;

  // Check if user uploaded a direct safe text file (.md, .txt, .json, .csv)
  const uploadedExt = getFileExtension(file.name);
  if (ALLOWED_SAFE_EXTENSIONS.has(uploadedExt) && file.name.toLowerCase() !== '.zip') {
    const rawText =
      uploadedExt === '.pdf'
        ? extractReadableTextFromPdfBytes(bytes)
        : new TextDecoder('utf-8').decode(bytes.slice(0, MAX_SINGLE_FILE_BYTES));
    const { frameworks, rules } = analyzeSkillText(rawText, uploadedExt);
    extractedFiles.push({
      fileName: file.name,
      extension: uploadedExt,
      sizeBytes: file.size,
      contentSnippet: rawText.slice(0, 320),
      fullText: rawText,
      detectedFrameworks: frameworks,
      detectedRules: rules,
    });
    return buildMarketingSkillContext(file.name, extractedFiles, ignoredEntries);
  }

  // Locate End of Central Directory (EOCD) signature: 0x06054b50
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minEocdSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error(
      'Invalid ZIP archive: Could not locate Central Directory header. Please upload a valid .zip file.'
    );
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  let ptr = centralDirOffset;
  const decoder = new TextDecoder('utf-8');

  for (let entryIdx = 0; entryIdx < totalEntries; entryIdx++) {
    if (ptr + 46 > bytes.length) break;
    const sig = view.getUint32(ptr, true);
    if (sig !== 0x02014b50) break;

    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const uncompressedSize = view.getUint32(ptr + 24, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraFieldLen = view.getUint16(ptr + 30, true);
    const fileCommentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const rawFileName = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + fileNameLen));
    ptr += 46 + fileNameLen + extraFieldLen + fileCommentLen;

    // Skip directories
    if (rawFileName.endsWith('/')) continue;

    if (extractedFiles.length >= MAX_FILES_COUNT) {
      ignoredEntries.push({
        fileName: rawFileName,
        reason: `Skipped (exceeded ${MAX_FILES_COUNT} files safety cap)`,
      });
      continue;
    }

    const pathCheck = sanitizeZipPath(rawFileName);
    if (!pathCheck.safe) {
      ignoredEntries.push({
        fileName: rawFileName,
        reason: pathCheck.reason || 'Unsafe path',
      });
      continue;
    }

    const ext = getFileExtension(pathCheck.cleanPath);
    if (BLOCKED_EXECUTABLE_EXTENSIONS.has(ext)) {
      ignoredEntries.push({
        fileName: pathCheck.cleanPath,
        reason: `Security Policy: Executable/code file (${ext}) blocked`,
      });
      continue;
    }

    if (!ALLOWED_SAFE_EXTENSIONS.has(ext)) {
      ignoredEntries.push({
        fileName: pathCheck.cleanPath,
        reason: `Unsupported file format (${ext || 'no extension'}) — only .md, .txt, .json, .csv, .pdf allowed`,
      });
      continue;
    }

    if (uncompressedSize > MAX_SINGLE_FILE_BYTES) {
      ignoredEntries.push({
        fileName: pathCheck.cleanPath,
        reason: `File too large (${Math.round(uncompressedSize / 1024)} KB > 512 KB safety limit)`,
      });
      continue;
    }

    if (totalExtractedBytes + uncompressedSize > MAX_TOTAL_EXTRACTED_BYTES) {
      ignoredEntries.push({
        fileName: pathCheck.cleanPath,
        reason: 'Total extracted text budget (5 MB) reached',
      });
      continue;
    }

    // Read Local File Header (0x04034b50)
    if (localHeaderOffset + 30 > bytes.length) continue;
    const localSig = view.getUint32(localHeaderOffset, true);
    if (localSig !== 0x04034b50) continue;

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > bytes.length) continue;

    const compressedSlice = bytes.subarray(dataStart, dataEnd);
    let fileBytes: Uint8Array;

    try {
      if (compressionMethod === 0) {
        fileBytes = compressedSlice;
      } else if (compressionMethod === 8) {
        fileBytes = await inflateRawBytes(compressedSlice);
      } else {
        ignoredEntries.push({
          fileName: pathCheck.cleanPath,
          reason: `Unsupported ZIP compression method (${compressionMethod})`,
        });
        continue;
      }
    } catch (err: any) {
      ignoredEntries.push({
        fileName: pathCheck.cleanPath,
        reason: err?.message || 'Decompression failed',
      });
      continue;
    }

    totalExtractedBytes += fileBytes.byteLength;

    const fullText =
      ext === '.pdf'
        ? extractReadableTextFromPdfBytes(fileBytes)
        : decoder.decode(fileBytes).trim();

    if (!fullText) continue;

    const { frameworks, rules } = analyzeSkillText(fullText, ext);

    extractedFiles.push({
      fileName: pathCheck.cleanPath,
      extension: ext,
      sizeBytes: fileBytes.byteLength,
      contentSnippet: fullText.slice(0, 320),
      fullText,
      detectedFrameworks: frameworks,
      detectedRules: rules,
    });
  }

  return buildMarketingSkillContext(file.name, extractedFiles, ignoredEntries);
}

function buildMarketingSkillContext(
  zipFileName: string,
  extractedFiles: ExtractedSkillFile[],
  ignoredEntries: IgnoredZipEntry[]
): MarketingSkillContext {
  const frameworkSet = new Set<string>();
  const allRules: string[] = [];

  for (const f of extractedFiles) {
    f.detectedFrameworks.forEach((fw) => frameworkSet.add(fw));
    for (const r of f.detectedRules) {
      if (!allRules.includes(r)) {
        allRules.push(r);
      }
    }
  }

  if (frameworkSet.size === 0 && extractedFiles.length > 0) {
    frameworkSet.add('PAS (Problem-Agitate-Solve)');
    frameworkSet.add('COD Risk-Reversal & Micro-Commitment');
    frameworkSet.add('Value Stack & Price Anchoring');
  }

  const extractedPrinciples =
    allRules.length > 0
      ? allRules.slice(0, 8)
      : [
          'Lead with the primary customer problem and immediate sensory or functional transformation.',
          'Translate every technical product specification into a concrete daily-life benefit.',
          'Pre-empt the top 4 buying objections before presenting the final offer stack.',
          'Emphasize Cash-on-Delivery (COD) inspection and zero upfront financial risk.',
        ];

  const copywritingRules =
    allRules.length > 8
      ? allRules.slice(8, 16)
      : [
          'Write concise, scannable mobile-first blocks (maximum 2-3 lines per paragraph).',
          'Use specific, concrete verbs instead of vague superlatives or generic AI clichés.',
          'Never fabricate customer reviews, clinical claims, or fake scarcity counters.',
          'Pair every CTA button with a friction-reducing micro-copy reassurance.',
        ];

  const croCheckpoints = [
    'Above-the-Fold 5-Second Test: Clear hook + specific value proposition + visible CTA.',
    'Mechanism Explanation: Show HOW and WHY the product delivers its promised outcome.',
    'Offer Value Stack: Contrast old price vs. current offer price with clear bundle value.',
    'Zero-Risk COD Checkout: Highlight pay-upon-delivery to maximize cold-traffic conversion.',
  ];

  const compiledContextSummary = extractedFiles
    .map(
      (f) =>
        `=== SKILL FILE: ${f.fileName} ===\nFrameworks: ${
          f.detectedFrameworks.join(', ') || 'General CRO'
        }\nKey Extract:\n${f.fullText.slice(0, 1500)}`
    )
    .join('\n\n');

  return {
    zipFileName,
    uploadedAt: Date.now(),
    extractedFiles,
    ignoredEntries,
    detectedFrameworks: Array.from(frameworkSet),
    extractedPrinciples,
    copywritingRules,
    croCheckpoints,
    compiledContextSummary,
  };
}

/**
 * Generates an instant, realistic Marketing Skills ZIP Context for 1-click DEMO testing
 * without requiring the user to build a ZIP archive manually first.
 */
export function createSampleMarketingSkillsContext(): MarketingSkillContext {
  const sampleFiles: ExtractedSkillFile[] = [
    {
      fileName: 'skills/01-direct-response-hooks-and-pas.md',
      extension: '.md',
      sizeBytes: 2480,
      contentSnippet:
        '# Direct Response Hook & PAS Architecture\n- Always call out the exact audience frustration in the first 7 words.\n- Agitate the hidden cost of status-quo solutions before introducing the product mechanism.',
      fullText: `# Direct Response Hook & PAS Architecture
- Rule: Always call out the exact audience frustration or desired state in the first 7 words of the hook.
- Principle: Agitate the hidden daily cost of inferior alternatives before introducing the product's unique mechanism.
- Rule: Headline must promise a specific, believable outcome without exaggerated medical or miracle claims.
- Framework: PAS (Problem-Agitate-Solve) combined with Before-After-Bridge (BAB).`,
      detectedFrameworks: ['PAS (Problem-Agitate-Solve)', 'Before-After-Bridge (BAB)'],
      detectedRules: [
        'Always call out the exact audience frustration or desired state in the first 7 words of the hook.',
        'Agitate the hidden daily cost of inferior alternatives before introducing the product unique mechanism.',
        'Headline must promise a specific, believable outcome without exaggerated medical or miracle claims.',
      ],
    },
    {
      fileName: 'skills/02-cod-ecommerce-cro-playbook.md',
      extension: '.md',
      sizeBytes: 3120,
      contentSnippet:
        '# Cash-On-Delivery (COD) High-Converting Funnel Playbook\n- Cold social traffic requires immediate Risk Reversal.\n- Pair every primary CTA with "Pay only when you receive and inspect your order".',
      fullText: `# Cash-On-Delivery (COD) High-Converting Funnel Playbook
- Principle: Cold social traffic from Meta & TikTok ads converts 2.4x higher when COD Risk Reversal is placed directly below the primary CTA.
- Rule: Break down how the product works into 3 simple, chronological steps to eliminate usage confusion.
- Rule: Use Value Stack & Price Anchoring to show why the current offer is a no-brainer compared to the old price.
- Framework: COD Risk-Reversal & Micro-Commitment, Value Stack & Price Anchoring, Above-the-Fold 5-Second Clarity Test.`,
      detectedFrameworks: [
        'COD Risk-Reversal & Micro-Commitment',
        'Value Stack & Price Anchoring',
        'Above-the-Fold 5-Second Clarity Test',
      ],
      detectedRules: [
        'Cold social traffic from Meta & TikTok ads converts higher when COD Risk Reversal is placed directly below the primary CTA.',
        'Break down how the product works into 3 simple, chronological steps to eliminate usage confusion.',
        'Use Value Stack & Price Anchoring to show why the current offer is a no-brainer compared to the old price.',
      ],
    },
    {
      fileName: 'skills/03-objection-crusher-and-safety.json',
      extension: '.json',
      sizeBytes: 1890,
      contentSnippet:
        '{"framework":"Objection Pre-emption Matrix","rules":["Never invent fake customer reviews or fake clinical statistics","For cosmetics and supplements use compliant support language"]}',
      fullText: JSON.stringify(
        {
          framework: 'Objection Pre-emption Matrix &Eugene Schwartz Awareness Stages',
          rules: [
            'Never invent fake customer reviews, fake star counts, or fabricated clinical statistics.',
            'For cosmetics, skincare, and supplements, always use compliant phrasing: helps support, designed to, formulated to help.',
            'Answer delivery speed, payment upon inspection, and product authenticity in the FAQ section.',
          ],
        },
        null,
        2
      ),
      detectedFrameworks: [
        'Objection Pre-emption Matrix',
        'Eugene Schwartz Awareness Stages',
      ],
      detectedRules: [
        'Never invent fake customer reviews, fake star counts, or fabricated clinical statistics.',
        'For cosmetics, skincare, and supplements, always use compliant phrasing: helps support, designed to, formulated to help.',
        'Answer delivery speed, payment upon inspection, and product authenticity in the FAQ section.',
      ],
    },
  ];

  const ignored: IgnoredZipEntry[] = [
    { fileName: '__MACOSX/.DS_Store', reason: 'Ignored OS metadata file' },
    {
      fileName: 'scripts/scraper.py',
      reason: 'Security Policy: Executable/code file (.py) blocked',
    },
  ];

  return buildMarketingSkillContext(
    'Expert_CRO_DirectResponse_Skills_Pack.zip',
    sampleFiles,
    ignored
  );
}
