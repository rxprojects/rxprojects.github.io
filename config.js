/* =========================================================
   Rx Projects — إعدادات الموقع
   كل اللي محتاج تعدّله موجود هنا. مش محتاج تلمس أي ملف تاني.
   ========================================================= */

window.RX_CONFIG = {
  // لينك الـ Web App بتاع Google Apps Script (خطوة 3 في دليل النشر).
  // لو سبته فاضي، الموقع يشتغل في "وضع التجربة" ومبيبعتش حاجة.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxbthc337f62M0BJt6MC-uXzNaPWxNICVM9iltLskQOXvfqfygE7UWb-1D0NwG6eExX/exec",

  // بيانات الدفع — بتظهر للعميل في خطوة الدفع
  // لو سبتهم فاضيين، الموقع بيقول للعميل إن بيانات التحويل هتوصله على تيليجرام (رقمك مبيظهرش على الموقع).
  INSTAPAY_HANDLE: "",                       // عنوان InstaPay — اختياري
  VODAFONE_CASH: "",                         // رقم فودافون كاش — اختياري (هيظهر للعامة لو كتبته)

  // التواصل
  TELEGRAM_USERNAME: "RxProjects",           // من غير @
  EMAIL: "",                                 // اختياري

  // نسبة العربون
  DEPOSIT_RATE: 0.5,
  FULL_PAYMENT_BELOW: 1000,                  // الطلبات أقل من المبلغ ده تتدفع كاملة مقدمًا
  EXPRESS_SURCHARGE: 0.4,                    // التسليم المستعجل (48 ساعة)

  // أقصى حجم إجمالي للملفات المرفوعة من الموقع (ميجا). الأكبر من كده يتبعت كلينك Drive.
  MAX_UPLOAD_MB: 25
};

/* ---------------------------------------------------------
   الباقات والخدمات — عدّل الأسعار والأوصاف براحتك.
   price: السعر بالجنيه. لو null يبقى "حسب المراجعة".
   unit: نص اختياري يظهر جنب السعر.
   --------------------------------------------------------- */
window.RX_CATALOG = {
  undergrad: {
    label: "مشاريع التخرج",
    sub: "بكالوريوس — كل الكليات",
    items: [
      {
        id: "ug-format", name: "Format", price: 700,
        summary: "تنسيق المشروع كامل حسب دليل الكلية",
        includes: ["تنسيق Word كامل بـ Styles", "المراجع بالأسلوب المطلوب", "فهرس وقوائم جداول وأشكال تلقائية"],
        days: "3 أيام"
      },
      {
        id: "ug-present", name: "Present", price: 1500, featured: true,
        summary: "التنسيق + العرض اللي هتقدّم بيه",
        includes: ["كل اللي في Format", "باوربوينت مخصص حتى 20 شريحة", "Speaker notes لكل شريحة"],
        days: "5 أيام"
      },
      {
        id: "ug-defense", name: "Defense", price: 2500,
        summary: "جاهز للمناقشة من كل ناحية",
        includes: ["كل اللي في Present", "بوستر علمي للطباعة", "جلسة أسئلة متوقعة أونلاين"],
        days: "7 أيام"
      }
    ]
  },
  postgrad: {
    label: "الدراسات العليا",
    sub: "ماجستير ودكتوراه",
    items: [
      {
        id: "pg-format", name: "تنسيق الرسالة", price: 3500, unit: "حتى 150 صفحة",
        sizing: { kind: "pages", label: "صفحة", included: 150, extra: 20, def: 150, step: 10, min: 30, max: 800 },
        summary: "تنسيق حسب دليل جامعتك بالحرف",
        includes: ["Styles وترقيم روماني وعربي", "فهارس وقوائم تلقائية", "المراجع على EndNote أو Zotero", "+20 ج.م لكل صفحة فوق 150"],
        days: "5 أيام"
      },
      {
        id: "pg-stats", name: "إحصاء أساسي", price: 2500,
        summary: "وصفي + حتى 5 اختبارات",
        includes: ["تنظيف وترميز البيانات", "SPSS أو R أو GraphPad", "جداول ورسوم بجودة نشر", "شرح مبسط لكل نتيجة"],
        days: "5 أيام"
      },
      {
        id: "pg-stats-adv", name: "إحصاء متقدم", price: 5000, unit: "يبدأ من",
        summary: "Regression، ROC، Survival",
        includes: ["نماذج متعددة المتغيرات", "حساب حجم العينة عند الحاجة", "Output كامل + ملف البيانات"],
        days: "7 أيام"
      },
      {
        id: "pg-slides", name: "عرض المناقشة", price: 3000,
        summary: "30 إلى 40 شريحة + Notes",
        includes: ["تصميم مخصص لموضوعك", "النتائج في رسوم مبسطة", "Speaker notes كاملة"],
        days: "5 أيام"
      },
      {
        id: "pg-defense-ready", name: "Defense Ready", price: 7500, featured: true, was: 9500,
        summary: "الباقة الكاملة للمناقشة",
        includes: ["تنسيق الرسالة", "إحصاء أساسي", "عرض المناقشة", "بروفة أونلاين + أسئلة متوقعة"],
        days: "10 أيام"
      },
      {
        id: "pg-publish", name: "دعم النشر", price: 3000, unit: "لمخطوطة واحدة",
        summary: "مخطوطتك جاهزة للرفع على الجورنال",
        includes: ["تنسيق حسب تعليمات الجورنال", "Cover letter", "ترتيب الرد على المراجعين"],
        days: "4 أيام"
      },
      {
        id: "pg-editing", name: "تحرير لغوي إنجليزي", price: 200, unit: "لكل 1,000 كلمة",
        sizing: { kind: "words", label: "كلمة", per: 1000, def: 10000, step: 1000, min: 1000, max: 120000 },
        summary: "لغة أكاديمية سليمة بـ Tracked changes",
        includes: ["قواعد وأسلوب ومصطلحات", "كل تعديل ظاهر وقابل للرفض", "ملاحظات على الفقرات المحتاجة توضيح"],
        days: "حسب الحجم"
      }
    ]
  },
  custom: {
    id: "custom", name: "طلب مخصص", price: null,
    summary: "خدمة مش في القايمة أو أكتر من خدمة مع بعض"
  }
};
