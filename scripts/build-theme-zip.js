import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const BUILD_DIR = path.join(ROOT_DIR, 'build', 'youcan-big-offer-theme');
const PUBLIC_DOWNLOADS_DIR = path.join(ROOT_DIR, 'public', 'downloads');

// Ensure directories exist
if (!fs.existsSync(PUBLIC_DOWNLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_DOWNLOADS_DIR, { recursive: true });
}
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Load product data from .convex-server-db.json
const dbPath = path.join(ROOT_DIR, '.convex-server-db.json');
let product = null;
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  product = (db.products || []).find((p) => p.slug === '30-6993') || db.products[0];
}

if (!product) {
  console.error('No product found in database!');
  process.exit(1);
}

// Load image database
const imagesDbPath = path.join(ROOT_DIR, '.convex-images-db.json');
let imagesDb = {};
if (fs.existsSync(imagesDbPath)) {
  imagesDb = JSON.parse(fs.readFileSync(imagesDbPath, 'utf8'));
}

console.log('Building theme package for product:', product.name, product.slug);

// Create subfolders
const folders = [
  'config',
  'layout',
  'templates',
  'sections',
  'snippets',
  'assets',
  'assets/images',
  'assets/css',
  'assets/js',
  'locales',
];
folders.forEach((f) => fs.mkdirSync(path.join(BUILD_DIR, f), { recursive: true }));

// 1. Export real image files into assets/images/
const exportedImageMap = {};
(product.images || []).forEach((imgRef, index) => {
  if (imgRef.startsWith('/api/db/image/')) {
    const imgId = imgRef.replace('/api/db/image/', '');
    const imgData = imagesDb[imgId];
    if (imgData && imgData.base64) {
      let ext = 'jpg';
      if (imgData.mimeType.includes('png')) ext = 'png';
      else if (imgData.mimeType.includes('webp')) ext = 'webp';
      const fileName = `product_img_${index + 1}.${ext}`;
      const filePath = path.join(BUILD_DIR, 'assets', 'images', fileName);
      fs.writeFileSync(filePath, Buffer.from(imgData.base64, 'base64'));
      exportedImageMap[imgRef] = `assets/images/${fileName}`;
    }
  }
});

(product.descriptionImages || []).forEach((imgRef, index) => {
  if (imgRef.startsWith('/api/db/image/')) {
    const imgId = imgRef.replace('/api/db/image/', '');
    const imgData = imagesDb[imgId];
    if (imgData && imgData.base64) {
      let ext = 'jpg';
      if (imgData.mimeType.includes('png')) ext = 'png';
      else if (imgData.mimeType.includes('webp')) ext = 'webp';
      const fileName = `desc_img_${index + 1}.${ext}`;
      const filePath = path.join(BUILD_DIR, 'assets', 'images', fileName);
      fs.writeFileSync(filePath, Buffer.from(imgData.base64, 'base64'));
      exportedImageMap[imgRef] = `assets/images/${fileName}`;
    }
  }
});

console.log('Exported', Object.keys(exportedImageMap).length, 'image files to assets/images');

// 2. Build YouCan theme.json matching user structure
const themeJson = {
  id: "b0263afe-3c4a-11ea-9d70-06db6ed384f3",
  name: "YouCan Big-Offer COD Ultra Theme",
  version: "2.1.0",
  author: "VITALIVE Ecommerce",
  is_default: false,
  theme_setting: {
    store_settings: {
      is_coupon_visible: true,
      currencyPrecision: false,
      header: {
        notice: {
          mobile: {
            above: false,
            enabled: true,
            content: "<p style=\"text-align: center; font-weight: bold;\">🔥 عرض خاص: شحن مجاني لكافة مدن المغرب والدفع عند الاستلام</p>",
            color: "#FFFFFF",
            bgColor: "#FF6B00"
          },
          desktop: {
            above: true,
            enabled: true,
            content: "<p style=\"text-align: center; font-weight: bold;\">🔥 عرض خاص: شحن مجاني لكافة مدن المغرب والدفع عند الاستلام</p>",
            color: "#FFFFFF",
            bgColor: "#FF6B00"
          }
        },
        mobile: {
          left: [],
          center: [],
          right: [],
          color: {
            background: "#FFFFFF",
            icons: "#111111"
          },
          border: {
            exists: true,
            color: "#F0F0F0"
          }
        },
        desktop: {
          left: [],
          center: [],
          right: [],
          color: {
            background: "#FFFFFF",
            icons: "#111111"
          },
          border: {
            exists: true,
            color: "#F0F0F0"
          }
        }
      },
      footer: {
        custom: true,
        style: {
          color: {
            background: "#111111",
            text: "#FFFFFF"
          },
          border: {
            exists: false,
            color: "#00000000"
          }
        },
        content: "<p style=\"text-align:center; padding: 20px;\">جميع الحقوق محفوظة © " + new Date().getFullYear() + " — توصيل سريع ودفع عند الاستلام</p>"
      },
      font: {
        menu: {
          text: "Cairo",
          value: "Cairo",
          category: "sans-serif"
        },
        body: {
          text: "Cairo",
          value: "Cairo",
          category: "sans-serif"
        }
      },
      breadcrumbs: {
        global: false,
        checkout: false
      }
    },
    checkout_settings: {
      one_page_checkout: true,
      colors: {
        page_background_color: "#FFFFFF",
        page_foreground_color: "#111111",
        header_background_color: "#FFFFFF",
        sum_box_background_color: "#FFF3EB",
        sum_box_foreground_color: "#111111",
        accent_color: "#FF6B00"
      },
      font: {
        font_family: {
          text: "Cairo",
          value: "Cairo",
          category: "sans-serif"
        }
      },
      logo: {
        logo_width: "120",
        logo_file: []
      }
    },
    product_settings: {
      enable_reviews: true,
      skip_to_checkout: true,
      sticky_on_mobile: true,
      sticky_on_desktop: false,
      read_more: false,
      enable_facebook_share: false,
      enable_twitter_share: false,
      enable_whatssap_share: true,
      enable_product_quantity_selector: true,
      related_products_section: false,
      direct_add_to_cart: true,
      cart_text: product.ctaText || "اطلب الآن بالدفع عند الاستلام",
      sections: {
        preview: { type: "preview", show: true, name: "معاينة المنتج والصور" },
        title: { type: "title", show: true, name: "عنوان المنتج والتقييم" },
        countdown: { type: "countdown", show: true, name: "العداد التنازلي للعرض" },
        visitors: { type: "visitors", show: true, name: "عدد الزوار الحاليين" },
        price: { type: "price", show: true, name: "السعر والخصم" },
        add_to_cart: { type: "add_to_cart", show: true, name: "زر الطلب المباشر" },
        variants: { type: "variants", show: true, name: "خيارات المنتج" },
        description: { type: "description", show: true, name: "فيديوهات وتفاصيل المنتج" },
        "express-checkout": { type: "express-checkout", show: true, name: "نموذج الدفع عند الاستلام" },
        scarcity: { type: "scarcity", show: true, name: "مؤشر الكمية المتبقية" }
      },
      visitors: {
        max: "94",
        min: "68"
      },
      fakeStock: {
        max: "24",
        min: "7"
      },
      time: {
        days: 0,
        hours: 2,
        minutes: 0,
        seconds: 0
      },
      style: {
        padding: {
          top: 20,
          bottom: 20
        },
        background: {
          color: "#FFFFFF"
        },
        text: {
          color: "#111111"
        },
        link: {
          color: "#FF6B00"
        },
        title: {
          color: "#111111"
        },
        price: {
          before: {
            color: "#999999"
          },
          after: {
            color: "#FF6B00"
          }
        },
        addToCart: {
          text: {
            color: "#FFFFFF"
          },
          background: {
            color: "#FF6B00"
          },
          border: {
            color: "#FF6B00"
          },
          hover: {
            text: {
              color: "#FFFFFF"
            },
            background: {
              color: "#E05300"
            },
            border: {
              color: "#E05300"
            }
          }
        },
        quantityButtons: {
          text: {
            color: "#111111"
          },
          background: {
            color: "#F8F8F6"
          },
          border: {
            color: "#E5E5E5"
          },
          hover: {
            text: {
              color: "#FFFFFF"
            },
            background: {
              color: "#FF6B00"
            },
            border: {
              color: "#FF6B00"
            }
          }
        },
        primary: {
          color: "#FF6B00"
        },
        secondary: {
          color: "#129A56"
        },
        option: {
          border: {
            color: "#FF6B00"
          }
        },
        bundles: {
          priceCurrent: {
            color: "#FF6B00"
          },
          priceCompare: {
            color: "#999999"
          },
          border: {
            color: "#E5E7EB"
          },
          selectedBorder: {
            color: "#FF6B00"
          },
          headingLabel: {
            color: "#111111"
          },
          title: {
            color: "#111111"
          },
          containerBackground: {
            color: "#FFF3EB"
          },
          cardBackground: {
            color: "#FFFFFF"
          }
        }
      },
      cart_safe_badges: "assets/images/trust_badges.png"
    },
    pages_settings: {
      home: [
        {
          id: "section-big-offer-hero",
          type: "hero",
          settings: {
            title: product.name,
            offerText: product.offerText || "🔥 خصم حصري لفترة محدودة + شحن مجاني",
            price: product.price,
            comparePrice: product.compareAtPrice,
            currency: product.currency || "DH"
          }
        },
        {
          id: "section-cod-checkout",
          type: "express-checkout",
          settings: {
            title: "املأ بياناتك أدناه لتأكيد الطلب — الدفع عند الاستلام",
            shipping: "مجاني 100% لكافة المدن"
          }
        }
      ]
    },
    colors_settings: {
      primary: "#FF6B00",
      "light-primary": "#FFF3EB",
      "dark-primary": "#E05300",
      secondary: "#129A56",
      "body-background": "#FFFFFF",
      success: "#129A56",
      info: "#0284C7",
      warning: "#F59E0B",
      danger: "#E11D48"
    }
  }
};

