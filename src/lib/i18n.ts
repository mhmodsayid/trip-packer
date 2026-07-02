export type Locale = "ar" | "en";

export const LOCALE_STORAGE_KEY = "trip-packer:locale";
export const DEFAULT_LOCALE: Locale = "ar";

const translations = {
  en: {
    appTitle: "Trip Packer",
    appTagline: "Create a shared packing list. Everyone claims what they'll bring.",
    appTaglineShort: "Coordinate what everyone brings on your next adventure.",

    langArabic: "العربية",
    langEnglish: "English",
    switchLanguage: "Switch language",

    createTrip: "Create a new trip",
    tripNamePlaceholder: "Trip name (e.g. Yosemite Camping)",
    createTripButton: "Create trip",
    joinExisting: "Join an existing trip",
    joinExistingHint: "Enter the trip ID from your organizer, then you'll be asked for the PIN.",
    tripIdLabel: "Trip ID",
    tripIdPlaceholder: "e.g. 550e8400-e29b-41d4-a716-446655440000",
    continueToJoin: "Continue",
    enterPin: "Trip PIN",
    pinPlaceholder: "Enter the PIN",
    tooManyAttempts: "Too many failed attempts. Try again in {{time}}.",
    openLink: "Open link",
    tripCreated: "Trip created!",
    tripCreatedHint: "Share the link below so others can join",
    continueToList: "Continue to packing list",

    joinTrip: "Join trip",
    joinTripButton: "Join trip",
    yourName: "Your name",
    namePlaceholder: "Enter your name",
    joiningTrip: "You're joining",
    cantJoin: "Can't join trip",
    goHome: "Go home",

    signedInAs: "Signed in as",
    changeName: "Change name",
    changeNameTitle: "Change your name",
    save: "Save",
    cancel: "Cancel",
    shareJoinLink: "Share join link",
    hideShareLink: "Hide share link",
    packingList: "Packing list",

    filterAll: "All",
    filterUnclaimed: "Unclaimed",
    filterMine: "Mine",
    searchPlaceholder: "Search items...",
    noItemsYet: "No items yet. Use Add items to start.",
    noItemsMatch: "No items match your filter.",
    unclaimed: "Unclaimed",
    you: "You",
    unknown: "Unknown",
    claim: "Claim",
    unclaim: "Unclaim",
    delete: "Delete",
    deleteConfirm: 'Remove "{{name}}" from the list?',
    assignedTo: "Assigned to {{name}}",
    selectItems: "Select",
    cancelSelect: "Cancel",
    claimSelected: "Claim selected ({{count}})",
    selectedCount: "{{count}} selected",
    selectItem: "Select {{name}}",

    addItems: "Add items",
    close: "Close",
    addItemsHint: "Paste a list, upload a spreadsheet, or quick-add one item.",
    quickAddPlaceholder: "Quick add an item...",
    add: "Add",
    pasteList: "Paste list",
    pastePlaceholder:
      "One item per line. Formats:\n• Tent\n• Sleeping bag x2\n• Headlamp #gear\n• Water bottle, 3, drinks\n• Snacks\t2\tfood",
    preview: "Preview",
    addFromPaste: "Add from paste",
    uploadSpreadsheet: "Upload Excel / CSV",
    uploadHint: "Header row with columns: name, quantity (optional), category (optional).",
    itemsReady: "{{count}} items ready",
    itemReady: "1 item ready",
    andMore: "…and {{count}} more",

    shareLinkTitle: "Share join link",
    pinLabel: "PIN",
    qrAlt: "QR code for join link",
    copyLink: "Copy link",
    copied: "Copied!",

    configTitle: "Supabase not configured",
    configBody:
      "Copy .env.example to .env.local and set your Supabase URL and anon key. See the README for setup steps.",

    loading: "Loading",

    itemAdded: "Item added.",
    itemAlreadyExists: "This item already exists.",
    addedWithSkipped: "Added {{added}}, skipped {{skipped}} duplicates.",
    importedWithSkipped: "Imported {{added}} from {{file}}, skipped {{skipped}} duplicates.",
    allDuplicatesSkipped: "All {{count}} items were duplicates — nothing added.",
    addedItems: "Added {{count}} items.",
    addedItem: "Added 1 item.",
    importedItems: "Imported {{count}} items from {{file}}.",
    importedItem: "Imported 1 item from {{file}}.",

    adminLink: "Admin",
    adminLoginTitle: "Admin login",
    adminPassword: "Password",
    adminPasswordPlaceholder: "Enter admin password",
    adminLoginButton: "Sign in",
    adminLogout: "Log out",
    adminDashboard: "Admin dashboard",
    adminAllTrips: "All trips",
    adminNoTrips: "No trips yet.",
    adminTripName: "Trip name",
    adminCreated: "Created",
    adminItems: "Items",
    adminPeople: "People",
    adminView: "Manage",
    adminBackToDashboard: "Back to dashboard",
    adminTripSettings: "Trip settings",
    adminRenameTrip: "Rename trip",
    adminSave: "Save",
    adminPin: "PIN",
    adminSetPin: "Set PIN",
    adminRegeneratePin: "Regenerate PIN",
    adminDeleteTrip: "Delete trip",
    adminDeleteTripConfirm: 'Delete trip "{{name}}" and all its items and people?',
    adminPeopleList: "Participants",
    adminNoPeople: "No participants.",
    adminItemsList: "Items",
    adminNoItems: "No items.",
    adminItemName: "Name",
    adminQuantity: "Qty",
    adminCategory: "Category",
    adminAssignedTo: "Assigned to",
    adminAddedBy: "Added by",
    adminUnassigned: "Unassigned",
    adminClearAssignment: "Clear assignment",
    adminUpdateItem: "Update item",
    adminDeleteItem: "Delete item",
    adminDeleteItemConfirm: 'Delete item "{{name}}"?',
    adminInvalidPassword: "Incorrect password.",
    adminNotConfigured: "Admin is not configured on this server.",
    adminEnterTrip: "Enter trip as participant",
    adminEnterTripTitle: "Join as participant",
    adminEnterTripHint: "Choose the name you'll use on the packing list.",
    adminEnterTripConfirm: "Enter trip",
    adminParticipantDefaultName: "Admin",

    errors: {
      failedCreateTrip: "Failed to create trip.",
      invalidJoinLink: "Enter a valid join link URL.",
      invalidTripId: "Enter a valid trip ID (UUID).",
      tripNotFound: "Trip not found.",
      failedLoadTrip: "Failed to load trip.",
      missingPin: "Missing PIN in the link. Ask the trip organizer for the full join link.",
      invalidPin: "Invalid PIN. Check the link and try again.",
      failedValidateTrip: "Failed to validate trip.",
      failedJoinTrip: "Failed to join trip.",
      actionFailed: "Action failed.",
      itemAlreadyClaimed: "Item is already claimed.",
      couldNotUnclaim: "Could not unclaim item.",
      couldNotDeleteItem: "You can only remove items you added.",
      noValidItems: "No valid items found. Check the format.",
      failedAddItems: "Failed to add items.",
      failedAddItem: "Failed to add item.",
      noValidRows: "No valid rows found. Expected columns: name, quantity, category.",
      failedImport: "Failed to import file.",
      failedRename: "Failed to change name.",
      emptyName: "Name cannot be empty.",
      missingSupabase:
        "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    },
  },
  ar: {
    appTitle: "مُنَظِّم الرحلة",
    appTagline: "أنشئ قائمة تعبئة مشتركة. كل شخص يختار ما سيحضره.",
    appTaglineShort: "نسّق ما يحضره الجميع في رحلتك القادمة.",

    langArabic: "العربية",
    langEnglish: "English",
    switchLanguage: "تغيير اللغة",

    createTrip: "إنشاء رحلة جديدة",
    tripNamePlaceholder: "اسم الرحلة (مثال: camping Yosemite)",
    createTripButton: "إنشاء الرحلة",
    joinExisting: "الانضمام لرحلة موجودة",
    joinExistingHint: "أدخل معرّف الرحلة من المنظّم، ثم سيُطلب منك رمز PIN.",
    tripIdLabel: "معرّف الرحلة",
    tripIdPlaceholder: "مثال: 550e8400-e29b-41d4-a716-446655440000",
    continueToJoin: "متابعة",
    enterPin: "رمز PIN للرحلة",
    pinPlaceholder: "أدخل رمز PIN",
    tooManyAttempts: "عدد محاولات كبير. حاول مرة أخرى بعد {{time}}.",
    openLink: "فتح الرابط",
    tripCreated: "تم إنشاء الرحلة!",
    tripCreatedHint: "شارك الرابط أدناه لينضم الآخرون إلى",
    continueToList: "متابعة إلى قائمة التعبئة",

    joinTrip: "الانضمام للرحلة",
    joinTripButton: "انضم للرحلة",
    yourName: "اسمك",
    namePlaceholder: "أدخل اسمك",
    joiningTrip: "أنت تنضم إلى",
    cantJoin: "تعذّر الانضمام",
    goHome: "الصفحة الرئيسية",

    signedInAs: "مسجّل باسم",
    changeName: "تغيير الاسم",
    changeNameTitle: "تغيير اسمك",
    save: "حفظ",
    cancel: "إلغاء",
    shareJoinLink: "مشاركة رابط الانضمام",
    hideShareLink: "إخفاء رابط المشاركة",
    packingList: "قائمة التعبئة",

    filterAll: "الكل",
    filterUnclaimed: "غير محجوز",
    filterMine: "محجوز لي",
    searchPlaceholder: "ابحث في العناصر...",
    noItemsYet: "لا توجد عناصر بعد. استخدم «إضافة عناصر» للبدء.",
    noItemsMatch: "لا توجد عناصر تطابق التصفية.",
    unclaimed: "غير محجوز",
    you: "أنت",
    unknown: "غير معروف",
    claim: "احجز",
    unclaim: "إلغاء الحجز",
    delete: "حذف",
    deleteConfirm: 'إزالة "{{name}}" من القائمة؟',
    assignedTo: "محجوز لـ {{name}}",
    selectItems: "تحديد",
    cancelSelect: "إلغاء",
    claimSelected: "احجز المحدد ({{count}})",
    selectedCount: "{{count}} محدد",
    selectItem: "تحديد {{name}}",

    addItems: "إضافة عناصر",
    close: "إغلاق",
    addItemsHint: "الصق قائمة، ارفع جدول بيانات، أو أضف عنصراً واحداً بسرعة.",
    quickAddPlaceholder: "إضافة سريعة لعنصر...",
    add: "إضافة",
    pasteList: "لصق قائمة",
    pastePlaceholder:
      "عنصر واحد في كل سطر. الصيغ:\n• خيمة\n• كيس نوم x2\n• مصباح #معدات\n• زجاجة ماء، 3، مشروبات\n• وجبات\t2\tطعام",
    preview: "معاينة",
    addFromPaste: "إضافة من اللصق",
    uploadSpreadsheet: "رفع Excel / CSV",
    uploadHint: "صف عناوين بالأعمدة: name، quantity (اختياري)، category (اختياري).",
    itemsReady: "{{count}} عناصر جاهزة",
    itemReady: "عنصر واحد جاهز",
    andMore: "…و{{count}} أخرى",

    shareLinkTitle: "مشاركة رابط الانضمام",
    pinLabel: "رمز PIN",
    qrAlt: "رمز QR لرابط الانضمام",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ!",

    configTitle: "Supabase غير مُعدّ",
    configBody:
      "انسخ .env.example إلى .env.local واضبط رابط Supabase ومفتاح anon. راجع README لخطوات الإعداد.",

    loading: "جاري التحميل",

    itemAdded: "تمت إضافة العنصر.",
    itemAlreadyExists: "هذا العنصر موجود بالفعل.",
    addedWithSkipped: "تمت إضافة {{added}}، وتخطّي {{skipped}} مكررات.",
    importedWithSkipped: "تم استيراد {{added}} من {{file}}، وتخطّي {{skipped}} مكررات.",
    allDuplicatesSkipped: "جميع {{count}} عناصر كانت مكررة — لم تُضف أي عناصر.",
    addedItems: "تمت إضافة {{count}} عناصر.",
    addedItem: "تمت إضافة عنصر واحد.",
    importedItems: "تم استيراد {{count}} عناصر من {{file}}.",
    importedItem: "تم استيراد عنصر واحد من {{file}}.",

    adminLink: "إدارة",
    adminLoginTitle: "دخول المسؤول",
    adminPassword: "كلمة المرور",
    adminPasswordPlaceholder: "أدخل كلمة مرور المسؤول",
    adminLoginButton: "تسجيل الدخول",
    adminLogout: "تسجيل الخروج",
    adminDashboard: "لوحة الإدارة",
    adminAllTrips: "جميع الرحلات",
    adminNoTrips: "لا توجد رحلات بعد.",
    adminTripName: "اسم الرحلة",
    adminCreated: "تاريخ الإنشاء",
    adminItems: "العناصر",
    adminPeople: "الأشخاص",
    adminView: "إدارة",
    adminBackToDashboard: "العودة للوحة",
    adminTripSettings: "إعدادات الرحلة",
    adminRenameTrip: "إعادة تسمية الرحلة",
    adminSave: "حفظ",
    adminPin: "رمز PIN",
    adminSetPin: "تعيين PIN",
    adminRegeneratePin: "إنشاء PIN جديد",
    adminDeleteTrip: "حذف الرحلة",
    adminDeleteTripConfirm: 'حذف الرحلة "{{name}}" وجميع عناصرها وأشخاصها؟',
    adminPeopleList: "المشاركون",
    adminNoPeople: "لا يوجد مشاركون.",
    adminItemsList: "العناصر",
    adminNoItems: "لا توجد عناصر.",
    adminItemName: "الاسم",
    adminQuantity: "الكمية",
    adminCategory: "الفئة",
    adminAssignedTo: "محجوز لـ",
    adminAddedBy: "أضافه",
    adminUnassigned: "غير محجوز",
    adminClearAssignment: "إلغاء التعيين",
    adminUpdateItem: "تحديث العنصر",
    adminDeleteItem: "حذف العنصر",
    adminDeleteItemConfirm: 'حذف العنصر "{{name}}"؟',
    adminInvalidPassword: "كلمة المرور غير صحيحة.",
    adminNotConfigured: "لم يتم إعداد المسؤول على هذا الخادم.",
    adminEnterTrip: "الدخول إلى الرحلة كمشارك",
    adminEnterTripTitle: "الانضمام كمشارك",
    adminEnterTripHint: "اختر الاسم الذي ستستخدمه في قائمة التعبئة.",
    adminEnterTripConfirm: "دخول الرحلة",
    adminParticipantDefaultName: "المشرف",

    errors: {
      failedCreateTrip: "فشل إنشاء الرحلة.",
      invalidJoinLink: "أدخل رابط انضمام صالح.",
      invalidTripId: "أدخل معرّف رحلة صالح (UUID).",
      tripNotFound: "الرحلة غير موجودة.",
      failedLoadTrip: "فشل تحميل الرحلة.",
      missingPin: "رمز PIN مفقود من الرابط. اطلب رابط الانضمام الكامل من منظم الرحلة.",
      invalidPin: "رمز PIN غير صحيح. تحقق من الرابط وحاول مجدداً.",
      failedValidateTrip: "فشل التحقق من الرحلة.",
      failedJoinTrip: "فشل الانضمام للرحلة.",
      actionFailed: "فشلت العملية.",
      itemAlreadyClaimed: "العنصر محجوز بالفعل.",
      couldNotUnclaim: "تعذّر إلغاء الحجز.",
      couldNotDeleteItem: "يمكنك حذف العناصر التي أضفتها فقط.",
      noValidItems: "لم يُعثر على عناصر صالحة. تحقق من الصيغة.",
      failedAddItems: "فشلت إضافة العناصر.",
      failedAddItem: "فشلت إضافة العنصر.",
      noValidRows: "لم يُعثر على صفوف صالحة. الأعمدة المتوقعة: name، quantity، category.",
      failedImport: "فشل استيراد الملف.",
      failedRename: "فشل تغيير الاسم.",
      emptyName: "لا يمكن أن يكون الاسم فارغاً.",
      missingSupabase:
        "إعداد Supabase ناقص. اضبط NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY في .env.local",
    },
  },
} as const;

type MessageMap = typeof translations.en;
export type TranslationKey = {
  [K in keyof MessageMap]: MessageMap[K] extends string ? K : never;
}[keyof MessageMap];

export type ErrorKey = keyof typeof translations.en.errors;

export function isLocale(value: string): value is Locale {
  return value === "ar" || value === "en";
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isLocale(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

type Params = Record<string, string | number>;

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Params
): string {
  const value = translations[locale][key];
  const text = typeof value === "string" ? value : String(value);
  if (!params) return text;
  return Object.entries(params).reduce(
    (result, [name, val]) => result.replace(`{{${name}}}`, String(val)),
    text
  );
}

export function translateError(locale: Locale, code: ErrorKey): string {
  return translations[locale].errors[code];
}

export function localeDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