fs.writeFileSync(
  path.join(BUILD_DIR, 'theme.json'),
  JSON.stringify(themeJson, null, 2),
  'utf8'
);

// Save also direct copy in public/downloads/big-offer-theme.json
fs.writeFileSync(
  path.join(PUBLIC_DOWNLOADS_DIR, 'big-offer-theme.json'),
  JSON.stringify(themeJson, null, 2),
  'utf8'
);

// 3. Write config/settings_data.json with required 'current' and 'presets' properties
const settingsData = {
  current: themeJson.theme_setting,
  presets: {
    Default: themeJson.theme_setting
  }
};

fs.writeFileSync(
  path.join(BUILD_DIR, 'config', 'settings_data.json'),
  JSON.stringify(settingsData, null, 2),
  'utf8'
);

const settingsSchema = [
  {
    name: "General Store Settings",
    settings: [
      { type: "text", id: "store_name", label: "اسم المتجر", default: "VITALIVE Store" },
      { type: "color", id: "primary_color", label: "اللون الأساسي", default: "#FF6B00" },
      { type: "color", id: "secondary_color", label: "لون النجاح والضمان", default: "#129A56" }
    ]
  },
  {
    name: "Big-Offer COD Settings",
    settings: [
      { type: "checkbox", id: "countdown_enabled", label: "تفعيل العداد التنازلي", default: true },
      { type: "checkbox", id: "sticky_button_mobile", label: "تفعيل زر الشراء العائم في الهاتف", default: true },
      { type: "checkbox", id: "quick_order_modal", label: "تفعيل نافذة الشراء السريعة (Popup Form)", default: true }
    ]
  }
];

fs.writeFileSync(
  path.join(BUILD_DIR, 'config', 'settings_schema.json'),
  JSON.stringify(settingsSchema, null, 2),
  'utf8'
);

// 4. Create Standalone / Liquid assets
// All 70+ Moroccan cities list for standalone & theme
const moroccoCities = [
  'الدار البيضاء (Casablanca)',
  'الرباط (Rabat)',
  'مراكش (Marrakech)',
  'فاس (Fès)',
  'طنجة (Tanger)',
  'أكادير (Agadir)',
  'مكناس (Meknès)',
  'وجدة (Oujda)',
  'القنيطرة (Kénitra)',
  'تطوان (Tétouan)',
  'تمارة (Témara)',
  'سلا (Salé)',
  'الجديدة (El Jadida)',
  'آسفي (Safi)',
  'المحمدية (Mohammédia)',
  'الناظور (Nador)',
  'بني ملال (Béni Mellal)',
  'خريبكة (Khouribga)',
  'سطات (Settat)',
  'العرائش (Larache)',
  'القصر الكبير (Ksar El Kébir)',
  'برشيد (Berrechid)',
  'تازة (Taza)',
  'الخميسات (Khémisset)',
  'كلميم (Guelmim)',
  'بركان (Berkane)',
  'العيون (Laâyoune)',
  'الداخلة (Dakhla)',
  'وارزازات (Ouarzazate)',
  'الرشيدية (Errachidia)',
  'الصويرة (Essaouira)',
  'تارودانت (Taroudant)',
  'سيدي قاسم (Sidi Kacem)',
  'سيدي سليمان (Sidi Slimane)',
  'خنيفرة (Khénifra)',
  'تاونات (Taounate)',
  'وزان (Ouezzane)',
  'شفشاون (Chefchaouen)',
  'تيزنيت (Tiznit)',
  'اليوسفية (Youssoufia)',
  'صفرو (Séfrou)',
  'الفقيه بن صالح (Fquih Ben Salah)',
  'جرادة (Jerada)',
  'الحسيمة (Al Hoceïma)',
  'ميدلت (Midelt)',
  'تنغير (Tinghir)',
  'زاكورة (Zagora)'
];

// Write assets/js/morocco-cities.js
fs.writeFileSync(
  path.join(BUILD_DIR, 'assets', 'js', 'morocco-cities.js'),
  `window.MOROCCO_CITIES = ${JSON.stringify(moroccoCities, null, 2)};`,
  'utf8'
);

console.log('Building standalone index.html...');
// Export detailed Standalone Landing Page
const standaloneHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name} — عرض حصري وتوصيل مجاني</title>
  <meta name="description" content="${product.shortDescription || product.name}">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SY0FCG79E6"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-SY0FCG79E6');
  </script>
  <!-- Google Fonts Cairo -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Cairo', 'sans-serif'],
          },
          colors: {
            brand: {
              orange: '#FF6B00',
              orangeDark: '#E05300',
              orangeLight: '#FFF3EB',
              green: '#129A56',
              greenLight: '#E8F8F0',
              dark: '#111111'
            }
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-[#F8F8F6] text-[#111111] font-sans antialiased selection:bg-[#FF6B00] selection:text-white pb-24 md:pb-12">

  <!-- Top Urgency Announcement Bar -->
  <div class="bg-gradient-to-r from-[#FF6B00] via-[#FF5500] to-[#E05300] text-white py-2.5 px-4 text-center font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 sticky top-0 z-40">
    <span class="inline-block animate-pulse">🔥</span>
    <span>${product.offerText || 'عرض خاص: تخفيض استثنائي + شحن مجاني لكافة المدن والدفع عند الاستلام'}</span>
  </div>

  <div class="max-w-2xl mx-auto px-4 py-4 space-y-6">

    <!-- Hero Card -->
    <div class="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-sm space-y-4">
      
      <!-- Badge & Live Activity -->
      <div class="flex items-center justify-between gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FF6B00] text-white shadow-sm">
          <span>★</span> ${product.badgeText || 'العرض الأكثر مبيعاً'}
        </span>
        <div class="flex items-center gap-2 text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span><strong id="live-visitors">78</strong> شخص يشاهدون هذا المنتج الآن</span>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-2xl sm:text-3xl font-black text-[#111111] leading-tight">
        ${product.name}
      </h1>

      <!-- Rating & Stock Notice -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-neutral-100 pb-3">
        <div class="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
          <span>★★★★★</span>
          <span class="text-neutral-700 font-extrabold text-xs">4.9 / 5.0 (150+ تقييم حقيقي)</span>
        </div>
        <div class="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200/60">
          ⚠️ متبقي فقط <span id="stock-count" class="font-black text-rose-700 font-mono">11</span> قطع في المخزون
        </div>
      </div>

      <!-- Countdown Timer Box -->
      <div class="bg-gradient-to-br from-[#FFF3EB] to-[#FFE8DA] border-2 border-[#FF6B00]/40 rounded-2xl p-4 text-center space-y-2">
        <div class="text-xs font-black text-neutral-800 flex items-center justify-center gap-1.5">
          <span>⏳</span>
          <span>سارع بالطلب! ينتهي هذا العرض الحصري خلال:</span>
        </div>
        <div class="flex justify-center items-center gap-2 font-mono text-center" dir="ltr">
          <div class="bg-[#111111] text-white px-3 py-2 rounded-xl min-w-[54px] shadow-sm">
            <span id="timer-hours" class="block text-xl font-black text-[#FF6B00]">01</span>
            <span class="text-[10px] font-sans text-neutral-300">ساعة</span>
          </div>
          <span class="text-xl font-black text-neutral-800">:</span>
          <div class="bg-[#111111] text-white px-3 py-2 rounded-xl min-w-[54px] shadow-sm">
            <span id="timer-minutes" class="block text-xl font-black text-[#FF6B00]">48</span>
            <span class="text-[10px] font-sans text-neutral-300">دقيقة</span>
          </div>
          <span class="text-xl font-black text-neutral-800">:</span>
          <div class="bg-[#111111] text-white px-3 py-2 rounded-xl min-w-[54px] shadow-sm">
            <span id="timer-seconds" class="block text-xl font-black text-white">35</span>
            <span class="text-[10px] font-sans text-neutral-300">ثانية</span>
          </div>
        </div>
      </div>

      <!-- Product Main Image Gallery -->
      <div class="space-y-3">
        <div class="relative rounded-2xl overflow-hidden border border-neutral-200/70 bg-[#F8F8F6] aspect-square flex items-center justify-center">
          <img id="main-image" src="${exportedImageMap[product.images[0]] || product.images[0] || 'assets/images/product_img_1.jpg'}" alt="${product.name}" class="w-full h-full object-cover">
          <span class="absolute top-3 right-3 bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
            وفر ${product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 197} ${product.currency || 'DH'} اليوم
          </span>
        </div>

        <!-- Thumbnails -->
        <div class="grid grid-cols-5 gap-2" id="gallery-thumbs">
          ${(product.images || []).map((img, i) => {
            const imgSrc = exportedImageMap[img] || img;
            return `
            <button type="button" onclick="setMainImage('${imgSrc}')" class="rounded-xl overflow-hidden border-2 border-neutral-200 focus:border-[#FF6B00] active:scale-95 transition-all aspect-square bg-white">
              <img src="${imgSrc}" alt="thumb ${i + 1}" class="w-full h-full object-cover">
            </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Price Box -->
      <div class="bg-[#F8F8F6] border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-xs text-neutral-500 font-bold line-through">
            السعر السابق: ${product.compareAtPrice || 397} ${product.currency || 'DH'}
          </div>
          <div class="text-2xl sm:text-3xl font-black text-[#FF6B00] font-mono leading-none">
            ${product.price} <span class="text-base font-bold">${product.currency || 'DH'}</span>
          </div>
        </div>
        <div class="text-left">
          <span class="inline-block bg-[#E8F8F0] text-[#129A56] font-black text-xs px-3 py-1.5 rounded-full border border-emerald-200">
            ✓ التوصيل مجاني 100%
          </span>
        </div>
      </div>

      <!-- CTA Button to open Quick Order Popup Modal -->
      <button type="button" onclick="openOrderModal()" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#E05300] hover:from-[#e66000] hover:to-[#c74500] active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all">
        <span>🛒</span>
        <span>${product.ctaText || 'اطلب الآن بالدفع عند الاستلام'}</span>
      </button>

      <!-- Trust Badges -->
      <div class="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] sm:text-xs font-bold text-neutral-700">
        <div class="p-2.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/60">
          <div class="text-base mb-0.5">🛡️</div>
          <div>معاينة قبل الدفع</div>
        </div>
        <div class="p-2.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/60">
          <div class="text-base mb-0.5">🚚</div>
          <div>شحن سريع مجاني</div>
        </div>
        <div class="p-2.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/60">
          <div class="text-base mb-0.5">🔄</div>
          <div>ضمان استبدال كامل</div>
        </div>
      </div>

    </div>

    <!-- Product Videos and Visual Proofs -->
    <div class="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-sm space-y-4">
      <h2 class="text-xl font-black text-[#111111] flex items-center gap-2">
        <span>🎬</span> شاهد المنتج على أرض الواقع
      </h2>
      <div class="space-y-4">
        <div class="rounded-2xl overflow-hidden border border-neutral-200 bg-black/5">
          <video src="https://res.cloudinary.com/drdjzjgn0/video/upload/v1792061429/13_bxauis.mp4" controls playsinline class="w-full rounded-2xl"></video>
        </div>
        <div class="rounded-2xl overflow-hidden border border-neutral-200 bg-black/5">
          <video src="https://res.cloudinary.com/drdjzjgn0/video/upload/v1792061425/davinci_a_realistic_35_second_commercial_video_sequence_wi_2_gngnpf.mp4" controls playsinline class="w-full rounded-2xl"></video>
        </div>
      </div>
    </div>

    <!-- Product Details / Description -->
    <div class="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-sm space-y-4">
      <h2 class="text-xl font-black text-[#111111] flex items-center gap-2">
        <span>🌿</span> تفاصيل ومكونات المنتج
      </h2>
      <div class="text-sm leading-relaxed text-neutral-800 whitespace-pre-line bg-[#F8F8F6] p-4 sm:p-5 rounded-2xl border border-neutral-200/60">
${product.description}
      </div>

      <!-- Description Images -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        ${(product.descriptionImages || []).filter(img => !img.endsWith('.mp4')).map(img => {
          const imgSrc = exportedImageMap[img] || img;
          return `
          <div class="rounded-2xl overflow-hidden border border-neutral-200 bg-[#F8F8F6]">
            <img src="${imgSrc}" alt="تفاصيل المنتج" class="w-full h-auto object-cover">
          </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- MAIN COD EMBEDDED FORM -->
    <div id="order-form-container" class="bg-white rounded-3xl border-2 border-[#FF6B00]/40 shadow-xl overflow-hidden">
      
      <!-- Header Banner -->
      <div class="bg-gradient-to-r from-[#FF6B00] to-[#E05300] text-white p-5 text-center space-y-1">
        <h3 class="text-xl sm:text-2xl font-black">
          استمارة الطلب السريع — الدفع عند الاستلام
        </h3>
        <p class="text-xs sm:text-sm text-white/90 font-medium">
          املأ بياناتك أدناه وسنتصل بك فوراً لتأكيد العنوان والتوصيل بالمجان
        </p>
      </div>

      <form id="cod-order-form" onsubmit="handleFormSubmit(event)" class="p-5 sm:p-6 space-y-4">

        <!-- Full Name -->
        <div>
          <label class="block text-xs sm:text-sm font-black text-[#111111] mb-1.5">
            الاسم الكامل <span class="text-rose-500">*</span>
          </label>
          <input type="text" id="customer-name" oninput="checkFormValidity()" placeholder="مثال: يوسف الإدريسي" required class="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-[#111111] bg-[#F8F8F6]/70 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]">
        </div>

        <!-- Phone Number -->
        <div>
          <label class="block text-xs sm:text-sm font-black text-[#111111] mb-1.5">
            رقم الهاتف (الواتساب للتأكيد) <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <input type="tel" id="customer-phone" dir="ltr" oninput="checkFormValidity()" placeholder="0612345678 أو 0712345678" required class="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-[#111111] bg-[#F8F8F6]/70 text-left font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]">
            <span class="absolute right-3.5 top-3 text-xs text-neutral-400 font-bold pointer-events-none">🇲🇦 +212</span>
          </div>
          <p class="text-[11px] text-neutral-500 mt-1">سيتصل بك الموزع عبر هذا الرقم لتسليم طلبيتك</p>
        </div>

        <!-- Searchable Moroccan City Dropdown -->
        <div class="relative">
          <label class="flex items-center justify-between text-xs sm:text-sm font-black text-[#111111] mb-1.5">
            <span>المدينة / الإقليم <span class="text-rose-500">*</span></span>
            <span id="city-status" class="text-[11px] font-bold text-neutral-500">اختر مدينتك من القائمة</span>
          </label>
          <div class="relative">
            <input type="text" id="city-search-input" onfocus="showCityDropdown()" oninput="filterCityDropdown()" placeholder="ابحث عن مدينتك (مثال: الدار البيضاء، مراكش، الرباط...)" autocomplete="off" required class="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-[#111111] bg-[#F8F8F6]/70 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]">
          </div>
          <div id="city-dropdown-list" class="hidden absolute top-full inset-x-0 mt-1 max-h-56 overflow-y-auto bg-white border border-neutral-200 rounded-2xl shadow-xl z-5xl divide-y divide-neutral-100"></div>
          <input type="hidden" id="selected-city" value="">
        </div>

        <!-- Address -->
        <div>
          <label class="block text-xs sm:text-sm font-black text-[#111111] mb-1.5">
            العنوان بالكامل أو اسم الحي <span class="text-rose-500">*</span>
          </label>
          <input type="text" id="customer-address" oninput="checkFormValidity()" placeholder="مثال: حي الرياض، شارع القدس، إقامة 14" required class="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-[#111111] bg-[#F8F8F6]/70 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]">
        </div>

        <!-- Quantity Selector -->
        <div class="bg-[#FFF3EB] border border-[#FF6B00]/25 rounded-2xl p-4 flex items-center justify-between">
          <span class="text-xs sm:text-sm font-black text-[#111111]">حدد الكمية المطلوبة:</span>
          <div class="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-[#FF6B00]/30">
            <button type="button" onclick="updateQty(-1)" class="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-base font-black flex items-center justify-center">-</button>
            <span id="order-qty" class="w-8 text-center font-black font-mono text-base">1</span>
            <button type="button" onclick="updateQty(1)" class="w-8 h-8 rounded-lg bg-[#FF6B00] hover:bg-[#E05300] text-white text-base font-black flex items-center justify-center">+</button>
          </div>
        </div>

        <!-- Price Summary -->
        <div class="bg-[#F8F8F6] border border-neutral-200/80 rounded-2xl p-4 space-y-2 text-sm font-bold">
          <div class="flex justify-between text-neutral-600">
            <span>سعر المنتج:</span>
            <span class="font-mono text-[#111111]">${product.price} ${product.currency || 'DH'}</span>
          </div>
          <div class="flex justify-between text-neutral-600">
            <span>مصاريف الشحن:</span>
            <span class="text-[#129A56] bg-[#E8F8F0] px-2 py-0.5 rounded-md text-xs font-black">مجاني 100%</span>
          </div>
          <div class="pt-2 border-t border-neutral-200 flex justify-between text-[#111111] text-base font-black">
            <span>المجموع النهائي:</span>
            <span id="total-price-display" class="text-xl font-black text-[#FF6B00] font-mono">${product.price} ${product.currency || 'DH'}</span>
          </div>
        </div>

        <!-- Submit Button (Disabled/Inactive until info is entered) -->
        <button id="submit-order-button" type="submit" disabled class="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg transition-all transform flex items-center justify-center gap-2 bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-80 shadow-none">
          <span>🛒</span>
          <span id="submit-button-text">الرجاء إدخال معلوماتك لتأكيد الطلب</span>
        </button>

        <p class="text-center text-xs text-neutral-500">
          🔒 بياناتك الشخصية محمية بالكامل ولن تستخدم إلا لتأكيد التوصيل
        </p>
      </form>

      <!-- Success Screen (Hidden by default) -->
      <div id="order-success-screen" class="hidden p-6 sm:p-8 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#129A56] mx-auto flex items-center justify-center text-3xl font-black">
          ✓
        </div>
        <h4 class="text-2xl font-black text-neutral-900">شكراً لك! تم استلام طلبك بنجاح</h4>
        <p class="text-sm text-neutral-600">
          رقم طلبك: <strong id="success-order-id" class="text-[#FF6B00] font-mono">COD-1050</strong>
        </p>
        <p class="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80">
          سيتصل بك فريق خدمة العملاء قريباً عبر الهاتف أو الواتساب لتأكيد موعد التسليم والتوصيل لباب بيتك مجاناً.
        </p>
      </div>

    </div>

    <!-- FAQ Section -->
    <div class="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-sm space-y-3">
      <h2 class="text-xl font-black text-[#111111] flex items-center gap-2 mb-3">
        <span>❓</span> الأسئلة الأكثر تكراراً
      </h2>
      <details class="group bg-[#F8F8F6] rounded-2xl p-4 border border-neutral-200/60 open:bg-[#FFF3EB] open:border-[#FF6B00]/30 transition-all">
        <summary class="font-black text-sm cursor-pointer list-none flex justify-between items-center">
          <span>متى سأستلم طلبيتي؟</span>
          <span class="text-[#FF6B00] text-lg font-mono transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p class="mt-3 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          التوصيل يستغرق من 24 إلى 48 ساعة كحد أقصى لكافة مدن ومناطق المغرب مع إمكانية المعاينة قبل الدفع.
        </p>
      </details>
      <details class="group bg-[#F8F8F6] rounded-2xl p-4 border border-neutral-200/60 open:bg-[#FFF3EB] open:border-[#FF6B00]/30 transition-all">
        <summary class="font-black text-sm cursor-pointer list-none flex justify-between items-center">
          <span>كيف يتم الدفع؟</span>
          <span class="text-[#FF6B00] text-lg font-mono transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p class="mt-3 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          الدفع نقداً عند الاستلام بعد أن تستلم الطرد وتقوم بفتحه ومعاينته للتأكد من جودته تماماً.
        </p>
      </details>
      <details class="group bg-[#F8F8F6] rounded-2xl p-4 border border-neutral-200/60 open:bg-[#FFF3EB] open:border-[#FF6B00]/30 transition-all">
        <summary class="font-black text-sm cursor-pointer list-none flex justify-between items-center">
          <span>هل يوجد ضمان على المنتج؟</span>
          <span class="text-[#FF6B00] text-lg font-mono transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p class="mt-3 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          نعم، نوفر ضمان استرجاع أو استبدال كامل خلال 14 يوماً في حالة وجود أي عيب أو عدم رضا عن المنتج.
        </p>
      </details>
    </div>

  </div>

  <!-- Mobile Floating Sticky Button -->
  <div id="sticky-bottom-bar" class="fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-2xl md:hidden">
    <div class="max-w-md mx-auto flex items-center justify-between gap-3">
      <div class="text-right">
        <div class="text-[10px] text-neutral-500 font-bold leading-tight">الدفع عند الاستلام</div>
        <div class="text-lg font-black text-[#111111] font-mono leading-none">
          <span id="sticky-price">${product.price}</span> <span class="text-xs font-bold text-[#FF6B00]">${product.currency || 'DH'}</span>
        </div>
      </div>
      <button type="button" onclick="openOrderModal()" class="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#E05300] text-white font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
        <span>🛒</span>
        <span>اطلب الآن — شحن مجاني</span>
      </button>
    </div>
  </div>

  <!-- QUICK ORDER POPUP MODAL -->
  <div id="order-modal-backdrop" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity">
    <div class="relative w-full sm:max-w-md max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
      
      <!-- Close Button -->
      <button type="button" onclick="closeOrderModal()" class="absolute top-3.5 left-3.5 z-40 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg font-bold">
        ✕
      </button>

      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-[#FF6B00] to-[#E05300] text-white p-4 text-center space-y-1">
        <h3 class="text-lg font-black">طلب سريع — الدفع عند الاستلام</h3>
        <p class="text-xs text-white/90">أدخل معلوماتك وسنقوم بتوصيل طلبك مجاناً</p>
      </div>

      <!-- Modal Body (Scrollable form) -->
      <div class="overflow-y-auto p-4 sm:p-6 space-y-4">
        
        <!-- Product Thumbnail Summary -->
        <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF3EB] border border-[#FF6B00]/30">
          <img src="${exportedImageMap[product.images[0]] || product.images[0] || 'assets/images/product_img_1.jpg'}" alt="${product.name}" class="w-12 h-12 rounded-xl object-cover border border-white">
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-black truncate">${product.name}</h4>
            <div class="text-sm font-black text-[#FF6B00] font-mono">${product.price} ${product.currency || 'DH'} <span class="text-[10px] text-[#129A56] bg-[#E8F8F0] px-1.5 py-0.5 rounded font-sans">شحن مجاني</span></div>
          </div>
        </div>

        <form id="modal-order-form" onsubmit="handleModalFormSubmit(event)" class="space-y-3.5">
          <div>
            <label class="block text-xs font-black text-neutral-800 mb-1">الاسم الكامل *</label>
            <input type="text" id="modal-customer-name" oninput="checkModalFormValidity()" placeholder="الاسم الكامل" required class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-[#F8F8F6] focus:ring-2 focus:ring-[#FF6B00]">
          </div>
          <div>
            <label class="block text-xs font-black text-neutral-800 mb-1">رقم الهاتف (الواتساب) *</label>
            <input type="tel" id="modal-customer-phone" dir="ltr" oninput="checkModalFormValidity()" placeholder="06XXXXXXXX / 07XXXXXXXX" required class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-[#F8F8F6] text-left font-mono focus:ring-2 focus:ring-[#FF6B00]">
          </div>
          <div class="relative">
            <label class="block text-xs font-black text-neutral-800 mb-1">المدينة *</label>
            <input type="text" id="modal-city-search" onfocus="showModalCityDropdown()" oninput="filterModalCityDropdown()" placeholder="ابحث عن مدينتك..." required class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-[#F8F8F6] focus:ring-2 focus:ring-[#FF6B00]">
            <div id="modal-city-dropdown" class="hidden absolute top-full inset-x-0 mt-1 max-h-44 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-lg z-50 divide-y divide-neutral-100"></div>
            <input type="hidden" id="modal-selected-city" value="">
          </div>
          <div>
            <label class="block text-xs font-black text-neutral-800 mb-1">العنوان أو الحي *</label>
            <input type="text" id="modal-customer-address" oninput="checkModalFormValidity()" placeholder="الحي ورقم المنزل" required class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-[#F8F8F6] focus:ring-2 focus:ring-[#FF6B00]">
          </div>

          <!-- Submit Button inside Modal (Disabled/Inactive until info is entered) -->
          <button id="modal-submit-button" type="submit" disabled class="w-full py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-80 shadow-none">
            <span>🛒</span>
            <span id="modal-submit-text">الرجاء إدخال معلوماتك لتأكيد الطلب</span>
          </button>
        </form>

        <!-- Modal Success Confirmation -->
        <div id="modal-success-screen" class="hidden text-center py-6 space-y-3">
          <div class="w-12 h-12 rounded-full bg-[#E8F8F0] text-[#129A56] mx-auto flex items-center justify-center text-2xl font-black">✓</div>
          <h4 class="text-xl font-black text-neutral-900">تم تسجيل طلبك بنجاح!</h4>
          <p class="text-xs text-neutral-600">سيتواصل معك فريقنا هاتفياً فوراً لتسليم الطلبية.</p>
          <button type="button" onclick="closeOrderModal()" class="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white font-bold text-xs">إغلاق</button>
        </div>

      </div>
    </div>
  </div>

  <script src="assets/js/morocco-cities.js"></script>
  <script src="assets/js/main.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), standaloneHtml, 'utf8');

// 5. Build main.js for client side interactivity (Inactive submit button + cities + countdown + modal)
const mainJs = `
// Big Offer Client Interactivity Script
const UNIT_PRICE = ${product.price};
let currentQty = 1;

// Image Gallery
function setMainImage(src) {
  const mainImg = document.getElementById('main-image');
  if (mainImg) mainImg.src = src;
}

// Countdown Timer
(function initTimer() {
  let totalSeconds = 2 * 3600 + 48 * 60 + 35;
  const hoursEl = document.getElementById('timer-hours');
  const minEl = document.getElementById('timer-minutes');
  const secEl = document.getElementById('timer-seconds');

  setInterval(() => {
    if (totalSeconds > 0) totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
    if (minEl) minEl.textContent = String(m).padStart(2, '0');
    if (secEl) secEl.textContent = String(s).padStart(2, '0');
  }, 1000);
})();

// Quantity update
function updateQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  const qtyEl = document.getElementById('order-qty');
  const totalDisplay = document.getElementById('total-price-display');
  const stickyPrice = document.getElementById('sticky-price');
  if (qtyEl) qtyEl.textContent = String(currentQty);
  const total = currentQty * UNIT_PRICE;
  if (totalDisplay) totalDisplay.textContent = total + ' DH';
  if (stickyPrice) stickyPrice.textContent = total;
}

// Modal open/close
function openOrderModal() {
  const modal = document.getElementById('order-modal-backdrop');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeOrderModal() {
  const modal = document.getElementById('order-modal-backdrop');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Moroccan Phone Validation
function isValidMoroccanPhone(phone) {
  const clean = (phone || '').replace(/[\\s\\-\\(\\)\\.]/g, '');
  return /^(?:(?:\\+|00)212|0)?[5-7]\\d{8}$/.test(clean);
}

// Moroccan Cities Dropdown Handler for Main Form
function showCityDropdown() {
  const list = document.getElementById('city-dropdown-list');
  if (!list) return;
  filterCityDropdown();
  list.classList.remove('hidden');
}

function filterCityDropdown() {
  const input = document.getElementById('city-search-input');
  const list = document.getElementById('city-dropdown-list');
  if (!input || !list) return;
  const q = (input.value || '').trim().toLowerCase();
  const cities = window.MOROCCO_CITIES || [];
  const filtered = q ? cities.filter(c => c.toLowerCase().includes(q)) : cities;

  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<div class="p-3 text-xs text-neutral-500 text-center">لم يتم العثور على هذه المدينة</div>';
  } else {
    filtered.slice(0, 30).forEach(city => {
      const item = document.createElement('div');
      item.className = 'px-4 py-2.5 text-xs font-bold text-neutral-800 hover:bg-[#FFF3EB] hover:text-[#FF6B00] cursor-pointer transition-colors';
      item.textContent = city;
      item.onclick = () => selectCity(city);
      list.appendChild(item);
    });
  }
  list.classList.remove('hidden');
}

function selectCity(city) {
  const input = document.getElementById('city-search-input');
  const hidden = document.getElementById('selected-city');
  const list = document.getElementById('city-dropdown-list');
  const status = document.getElementById('city-status');
  if (input) input.value = city;
  if (hidden) hidden.value = city;
  if (list) list.classList.add('hidden');
  if (status) {
    status.textContent = '✓ تم تحديد المدينة';
    status.className = 'text-[11px] font-bold text-[#129A56]';
  }
  checkFormValidity();
}

// Check Main Form Validity & Toggle Active/Inactive Submit Button
function checkFormValidity() {
  const name = (document.getElementById('customer-name')?.value || '').trim();
  const phone = (document.getElementById('customer-phone')?.value || '').trim();
  const city = (document.getElementById('selected-city')?.value || document.getElementById('city-search-input')?.value || '').trim();
  const address = (document.getElementById('customer-address')?.value || '').trim();

  const isNameValid = name.length >= 2;
  const isPhoneValid = isValidMoroccanPhone(phone);
  const isCityValid = city.length >= 2;
  const isAddressValid = address.length >= 3;

  const isValid = isNameValid && isPhoneValid && isCityValid && isAddressValid;
  const btn = document.getElementById('submit-order-button');
  const btnText = document.getElementById('submit-button-text');

  if (btn && btnText) {
    if (isValid) {
      btn.disabled = false;
      btn.className = 'w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg transition-all transform flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E05300] active:scale-[0.98] text-white shadow-lg shadow-orange-500/25 cursor-pointer animate-pulse hover:animate-none';
      btnText.textContent = 'تأكيد الطلب الآن — الدفع عند الاستلام';
    } else {
      btn.disabled = true;
      btn.className = 'w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg transition-all transform flex items-center justify-center gap-2 bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-80 shadow-none';
      btnText.textContent = 'الرجاء إدخال معلوماتك لتأكيد الطلب';
    }
  }
}

// Modal City Dropdown Handlers
function showModalCityDropdown() {
  const list = document.getElementById('modal-city-dropdown');
  if (!list) return;
  filterModalCityDropdown();
  list.classList.remove('hidden');
}

function filterModalCityDropdown() {
  const input = document.getElementById('modal-city-search');
  const list = document.getElementById('modal-city-dropdown');
  if (!input || !list) return;
  const q = (input.value || '').trim().toLowerCase();
  const cities = window.MOROCCO_CITIES || [];
  const filtered = q ? cities.filter(c => c.toLowerCase().includes(q)) : cities;

  list.innerHTML = '';
  filtered.slice(0, 30).forEach(city => {
    const item = document.createElement('div');
    item.className = 'px-3.5 py-2 text-xs font-bold text-neutral-800 hover:bg-[#FFF3EB] hover:text-[#FF6B00] cursor-pointer';
    item.textContent = city;
    item.onclick = () => selectModalCity(city);
    list.appendChild(item);
  });
  list.classList.remove('hidden');
}

function selectModalCity(city) {
  const input = document.getElementById('modal-city-search');
  const hidden = document.getElementById('modal-selected-city');
  const list = document.getElementById('modal-city-dropdown');
  if (input) input.value = city;
  if (hidden) hidden.value = city;
  if (list) list.classList.add('hidden');
  checkModalFormValidity();
}

// Check Modal Form Validity & Toggle Active/Inactive Submit Button
function checkModalFormValidity() {
  const name = (document.getElementById('modal-customer-name')?.value || '').trim();
  const phone = (document.getElementById('modal-customer-phone')?.value || '').trim();
  const city = (document.getElementById('modal-selected-city')?.value || document.getElementById('modal-city-search')?.value || '').trim();
  const address = (document.getElementById('modal-customer-address')?.value || '').trim();

  const isNameValid = name.length >= 2;
  const isPhoneValid = isValidMoroccanPhone(phone);
  const isCityValid = city.length >= 2;
  const isAddressValid = address.length >= 3;

  const isValid = isNameValid && isPhoneValid && isCityValid && isAddressValid;
  const btn = document.getElementById('modal-submit-button');
  const btnText = document.getElementById('modal-submit-text');

  if (btn && btnText) {
    if (isValid) {
      btn.disabled = false;
      btn.className = 'w-full py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#E05300] active:scale-[0.98] text-white shadow-md cursor-pointer animate-pulse';
      btnText.textContent = 'تأكيد الطلب الآن (الدفع عند الاستلام)';
    } else {
      btn.disabled = true;
      btn.className = 'w-full py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-80 shadow-none';
      btnText.textContent = 'الرجاء إدخال معلوماتك لتأكيد الطلب';
    }
  }
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  const cityInput = document.getElementById('city-search-input');
  const cityList = document.getElementById('city-dropdown-list');
  if (cityList && cityInput && !cityInput.contains(e.target) && !cityList.contains(e.target)) {
    cityList.classList.add('hidden');
  }

  const modalInput = document.getElementById('modal-city-search');
  const modalList = document.getElementById('modal-city-dropdown');
  if (modalList && modalInput && !modalInput.contains(e.target) && !modalList.contains(e.target)) {
    modalList.classList.add('hidden');
  }
});

// Form Submit Handlers
function handleFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-order-button');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>جاري تأكيد الطلب...</span>';
  }

  setTimeout(() => {
    const form = document.getElementById('cod-order-form');
    const success = document.getElementById('order-success-screen');
    const orderId = 'COD-' + Math.floor(1000 + Math.random() * 9000);
    const idEl = document.getElementById('success-order-id');
    if (idEl) idEl.textContent = orderId;
    if (form) form.classList.add('hidden');
    if (success) success.classList.remove('hidden');

    // Trigger Analytics / Gtag
    if (typeof gtag === 'function') {
      gtag('event', 'purchase', {
        transaction_id: orderId,
        value: currentQty * UNIT_PRICE,
        currency: 'MAD'
      });
    }
  }, 600);
}

function handleModalFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('modal-submit-button');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>جاري تأكيد الطلب...</span>';
  }

  setTimeout(() => {
    const form = document.getElementById('modal-order-form');
    const success = document.getElementById('modal-success-screen');
    if (form) form.classList.add('hidden');
    if (success) success.classList.remove('hidden');
  }, 600);
}
`;

fs.writeFileSync(path.join(BUILD_DIR, 'assets', 'js', 'main.js'), mainJs, 'utf8');

// 6. Build style.css
const styleCss = `
/* Big-Offer Theme Custom Styles */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

body {
  font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  direction: rtl;
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #F1F1F1;
}
::-webkit-scrollbar-thumb {
  background: #FF6B00;
  border-radius: 9999px;
}

/* Modal animation */
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

fs.writeFileSync(path.join(BUILD_DIR, 'assets', 'css', 'style.css'), styleCss, 'utf8');

// 7. YouCan Liquid Templates
// layout/theme.liquid
const themeLiquid = `<!DOCTYPE html>
<html lang="{{ shop.locale }}" dir="{% if shop.locale == 'ar' %}rtl{% else %}ltr{% endif %}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ page_title }} - {{ shop.name }}</title>
  {{ content_for_header }}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="{{ 'style.css' | asset_url }}">
</head>
<body class="bg-[#F8F8F6] text-[#111111] font-sans antialiased">
  {% section 'notice-bar' %}
  <main role="main">
    {{ content_for_layout }}
  </main>
  {% section 'footer' %}
  <script src="{{ 'main.js' | asset_url }}"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(BUILD_DIR, 'layout', 'theme.liquid'), themeLiquid, 'utf8');

// 7. YouCan JSON Templates (Strict schema: only sections and order allowed)
const templateIndexJson = {
  sections: {
    landing: {
      type: "big-offer-landing",
      settings: {}
    }
  },
  order: ["landing"]
};

const templateProductJson = {
  sections: {
    landing: {
      type: "big-offer-landing",
      settings: {}
    }
  },
  order: ["landing"]
};

const templateCollectionJson = {
  sections: {
    main: {
      type: "main-collection",
      settings: {}
    }
  },
  order: ["main"]
};

const templateListCollectionsJson = {
  sections: {
    main: {
      type: "main-list-collections",
      settings: {}
    }
  },
  order: ["main"]
};

const templatePageJson = {
  sections: {
    main: {
      type: "main-page",
      settings: {}
    }
  },
  order: ["main"]
};

const templateCartJson = {
  sections: {
    main: {
      type: "main-cart",
      settings: {}
    }
  },
  order: ["main"]
};

const templateSearchJson = {
  sections: {
    main: {
      type: "main-search",
      settings: {}
    }
  },
  order: ["main"]
};

fs.writeFileSync(path.join(BUILD_DIR, 'templates', 'index.json'), JSON.stringify(templateIndexJson, null, 2), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'templates', 'product.json'), JSON.stringify(templateProductJson, null, 2), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'templates', 'collection.json'), JSON.stringify(templateCollectionJson, null, 2), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'templates', 'list-collections.json'), JSON.stringify(templateListCollectionsJson, null, 2), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'templates', 'page.json'), JSON.stringify(templatePageJson, null, 2), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'templates', 'cart.json'), JSON.stringify(templateCartJson, null, 2), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'templates', 'search.json'), JSON.stringify(templateSearchJson, null, 2), 'utf8');

// Also write liquid sections referenced by templates
// sections/big-offer-landing.liquid
const bigOfferLandingLiquid = `
<div class="max-w-2xl mx-auto px-4 py-4 space-y-6">
  <!-- Top Urgency Announcement Bar -->
  <div class="bg-gradient-to-r from-[#FF6B00] via-[#FF5500] to-[#E05300] text-white py-2.5 px-4 text-center font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 sticky top-0 z-40 rounded-2xl">
    <span class="inline-block animate-pulse">🔥</span>
    <span>{{ section.settings.offer_text | default: "${product.offerText || 'تخفيض استثنائي لفترة محدودة + شحن مجاني لكافة المدن المغربية'}" }}</span>
  </div>

  <!-- Hero Card -->
  <div class="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-sm space-y-4">
    <div class="flex items-center justify-between gap-2">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FF6B00] text-white shadow-sm">
        <span>★</span> {{ section.settings.badge | default: "${product.badgeText || 'العرض الأكثر مبيعاً'}" }}
      </span>
      <div class="flex items-center gap-2 text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span><strong id="live-visitors">78</strong> يشاهدون هذا المنتج الآن</span>
      </div>
    </div>

    <h1 class="text-2xl sm:text-3xl font-black text-[#111111] leading-tight">
      {{ product.title | default: "${product.name}" }}
    </h1>

    <div class="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-neutral-100 pb-3">
      <div class="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
        <span>★★★★★</span>
        <span class="text-neutral-700 font-extrabold text-xs">4.9 / 5.0 (150+ تقييم)</span>
      </div>
      <div class="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200/60">
        ⚠️ متبقي فقط <span id="stock-count" class="font-black text-rose-700 font-mono">11</span> قطع في المخزون
      </div>
    </div>

    <!-- Countdown Timer -->
    <div class="bg-gradient-to-br from-[#FFF3EB] to-[#FFE8DA] border-2 border-[#FF6B00]/40 rounded-2xl p-4 text-center space-y-2">
      <div class="text-xs font-black text-neutral-800 flex items-center justify-center gap-1.5">
        <span>⏳</span>
        <span>سارع بالطلب! ينتهي هذا العرض الحصري خلال:</span>
      </div>
      <div class="flex justify-center items-center gap-2 font-mono text-center" dir="ltr">
        <div class="bg-[#111111] text-white px-3 py-2 rounded-xl min-w-[54px] shadow-sm">
          <span id="timer-hours" class="block text-xl font-black text-[#FF6B00]">01</span>
          <span class="text-[10px] font-sans text-neutral-300">ساعة</span>
        </div>
        <span class="text-xl font-black text-neutral-800">:</span>
        <div class="bg-[#111111] text-white px-3 py-2 rounded-xl min-w-[54px] shadow-sm">
          <span id="timer-minutes" class="block text-xl font-black text-[#FF6B00]">48</span>
          <span class="text-[10px] font-sans text-neutral-300">دقيقة</span>
        </div>
        <span class="text-xl font-black text-neutral-800">:</span>
        <div class="bg-[#111111] text-white px-3 py-2 rounded-xl min-w-[54px] shadow-sm">
          <span id="timer-seconds" class="block text-xl font-black text-white">35</span>
          <span class="text-[10px] font-sans text-neutral-300">ثانية</span>
        </div>
      </div>
    </div>

    <!-- Product Image -->
    <div class="relative rounded-2xl overflow-hidden border border-neutral-200/70 bg-[#F8F8F6] aspect-square flex items-center justify-center">
      <img id="main-image" src="{{ 'product_img_1.webp' | asset_url }}" alt="{{ product.title | default: '${product.name}' }}" class="w-full h-full object-cover">
      <span class="absolute top-3 right-3 bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
        وفر ${product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 197} ${product.currency || 'DH'} اليوم
      </span>
    </div>

    <!-- Price -->
    <div class="bg-[#F8F8F6] border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between">
      <div>
        <div class="text-xs text-neutral-500 font-bold line-through">
          السعر السابق: ${product.compareAtPrice || 397} ${product.currency || 'DH'}
        </div>
        <div class="text-2xl sm:text-3xl font-black text-[#FF6B00] font-mono leading-none">
          ${product.price} <span class="text-base font-bold">${product.currency || 'DH'}</span>
        </div>
      </div>
      <div class="text-left">
        <span class="inline-block bg-[#E8F8F0] text-[#129A56] font-black text-xs px-3 py-1.5 rounded-full border border-emerald-200">
          ✓ التوصيل مجاني 100%
        </span>
      </div>
    </div>

    <!-- Hero CTA Button (Opens Quick Order Modal) -->
    <button type="button" onclick="openOrderModal()" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#E05300] hover:from-[#e66000] hover:to-[#c74500] active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all">
      <span>🛒</span>
      <span>اطلب الآن بالدفع عند الاستلام</span>
    </button>

    <!-- Trust Badges -->
    <div class="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] sm:text-xs font-bold text-neutral-700">
      <div class="p-2.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/60">
        <div class="text-base mb-0.5">🛡️</div>
        <div>معاينة قبل الدفع</div>
      </div>
      <div class="p-2.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/60">
        <div class="text-base mb-0.5">🚚</div>
        <div>شحن سريع مجاني</div>
      </div>
      <div class="p-2.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/60">
        <div class="text-base mb-0.5">🔄</div>
        <div>ضمان استبدال كامل</div>
      </div>
    </div>
  </div>

  <!-- Videos Showcase -->
  <div class="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-sm space-y-4">
    <h2 class="text-xl font-black text-[#111111] flex items-center gap-2">
      <span>🎬</span> شاهد المنتج على أرض الواقع
    </h2>
    <div class="space-y-4">
      <div class="rounded-2xl overflow-hidden border border-neutral-200 bg-black/5">
        <video src="https://res.cloudinary.com/drdjzjgn0/video/upload/v1792061429/13_bxauis.mp4" controls playsinline class="w-full rounded-2xl"></video>
      </div>
      <div class="rounded-2xl overflow-hidden border border-neutral-200 bg-black/5">
        <video src="https://res.cloudinary.com/drdjzjgn0/video/upload/v1792061425/davinci_a_realistic_35_second_commercial_video_sequence_wi_2_gngnpf.mp4" controls playsinline class="w-full rounded-2xl"></video>
      </div>
    </div>
  </div>

  <!-- COD Embedded Form -->
  <div id="order-form-container" class="bg-white rounded-3xl border-2 border-[#FF6B00]/40 shadow-xl overflow-hidden">
    <div class="bg-gradient-to-r from-[#FF6B00] to-[#E05300] text-white p-5 text-center space-y-1">
      <h3 class="text-xl sm:text-2xl font-black">استمارة الطلب السريع — الدفع عند الاستلام</h3>
      <p class="text-xs sm:text-sm text-white/90">املأ بياناتك أدناه وسنتصل بك فوراً لتأكيد العنوان والشحن مجاناً</p>
    </div>

    <form id="cod-order-form" onsubmit="handleFormSubmit(event)" class="p-5 sm:p-6 space-y-4">
      <div>
        <label class="block text-xs sm:text-sm font-black text-[#111111] mb-1.5">الاسم الكامل *</label>
        <input type="text" id="customer-name" oninput="checkFormValidity()" placeholder="مثال: يوسف الإدريسي" required class="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-[#111111] bg-[#F8F8F6]/70 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]">
      </div>

      <div>
        <label class="block text-xs sm:text-sm font-black text-[#111111] mb-1.5">رقم الهاتف (الواتساب للتأكيد) *</label>
        <div class="relative">
          <input type="tel" id="customer-phone" dir="ltr" oninput="checkFormValidity()" placeholder="0612345678 أو 0712345678" required class="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-[#111111] bg-[#F8F8F6]/70 text-left font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B00]">
          <span class="absolute right-3.5 top-3 text-xs text-neutral-400 font-bold pointer-events-none">🇲🇦 +212</span>
        </div>
      </div>

      <div class="relative">
        <label class="flex items-center justify-between text-xs sm:text-sm font-black text-[#111111] mb-1.5">
          <span>المدينة / الإقليم *</span>
          <span id="city-status" class="text-[11px] font-bold text-neutral-500">اختر مدينتك من القائمة</span>
        </label>
        <input type="text" id="city-search-input" onfocus="showCityDropdown()" oninput="filterCityDropdown()" placeholder="ابحث عن مدينتك..." autocomplete="off" required class="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-[#111111] bg-[#F8F8F6]/70 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]">
        <div id="city-dropdown-list" class="hidden absolute top-full inset-x-0 mt-1 max-h-56 overflow-y-auto bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 divide-y divide-neutral-100"></div>
        <input type="hidden" id="selected-city" value="">
      </div>

      <div>
        <label class="block text-xs sm:text-sm font-black text-[#111111] mb-1.5">العنوان بالكامل أو اسم الحي *</label>
        <input type="text" id="customer-address" oninput="checkFormValidity()" placeholder="الحي ورقم المنزل أو الشارع" required class="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-[#111111] bg-[#F8F8F6]/70 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]">
      </div>

      <!-- Quantity -->
      <div class="bg-[#FFF3EB] border border-[#FF6B00]/25 rounded-2xl p-4 flex items-center justify-between">
        <span class="text-xs sm:text-sm font-black text-[#111111]">حدد الكمية المطلوبة:</span>
        <div class="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-[#FF6B00]/30">
          <button type="button" onclick="updateQty(-1)" class="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-base font-black flex items-center justify-center">-</button>
          <span id="order-qty" class="w-8 text-center font-black font-mono text-base">1</span>
          <button type="button" onclick="updateQty(1)" class="w-8 h-8 rounded-lg bg-[#FF6B00] hover:bg-[#E05300] text-white text-base font-black flex items-center justify-center">+</button>
        </div>
      </div>

      <!-- Price summary -->
      <div class="bg-[#F8F8F6] border border-neutral-200/80 rounded-2xl p-4 space-y-2 text-sm font-bold">
        <div class="flex justify-between text-neutral-600">
          <span>سعر المنتج:</span>
          <span class="font-mono text-[#111111]">${product.price} ${product.currency || 'DH'}</span>
        </div>
        <div class="flex justify-between text-neutral-600">
          <span>الشحن:</span>
          <span class="text-[#129A56] bg-[#E8F8F0] px-2 py-0.5 rounded-md text-xs font-black">مجاني 100%</span>
        </div>
        <div class="pt-2 border-t border-neutral-200 flex justify-between text-[#111111] text-base font-black">
          <span>المجموع الإجمالي:</span>
          <span id="total-price-display" class="text-xl font-black text-[#FF6B00] font-mono">${product.price} ${product.currency || 'DH'}</span>
        </div>
      </div>

      <!-- Inactive / Active Submit Button -->
      <button id="submit-order-button" type="submit" disabled class="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg transition-all transform flex items-center justify-center gap-2 bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-80 shadow-none">
        <span>🛒</span>
        <span id="submit-button-text">الرجاء إدخال معلوماتك لتأكيد الطلب</span>
      </button>
    </form>

    <div id="order-success-screen" class="hidden p-6 sm:p-8 text-center space-y-4">
      <div class="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#129A56] mx-auto flex items-center justify-center text-3xl font-black">✓</div>
      <h4 class="text-2xl font-black text-neutral-900">شكراً لك! تم استلام طلبك بنجاح</h4>
      <p class="text-sm text-neutral-600">رقم طلبك: <strong id="success-order-id" class="text-[#FF6B00] font-mono">COD-1050</strong></p>
      <p class="text-xs text-neutral-500">سيتصل بك موزعنا لتسليم الطلبية في غضون 24-48 ساعة والدفع عند الاستلام.</p>
    </div>
  </div>

  <!-- Mobile Floating Sticky Button -->
  <div id="sticky-bottom-bar" class="fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-2xl md:hidden">
    <div class="max-w-md mx-auto flex items-center justify-between gap-3">
      <div class="text-right">
        <div class="text-[10px] text-neutral-500 font-bold leading-tight">الدفع عند الاستلام</div>
        <div class="text-lg font-black text-[#111111] font-mono leading-none">
          <span id="sticky-price">${product.price}</span> <span class="text-xs font-bold text-[#FF6B00]">${product.currency || 'DH'}</span>
        </div>
      </div>
      <button type="button" onclick="openOrderModal()" class="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#E05300] text-white font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
        <span>🛒</span>
        <span>اطلب الآن — شحن مجاني</span>
      </button>
    </div>
  </div>

  <!-- QUICK ORDER POPUP MODAL -->
  <div id="order-modal-backdrop" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="relative w-full sm:max-w-md max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
      <button type="button" onclick="closeOrderModal()" class="absolute top-3.5 left-3.5 z-40 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg font-bold">✕</button>

      <div class="bg-gradient-to-r from-[#FF6B00] to-[#E05300] text-white p-4 text-center space-y-1">
        <h3 class="text-lg font-black">طلب سريع — الدفع عند الاستلام</h3>
        <p class="text-xs text-white/90">أدخل معلوماتك وسنقوم بتوصيل طلبك مجاناً</p>
      </div>

      <div class="overflow-y-auto p-4 sm:p-6 space-y-4">
        <form id="modal-order-form" onsubmit="handleModalFormSubmit(event)" class="space-y-3.5">
          <div>
            <label class="block text-xs font-black text-neutral-800 mb-1">الاسم الكامل *</label>
            <input type="text" id="modal-customer-name" oninput="checkModalFormValidity()" placeholder="الاسم الكامل" required class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-[#F8F8F6] focus:ring-2 focus:ring-[#FF6B00]">
          </div>
          <div>
            <label class="block text-xs font-black text-neutral-800 mb-1">رقم الهاتف (الواتساب) *</label>
            <input type="tel" id="modal-customer-phone" dir="ltr" oninput="checkModalFormValidity()" placeholder="06XXXXXXXX" required class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-[#F8F8F6] text-left font-mono focus:ring-2 focus:ring-[#FF6B00]">
          </div>
          <div class="relative">
            <label class="block text-xs font-black text-neutral-800 mb-1">المدينة *</label>
            <input type="text" id="modal-city-search" onfocus="showModalCityDropdown()" oninput="filterModalCityDropdown()" placeholder="ابحث عن مدينتك..." required class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-[#F8F8F6] focus:ring-2 focus:ring-[#FF6B00]">
            <div id="modal-city-dropdown" class="hidden absolute top-full inset-x-0 mt-1 max-h-44 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-lg z-50 divide-y divide-neutral-100"></div>
            <input type="hidden" id="modal-selected-city" value="">
          </div>
          <div>
            <label class="block text-xs font-black text-neutral-800 mb-1">العنوان أو الحي *</label>
            <input type="text" id="modal-customer-address" oninput="checkModalFormValidity()" placeholder="الحي ورقم المنزل" required class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-[#F8F8F6] focus:ring-2 focus:ring-[#FF6B00]">
          </div>

          <button id="modal-submit-button" type="submit" disabled class="w-full py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-80 shadow-none">
            <span>🛒</span>
            <span id="modal-submit-text">الرجاء إدخال معلوماتك لتأكيد الطلب</span>
          </button>
        </form>

        <div id="modal-success-screen" class="hidden text-center py-6 space-y-3">
          <div class="w-12 h-12 rounded-full bg-[#E8F8F0] text-[#129A56] mx-auto flex items-center justify-center text-2xl font-black">✓</div>
          <h4 class="text-xl font-black text-neutral-900">تم تسجيل طلبك بنجاح!</h4>
          <p class="text-xs text-neutral-600">سيتواصل معك فريقنا هاتفياً فوراً لتسليم الطلبية.</p>
          <button type="button" onclick="closeOrderModal()" class="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white font-bold text-xs">إغلاق</button>
        </div>
      </div>
    </div>
  </div>
</div>

{% schema %}
{
  "name": "Big Offer Landing",
  "settings": [
    {
      "type": "text",
      "id": "offer_text",
      "label": "نص العرض العلوي",
      "default": "تخفيض استثنائي + شحن مجاني لكافة المدن المغربية"
    },
    {
      "type": "text",
      "id": "badge",
      "label": "شارة العرض",
      "default": "العرض الأكثر مبيعاً"
    }
  ]
}
{% endschema %}
`;
fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'big-offer-landing.liquid'), bigOfferLandingLiquid, 'utf8');

// Other standard sections required by templates
const genericSection = (name) => `
<div class="max-w-2xl mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-4">{{ page_title | default: "${name}" }}</h1>
  <div>{{ content_for_layout }}</div>
</div>
{% schema %}
{
  "name": "${name}",
  "settings": []
}
{% endschema %}
`;

fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'main-collection.liquid'), genericSection('Collection'), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'main-list-collections.liquid'), genericSection('Collections'), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'main-page.liquid'), genericSection('Page'), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'main-cart.liquid'), genericSection('Cart'), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'main-search.liquid'), genericSection('Search'), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'notice-bar.liquid'), genericSection('Notice Bar'), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'header.liquid'), genericSection('Header'), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'sections', 'footer.liquid'), genericSection('Footer'), 'utf8');

// Locales
const localeAr = {
  "general": {
    "add_to_cart": "اطلب الآن بالدفع عند الاستلام",
    "search": "بحث",
    "cart": "سلة المشتريات",
    "checkout": "الدفع عند الاستلام"
  }
};
const localeEn = {
  "general": {
    "add_to_cart": "Order Now - Cash on Delivery",
    "search": "Search",
    "cart": "Cart",
    "checkout": "Cash on Delivery"
  }
};
fs.writeFileSync(path.join(BUILD_DIR, 'locales', 'ar.json'), JSON.stringify(localeAr, null, 2), 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'locales', 'en.json'), JSON.stringify(localeEn, null, 2), 'utf8');


// 8. Documentation: Arabic guide for YouCan shop integration
const docsAr = `# دليل تركيب قالب Big-Offer على منصة YouCan Shop أو أي موقع إلكتروني

أهلاً بك! هذا الملف المضغوط تم إعداده خصيصاً ليمنحك **نفس صفحة الهبوط Big-Offer بالضبط** وبأعلى احترافية، مع نموذج الدفع عند الاستلام، والنافذة المنبثقة (Popup)، وقائمة المدن المغربية، وزر الشراء غير النشط حتى إدخال المعلومات.

---

## الخيار 1: استيراد القالب في منصة YouCan Shop

1. قم بتسجيل الدخول إلى لوحة تحكم متجرك في **YouCan** (https://seller-area.youcan.shop).
2. من القائمة الجانبية، اضغط على **المتجر (Store)** ثم **القوالب (Themes)**.
3. اضغط على زر **إضافة قالب / رفع قالب (Upload Theme)**.
4. اختر هذا الملف المضغوط: \`big-offer-youcan-theme.zip\`.
5. سيتم رفع القالب وتثبيته مباشرة.
6. يمكنك أيضاً استيراد إعدادات الألوان والأقسام مباشرة عبر رفع ملف \`theme.json\` المرفق.

---

## الخيار 2: استخدام صفحة الهبوط في أي موقع أو استضافة مستقلة (cPanel / WordPress / Custom Domain)

1. فك ضغط ملف \`big-offer-youcan-theme.zip\`.
2. ستجد ملف \`index.html\` جاهزاً ومستقلاً تماماً ومعه مجلد \`assets\` الذي يحتوي على:
   - كافة صور وفيديوهات المنتج بدقة عالية
   - ملف التنسيقات \`style.css\`
   - ملف الوظائف \`main.js\` و \`morocco-cities.js\`
3. ارفع الملفات إلى المجلد الرئيسي في استضافتك (\`public_html\`) أو أي مجلد فرعي.
4. ستعمل صفحة الهبوط فوراً بسرعة فائقة وتصميم متجاوب 100% مع الهواتف والحواسيب.

---

## مميزات هذا القالب المجهزة مسبقاً:

- ✅ **زر تأكيد الطلب الذكي:** يكون غير نشط (Inactive / Disabled) حتى يقوم الزبون بإدخال اسمه ورقم هاتفه واختيار مدينته وعنوانه، ثم يتفعل تلقائياً بنبض جذاب.
- ✅ **نافذة منبثقة للطلب السريع (Popup Form):** عند الضغط على أزرار الشراء، تفتح فوراً نافذة منبثقة سريعة دون الحاجة إلى النزول لأسفل الصفحة.
- ✅ **قائمة كافة مدن المغرب (70+ مدينة):** مع محرك بحث سريع بالعربية والفرنسية.
- ✅ **عداد تنازلي ومؤشر نفاذ المخزون:** لرفع نسبة التحويل (Scarcity & Urgency).
- ✅ **تتبع تلقائي:** جاهز مع Google Analytics وبيكسل تتبع المبيعات.
`;

fs.writeFileSync(path.join(BUILD_DIR, 'TUTORIAL_YOUCAN_AR.md'), docsAr, 'utf8');
fs.writeFileSync(path.join(BUILD_DIR, 'README.md'), docsAr, 'utf8');

console.log('Building ZIP archive using python zipfile...');

// Use Python script to build the pristine ZIP archive
const pythonScript = `
import zipfile
import os

build_dir = "${BUILD_DIR.replace(/\\/g, '/')}"
zip_path = "${path.join(PUBLIC_DOWNLOADS_DIR, 'big-offer-youcan-theme.zip').replace(/\\/g, '/')}"

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(build_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, build_dir)
            zipf.write(full_path, rel_path)

print("Successfully created ZIP file at:", zip_path)
`;

fs.writeFileSync(path.join(ROOT_DIR, 'scripts', 'zip_theme.py'), pythonScript, 'utf8');

try {
  const result = execSync('python3 scripts/zip_theme.py', { cwd: ROOT_DIR }).toString();
  console.log(result);
} catch (e) {
  console.error('Python zip failed:', e);
}

// Check size of created ZIP
const zipStats = fs.statSync(path.join(PUBLIC_DOWNLOADS_DIR, 'big-offer-youcan-theme.zip'));
console.log('ZIP File created successfully! Size:', (zipStats.size / 1024).toFixed(1), 'KB');
