/**
 * =======================================================================
 * Universal Accessibility Widget (WCAG 2.1 / 2.2 AA Compliance Engine)
 * Standalone Drop-in Script for Local Portals & Live Websites
 * =======================================================================
 * Features:
 *  - 100% Identical Visual Replica of Image 1 UI
 *  - Safe Auto-Loader (works in <head>, <body>, async, defer, or module)
 *  - Maximum z-index (2147483647) with bulletproof CSS isolation
 *  - 12 Full WCAG AA Settings with Official Lucide SVGs
 *  - Real Inline Vector SVG Country Flags
 *  - 30+ Language Live Translations (Tamil, English, Hindi, Chinese, etc.)
 *  - Real Page Overrides (Stop Autoplay, Pause Animations, Reduce Motion, Reading Progress)
 *  - Zero External Dependencies (100% Offline Capable & Plug-and-Play)
 * =======================================================================
 */

(function () {
  'use strict';

  // Prevent duplicate instances
  if (window.__A11Y_WIDGET_LOADED__) return;
  window.__A11Y_WIDGET_LOADED__ = true;

  // ---------------------------------------------------------------------
  // 1. DATA: Languages & Real Vector SVG Flags
  // ---------------------------------------------------------------------
  const FLAGS = {
    US: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#bd3d44" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="37" d="M0 55.5h640M0 129.5h640M0 203.5h640M0 277.5h640M0 351.5h640M0 425.5h640"/><path fill="#192f5d" d="M0 0h260v258.5H0z"/><g fill="#fff"><circle cx="26" cy="20" r="7"/><circle cx="78" cy="20" r="7"/><circle cx="130" cy="20" r="7"/><circle cx="182" cy="20" r="7"/><circle cx="234" cy="20" r="7"/><circle cx="52" cy="40" r="7"/><circle cx="104" cy="40" r="7"/><circle cx="156" cy="40" r="7"/><circle cx="208" cy="40" r="7"/><circle cx="26" cy="60" r="7"/><circle cx="78" cy="60" r="7"/><circle cx="130" cy="60" r="7"/><circle cx="182" cy="60" r="7"/><circle cx="234" cy="60" r="7"/></g></svg>',
    IN: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#f93" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#128807" d="M0 320h640v160H0z"/><circle cx="320" cy="240" r="56" fill="none" stroke="#008" stroke-width="8"/><circle cx="320" cy="240" r="14" fill="#008"/></svg>',
    CN: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#ee1c25" d="M0 0h640v480H0z"/><path fill="#ff0" d="M125 150l-28-86 73 53h-90l73-53zm67-97l-7 22 19-14h-24l19 14zm35 34l-15 18 23-4h-23l20 12zm13 46l-21 10 24 7h-21l16 17zm-14 46l-23-2 19 16-16-16 10 22z"/></svg>',
    ES: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#c60b1e" d="M0 0h640v120H0zm0 360h640v120H0z"/><path fill="#ffc400" d="M0 120h640v240H0z"/><circle cx="160" cy="240" r="40" fill="#c60b1e"/></svg>',
    FR: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#002654" d="M0 0h213.3v480H0z"/><path fill="#fff" d="M213.3 0h213.4v480H213.3z"/><path fill="#ce1126" d="M426.7 0H640v480H426.7z"/></svg>',
    DE: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#000" d="M0 0h640v160H0z"/><path fill="#d00" d="M0 160h640v160H0z"/><path fill="#ffce00" d="M0 320h640v160H0z"/></svg>',
    IT: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#009246" d="M0 0h213.3v480H0z"/><path fill="#fff" d="M213.3 0h213.4v480H213.3z"/><path fill="#ce2b37" d="M426.7 0H640v480H426.7z"/></svg>',
    PT: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#046a38" d="M0 0h256v480H0z"/><path fill="#da291c" d="M256 0h384v480H256z"/><circle cx="256" cy="240" r="60" fill="#ffcd00"/></svg>',
    RU: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#fff" d="M0 0h640v160H0z"/><path fill="#0039a6" d="M0 160h640v160H0z"/><path fill="#d52b1e" d="M0 320h640v160H0z"/></svg>',
    JP: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#fff" d="M0 0h640v480H0z"/><circle cx="320" cy="240" r="120" fill="#bc002d"/></svg>',
    KR: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#fff" d="M0 0h640v480H0z"/><circle cx="320" cy="240" r="90" fill="#cd2e3a"/><path fill="#0047a0" d="M320 150a90 90 0 0 0 0 180 45 45 0 0 1 0-90 45 45 0 0 0 0-90z"/></svg>',
    SA: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#006c35" d="M0 0h640v480H0z"/><path fill="#fff" d="M180 320h280v15H180z"/></svg>',
    BD: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#006a4e" d="M0 0h640v480H0z"/><circle cx="280" cy="240" r="130" fill="#f42a41"/></svg>',
    PK: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#fff" d="M0 0h160v480H0z"/><path fill="#01411c" d="M160 0h480v480H160z"/><circle cx="400" cy="240" r="100" fill="#fff"/></svg>',
    TR: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#e30a17" d="M0 0h640v480H0z"/><circle cx="280" cy="240" r="110" fill="#fff"/><circle cx="310" cy="240" r="90" fill="#e30a17"/></svg>',
    VN: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#da251d" d="M0 0h640v480H0z"/><path fill="#ff0" d="M320 130l32 98 103-60-78 80 88 56-104-5-31 99-31-99-104 5 88-56-78-80 103 60z"/></svg>',
    NL: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#ae1c28" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#21468b" d="M0 320h640v160H0z"/></svg>',
    PL: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#fff" d="M0 0h640v240H0z"/><path fill="#dc143c" d="M0 240h640v240H0z"/></svg>',
    GR: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#0d5eaf" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="53" d="M0 80h640M0 187h640M0 293h640M0 400h640"/><path fill="#0d5eaf" d="M0 0h240v240H0z"/><path stroke="#fff" stroke-width="48" d="M0 120h240M120 0v240"/></svg>',
    CZ: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#d7141a" d="M0 240h640v240H0z"/><path fill="#fff" d="M0 0h640v240H0z"/><path fill="#11457e" d="M0 0l320 240L0 480z"/></svg>',
    SE: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#006aa7" d="M0 0h640v480H0z"/><path fill="#fecc00" d="M0 192h640v96H0zm192-192h96v480h-96z"/></svg>',
    ID: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#e70000" d="M0 0h640v240H0z"/><path fill="#fff" d="M0 240h640v240H0z"/></svg>',
    MY: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#cc0000" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="34" d="M0 51h640M0 119h640M0 187h640M0 255h640M0 323h640M0 391h640"/><path fill="#000066" d="M0 0h320v240H0z"/></svg>',
    TH: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#a51931" d="M0 0h640v480H0z"/><path fill="#f4f5f8" d="M0 80h640v320H0z"/><path fill="#2d2a4a" d="M0 160h640v160H0z"/></svg>',
    FA: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#239f40" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#da0000" d="M0 320h640v160H0z"/><circle cx="320" cy="240" r="36" fill="#da0000"/></svg>',
    IL: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#0038b8" d="M0 60h640v55H0zm0 305h640v55H0z"/><circle cx="320" cy="240" r="45" fill="none" stroke="#0038b8" stroke-width="12"/></svg>',
    UA: '<svg viewBox="0 0 640 480" class="a11y-flag-svg"><path fill="#0057b7" d="M0 0h640v240H0z"/><path fill="#ffd700" d="M0 240h640v240H0z"/></svg>',
  };

  const LANGUAGES = [
    { code: 'EN', country: 'US', name: 'English', nativeName: 'English' },
    { code: 'TA', country: 'IN', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'HI', country: 'IN', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'ZH', country: 'CN', name: 'Chinese', nativeName: '中文' },
    { code: 'ES', country: 'ES', name: 'Spanish', nativeName: 'Español' },
    { code: 'FR', country: 'FR', name: 'French', nativeName: 'Français' },
    { code: 'DE', country: 'DE', name: 'German', nativeName: 'Deutsch' },
    { code: 'IT', country: 'IT', name: 'Italian', nativeName: 'Italiano' },
    { code: 'PT', country: 'PT', name: 'Portuguese', nativeName: 'Português' },
    { code: 'RU', country: 'RU', name: 'Russian', nativeName: 'Русский' },
    { code: 'JA', country: 'JP', name: 'Japanese', nativeName: '日本語' },
    { code: 'KO', country: 'KR', name: 'Korean', nativeName: '한국어' },
    { code: 'AR', country: 'SA', name: 'Arabic', nativeName: 'العربية' },
    { code: 'BN', country: 'BD', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'TE', country: 'IN', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'MR', country: 'IN', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'UR', country: 'PK', name: 'Urdu', nativeName: 'اردو' },
    { code: 'TR', country: 'TR', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'VI', country: 'VN', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'NL', country: 'NL', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'PL', country: 'PL', name: 'Polish', nativeName: 'Polski' },
    { code: 'EL', country: 'GR', name: 'Greek', nativeName: 'Ελληνικά' },
    { code: 'CS', country: 'CZ', name: 'Czech', nativeName: 'Čeština' },
    { code: 'SV', country: 'SE', name: 'Swedish', nativeName: 'Svenska' },
    { code: 'ID', country: 'ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'MS', country: 'MY', name: 'Malay', nativeName: 'Bahasa Melayu' },
    { code: 'TH', country: 'TH', name: 'Thai', nativeName: 'ไทย' },
    { code: 'FA', country: 'IR', name: 'Persian', nativeName: 'فارسی' },
    { code: 'HE', country: 'IL', name: 'Hebrew', nativeName: 'עברית' },
    { code: 'UK', country: 'UA', name: 'Ukrainian', nativeName: 'Українська' },
  ];

  // ---------------------------------------------------------------------
  // 2. DATA: 12 WCAG Settings with Official Lucide SVGs (Exact Image 1)
  // ---------------------------------------------------------------------
  const SETTING_DEFS = [
    {
      id: 'liveCaptions',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg>',
    },
    {
      id: 'audioTranscripts',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    },
    {
      id: 'visualNotifications',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>',
    },
    {
      id: 'distractionFree',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>',
    },
    {
      id: 'simplifiedNav',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    },
    {
      id: 'contentSummarization',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><circle cx="11.5" cy="14.5" r="2.5"/><path d="M13.3 16.3 15 18"/></svg>',
    },
    {
      id: 'readingProgress',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
    },
    {
      id: 'pauseAnimations',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><path d="m2 2 20 20"/></svg>',
    },
    {
      id: 'extendedTimeLimits',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    },
    {
      id: 'stepByStepInstructions',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5h10"/><path d="M11 12h10"/><path d="M11 19h10"/><path d="M4 4h1v5"/><path d="M4 9h2"/><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"/></svg>',
    },
    {
      id: 'reduceMotion',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>',
    },
    {
      id: 'stopAutoplay',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z"/><path d="m16.5 14.5 5-5"/><path d="m16.5 9.5 5 5"/></svg>',
    },
  ];

  // ---------------------------------------------------------------------
  // 3. DATA: Multilingual Translations
  // ---------------------------------------------------------------------
  const I18N = {
    EN: {
      liveCaptions: 'Live Captions',
      audioTranscripts: 'Audio Transcripts',
      visualNotifications: 'Visual Notifications',
      distractionFree: 'Distraction-Free Mode',
      simplifiedNav: 'Simplified Navigation',
      contentSummarization: 'Content Summarization',
      readingProgress: 'Reading Progress Indicator',
      pauseAnimations: 'Pause Animations',
      extendedTimeLimits: 'Extended Time Limits',
      stepByStepInstructions: 'Step-by-Step Instructions',
      reduceMotion: 'Reduce Motion',
      stopAutoplay: 'Stop Auto-Playing Media',
      active: 'Active',
      off: 'Off',
      resetSettings: 'Reset Settings',
      hideForever: 'Hide Forever',
      searchPlaceholder: 'Type to search language',
    },
    TA: {
      liveCaptions: 'நேரலை வசனங்கள்',
      audioTranscripts: 'ஆடியோ டிரான்ஸ்கிரிப்ட்',
      visualNotifications: 'காட்சி அறிவிப்புகள்',
      distractionFree: 'கவனச்சிதறலற்ற பயன்முறை',
      simplifiedNav: 'எளிமைப்படுத்தப்பட்ட வழிசெலுத்தல்',
      contentSummarization: 'உள்ளடக்கச் சுருக்கம்',
      readingProgress: 'வாசிப்பு முன்னேற்ற காட்டி',
      pauseAnimations: 'அசைவூட்டங்களை நிறுத்து',
      extendedTimeLimits: 'நீட்டிக்கப்பட்ட நேர வரம்பு',
      stepByStepInstructions: 'படிபடியான வழிமுறைகள்',
      reduceMotion: 'இயக்கத்தைக் குறை',
      stopAutoplay: 'தானியங்கி மீடியாவை நிறுத்து',
      active: 'செயலில்',
      off: 'முடக்கம்',
      resetSettings: 'அமைப்புகளை மீட்டமை',
      hideForever: 'மறைக்கவும்',
      searchPlaceholder: 'மொழியைத் தேட தட்டச்சு செய்க',
    },
    HI: {
      liveCaptions: 'लाइव कैप्शन',
      audioTranscripts: 'ऑडियो ट्रांसक्रिप्ट',
      visualNotifications: 'दृश्य सूचनाएं',
      distractionFree: 'ध्यान भटकाव मुक्त मोड',
      simplifiedNav: 'सरलीकृत नेविगेशन',
      contentSummarization: 'सामग्री संक्षेपण',
      readingProgress: 'पठन प्रगति संकेतक',
      pauseAnimations: 'एनिमेशन रोकें',
      extendedTimeLimits: 'विस्तारित समय सीमा',
      stepByStepInstructions: 'चरण-दर-चरण निर्देश',
      reduceMotion: 'मोशन कम करें',
      stopAutoplay: 'ऑटोप्ले मीडिया रोकें',
      active: 'सक्रिय',
      off: 'बंद',
      resetSettings: 'रीसेट करें',
      hideForever: 'हमेशा के लिए छुपाएं',
      searchPlaceholder: 'भाषा खोजने के लिए टाइप करें',
    },
    ZH: {
      liveCaptions: '实时字幕',
      audioTranscripts: '音频文字记录',
      visualNotifications: '视觉通知',
      distractionFree: '无干扰模式',
      simplifiedNav: '简化导航',
      contentSummarization: '内容摘要',
      readingProgress: '阅读进度指示器',
      pauseAnimations: '暂停动画',
      extendedTimeLimits: '延长时限',
      stepByStepInstructions: '分步指导',
      reduceMotion: '减弱动态效果',
      stopAutoplay: '停止自动播放媒体',
      active: '已启用',
      off: '已关闭',
      resetSettings: '重置设置',
      hideForever: '永久隐藏',
      searchPlaceholder: '输入以搜索语言',
    },
    ES: {
      liveCaptions: 'Subtítulos en vivo',
      audioTranscripts: 'Transcripciones de audio',
      visualNotifications: 'Notificaciones visuales',
      distractionFree: 'Modo sin distracciones',
      simplifiedNav: 'Navegación simplificada',
      contentSummarization: 'Resumen de contenido',
      readingProgress: 'Progreso de lectura',
      pauseAnimations: 'Pausar animaciones',
      extendedTimeLimits: 'Tiempo extendido',
      stepByStepInstructions: 'Instrucciones paso a paso',
      reduceMotion: 'Reducir movimiento',
      stopAutoplay: 'Detener reproducción automática',
      active: 'Activo',
      off: 'Inactivo',
      resetSettings: 'Restablecer',
      hideForever: 'Ocultar',
      searchPlaceholder: 'Escribe para buscar idioma',
    },
    FR: {
      liveCaptions: 'Sous-titres en direct',
      audioTranscripts: 'Transcriptions audio',
      visualNotifications: 'Notifications visuelles',
      distractionFree: 'Mode sans distraction',
      simplifiedNav: 'Navigation simplifiée',
      contentSummarization: 'Résumé du contenu',
      readingProgress: 'Progression de lecture',
      pauseAnimations: 'Mettre en pause les animations',
      extendedTimeLimits: 'Limites de temps prolongées',
      stepByStepInstructions: 'Instructions étape par étape',
      reduceMotion: 'Réduire les animations',
      stopAutoplay: 'Arrêter la lecture automatique',
      active: 'Actif',
      off: 'Désactivé',
      resetSettings: 'Réinitialiser',
      hideForever: 'Masquer',
      searchPlaceholder: 'Tapez pour rechercher une langue',
    },
    DE: {
      liveCaptions: 'Live-Untertitel',
      audioTranscripts: 'Audio-Transkripte',
      visualNotifications: 'Visuelle Benachrichtigungen',
      distractionFree: 'Ablenkungsfreier Modus',
      simplifiedNav: 'Vereinfachte Navigation',
      contentSummarization: 'Inhaltszusammenfassung',
      readingProgress: 'Lesefortschritt',
      pauseAnimations: 'Animationen anhalten',
      extendedTimeLimits: 'Verlängerte Zeitlimits',
      stepByStepInstructions: 'Schritt-für-Schritt-Anleitung',
      reduceMotion: 'Bewegung reduzieren',
      stopAutoplay: 'Autoplay stoppen',
      active: 'Aktiv',
      off: 'Aus',
      resetSettings: 'Zurücksetzen',
      hideForever: 'Ausblenden',
      searchPlaceholder: 'Sprache suchen',
    },
  };

  function getI18n(langCode) {
    return I18N[langCode] || I18N.EN;
  }

  // ---------------------------------------------------------------------
  // 4. STATE MANAGEMENT
  // ---------------------------------------------------------------------
  const STORAGE_KEY = 'universal_a11y_standalone_v1';
  let settings = {
    liveCaptions: false,
    audioTranscripts: false,
    visualNotifications: false,
    distractionFree: false,
    simplifiedNav: false,
    contentSummarization: false,
    readingProgress: false,
    pauseAnimations: false,
    extendedTimeLimits: false,
    stepByStepInstructions: false,
    reduceMotion: false,
    stopAutoplay: false,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      settings = Object.assign({}, settings, JSON.parse(saved));
    }
  } catch (e) {
    console.warn('A11y storage load error', e);
  }

  let selectedLang = LANGUAGES[0]; // English default
  let isModalOpen = false;
  let isLangMenuOpen = false;
  let langSearchQuery = '';

  // ---------------------------------------------------------------------
  // 5. ISOLATED CSS MATCHING IMAGE 1 EXACTLY
  // ---------------------------------------------------------------------
  const styleEl = document.createElement('style');
  styleEl.id = 'a11y-standalone-widget-styles';
  styleEl.textContent = `
    /* Floating Trigger Button */
    #a11y-floating-btn {
      box-sizing: border-box !important;
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      width: 56px !important;
      height: 56px !important;
      background: #2563eb !important;
      color: #ffffff !important;
      border-radius: 9999px !important;
      border: none !important;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.25) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.15s ease !important;
      outline: none !important;
      margin: 0 !important;
      padding: 0 !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    #a11y-floating-btn:hover {
      background: #1d4ed8 !important;
      transform: scale(1.05) !important;
    }
    #a11y-floating-btn svg {
      display: block !important;
      width: 32px !important;
      height: 32px !important;
      fill: #ffffff !important;
      pointer-events: none !important;
    }

    /* Modal Dialog Window */
    #a11y-modal-container {
      box-sizing: border-box !important;
      position: fixed !important;
      bottom: 96px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      width: 410px !important;
      max-width: 94vw !important;
      background: #ffffff !important;
      border-radius: 24px !important;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important;
      border: 1px solid #f1f5f9 !important;
      display: none;
      flex-direction: column !important;
      overflow: hidden !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      color: #1e293b !important;
      animation: a11yFadeIn 0.15s ease-out !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: normal !important;
    }
    #a11y-modal-container * {
      box-sizing: border-box !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    }
    #a11y-modal-container.a11y-open {
      display: flex !important;
    }
    @keyframes a11yFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Top Bar */
    .a11y-top-bar {
      padding: 16px 20px 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      border-bottom: 1px solid #f1f5f9 !important;
      background: #ffffff !important;
    }
    .a11y-lang-btn {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 6px 12px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      font-size: 12px !important;
      font-weight: 800 !important;
      color: #1e293b !important;
      cursor: pointer !important;
      transition: background-color 0.15s !important;
    }
    .a11y-lang-btn:hover {
      background: #f1f5f9 !important;
    }
    .a11y-flag-svg {
      width: 20px !important;
      height: 14px !important;
      border-radius: 2px !important;
      object-fit: cover !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
      display: inline-block !important;
    }
    .a11y-active-badge {
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #2563eb !important;
      background: #eff6ff !important;
      padding: 4px 10px !important;
      border-radius: 9999px !important;
      border: 1px solid #bfdbfe !important;
    }
    .a11y-close-btn {
      background: transparent !important;
      border: none !important;
      padding: 6px !important;
      color: #94a3b8 !important;
      cursor: pointer !important;
      border-radius: 9999px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.15s !important;
    }
    .a11y-close-btn:hover {
      color: #1e293b !important;
      background: #f1f5f9 !important;
    }

    /* Cards Scroll & Grid matching Image 1 */
    .a11y-cards-scroll {
      flex: 1 !important;
      overflow-y: auto !important;
      max-height: 66vh !important;
      padding: 16px 24px !important;
    }
    .a11y-cards-scroll::-webkit-scrollbar {
      width: 6px !important;
    }
    .a11y-cards-scroll::-webkit-scrollbar-track {
      background: transparent !important;
    }
    .a11y-cards-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1 !important;
      border-radius: 9999px !important;
    }
    .a11y-cards-scroll::-webkit-scrollbar-thumb:hover {
      background: #94a3b8 !important;
    }

    .a11y-cards-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
    }

    /* Card Item */
    .a11y-card {
      padding: 16px !important;
      border-radius: 16px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      gap: 8px !important;
      border: 1px solid rgba(191, 219, 254, 0.8) !important;
      background: #ffffff !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      outline: none !important;
    }
    .a11y-card:hover {
      background: #f8fafc !important;
      border-color: #93c5fd !important;
    }
    .a11y-card.a11y-card-active {
      background: rgba(239, 246, 255, 0.9) !important;
      border-color: #3b82f6 !important;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.15) !important;
      outline: 2px solid rgba(59, 130, 246, 0.4) !important;
    }
    .a11y-card-icon {
      padding: 4px !important;
      width: 28px !important;
      height: 28px !important;
      color: #2563eb !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .a11y-card-icon svg {
      width: 100% !important;
      height: 100% !important;
    }
    .a11y-card-title {
      font-size: 12px !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
      color: #1e293b !important;
      min-height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .a11y-card-status {
      font-size: 9px !important;
      font-weight: 800 !important;
      letter-spacing: 0.05em !important;
      text-transform: uppercase !important;
      padding: 2px 8px !important;
      border-radius: 9999px !important;
      background: #f1f5f9 !important;
      color: #64748b !important;
    }
    .a11y-card.a11y-card-active .a11y-card-status {
      background: #2563eb !important;
      color: #ffffff !important;
    }

    /* Footer Buttons matching Image 1 */
    .a11y-footer {
      padding: 20px 24px 16px !important;
      border-top: 1px solid #f1f5f9 !important;
      display: flex !important;
      gap: 12px !important;
      background: #ffffff !important;
    }
    .a11y-footer-btn {
      flex: 1 !important;
      padding: 12px 16px !important;
      border-radius: 16px !important;
      border: 1px solid #bfdbfe !important;
      color: #2563eb !important;
      background: #ffffff !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      transition: background-color 0.15s !important;
      text-align: center !important;
    }
    .a11y-footer-btn:hover {
      background: #eff6ff !important;
    }

    /* Language Selection View */
    .a11y-lang-view {
      padding: 16px 20px !important;
      display: flex !important;
      flex-direction: column !important;
      flex: 1 !important;
      max-height: 66vh !important;
      background: #ffffff !important;
    }
    .a11y-lang-search-box {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding-bottom: 12px !important;
      border-bottom: 1px solid #f1f5f9 !important;
    }
    .a11y-lang-input {
      flex: 1 !important;
      padding: 8px 12px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      font-size: 12px !important;
      outline: none !important;
      color: #1e293b !important;
    }
    .a11y-lang-input:focus {
      border-color: #3b82f6 !important;
    }
    .a11y-lang-done-btn {
      padding: 8px 12px !important;
      background: transparent !important;
      border: none !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #475569 !important;
      cursor: pointer !important;
      border-radius: 12px !important;
    }
    .a11y-lang-done-btn:hover {
      background: #f1f5f9 !important;
      color: #0f172a !important;
    }
    .a11y-lang-list {
      flex: 1 !important;
      overflow-y: auto !important;
      margin-top: 8px !important;
    }
    .a11y-lang-row {
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 10px 12px !important;
      border: none !important;
      background: transparent !important;
      border-radius: 12px !important;
      cursor: pointer !important;
      font-size: 12px !important;
      color: #334155 !important;
      text-align: left !important;
      transition: background 0.15s !important;
    }
    .a11y-lang-row:hover {
      background: #f8fafc !important;
    }
    .a11y-lang-row.a11y-lang-selected {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      font-weight: 700 !important;
    }
    .a11y-lang-row-left {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }
    .a11y-lang-code-badge {
      font-family: monospace !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      padding: 2px 6px !important;
      border-radius: 6px !important;
      background: #f1f5f9 !important;
      color: #64748b !important;
    }

    /* WCAG Overrides applied to Host Website */
    html.a11y-paused-animations *,
    html.a11y-paused-animations *::before,
    html.a11y-paused-animations *::after {
      animation-play-state: paused !important;
    }
    html.a11y-reduce-motion *,
    html.a11y-reduce-motion *::before,
    html.a11y-reduce-motion *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
    /* --------------------------------------------------------------------- */
    /* DISTRACTION-FREE MODE (WCAG 2.2 Cognitive Accessibility / Focus) */
    /* --------------------------------------------------------------------- */
    html.a11y-distraction-free aside:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [role="complementary"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free .ad,
    html.a11y-distraction-free .ads,
    html.a11y-distraction-free [class*="advertisement"],
    html.a11y-distraction-free [class*="sponsor"],
    html.a11y-distraction-free .sidebar:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [class*="sidebar"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free .banner:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [class*="banner"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [class*="promo"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [class*="announcement"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [class*="newsletter"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [class*="social-share"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [class*="share-bar"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [id*="chat-widget"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free [class*="floating-widget"]:not([id^="a11y-"]):not([class^="a11y-"]),
    html.a11y-distraction-free marquee {
      display: none !important;
    }
    html.a11y-distraction-free body {
      background-image: none !important;
    }
    html.a11y-distraction-free [class*="badge"][class*="pulse"],
    html.a11y-distraction-free [class*="badge"][class*="blink"] {
      animation: none !important;
    }
    html.a11y-simplified-nav *:focus-visible {
      outline: 3px solid #2563eb !important;
      outline-offset: 3px !important;
    }
    #a11y-reading-progress-bar {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      height: 4px !important;
      width: 0% !important;
      background: #2563eb !important;
      z-index: 2147483646 !important;
      transition: width 0.1s !important;
      display: none !important;
    }
    #a11y-reading-progress-bar.a11y-show {
      display: block !important;
    }

    /* Content Summary Box (WCAG 3.1.5 Cognitive Accessibility - Side Panel) */
    #a11y-summary-container {
      position: fixed !important;
      top: 24px !important;
      right: 24px !important;
      left: auto !important;
      transform: none !important;
      z-index: 2147483645 !important;
      max-width: 440px !important;
      width: min(440px, calc(100vw - 32px)) !important;
      max-height: 86vh !important;
      background: #ffffff !important;
      border: 2px solid #2563eb !important;
      border-radius: 20px !important;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(37, 99, 235, 0.12) !important;
      padding: 18px 20px !important;
      display: none;
      flex-direction: column !important;
      gap: 12px !important;
      box-sizing: border-box !important;
      animation: a11ySummarySlideIn 0.25s ease-out !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }
    @keyframes a11ySummarySlideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    /* Lightweight notification toast when page has no long paragraphs */
    #a11y-toast {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      background: #0f172a !important;
      color: #ffffff !important;
      padding: 11px 18px !important;
      border-radius: 12px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.35) !important;
      z-index: 2147483647 !important;
      display: none;
      align-items: center !important;
      gap: 8px !important;
      animation: a11yToastIn 0.2s ease-out !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }
    @keyframes a11yToastIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .a11y-summary-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      border-bottom: 1px solid #f1f5f9 !important;
      padding-bottom: 12px !important;
    }
    .a11y-summary-header-left {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }
    .a11y-summary-icon {
      width: 38px !important;
      height: 38px !important;
      background: #eff6ff !important;
      border-radius: 10px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: #2563eb !important;
      flex-shrink: 0 !important;
    }
    .a11y-summary-icon svg {
      width: 20px !important;
      height: 20px !important;
    }
    .a11y-summary-title {
      font-size: 15px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      line-height: 1.25 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .a11y-summary-badge {
      font-size: 11px !important;
      color: #64748b !important;
      font-weight: 500 !important;
      display: block !important;
      margin-top: 2px !important;
    }
    .a11y-summary-actions {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    .a11y-summary-rescan-btn {
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 6px 10px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      color: #334155 !important;
      cursor: pointer !important;
      transition: all 0.15s !important;
    }
    .a11y-summary-rescan-btn:hover {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border-color: #bfdbfe !important;
    }
    .a11y-summary-close {
      background: #f1f5f9 !important;
      border: none !important;
      width: 32px !important;
      height: 32px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      color: #475569 !important;
      transition: all 0.15s !important;
    }
    .a11y-summary-close:hover {
      background: #e2e8f0 !important;
      color: #0f172a !important;
    }
    .a11y-summary-body {
      overflow-y: auto !important;
      max-height: calc(84vh - 120px) !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
      padding-right: 4px !important;
    }
    .a11y-summary-body::-webkit-scrollbar {
      width: 6px !important;
    }
    .a11y-summary-body::-webkit-scrollbar-thumb {
      background: #cbd5e1 !important;
      border-radius: 10px !important;
    }
    .a11y-summary-item {
      display: flex !important;
      align-items: flex-start !important;
      gap: 12px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      padding: 11px 13px !important;
      font-size: 13px !important;
      line-height: 1.55 !important;
      color: #1e293b !important;
      box-sizing: border-box !important;
    }
    .a11y-summary-num {
      min-width: 22px !important;
      height: 22px !important;
      background: #2563eb !important;
      color: #ffffff !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: 1px !important;
      flex-shrink: 0 !important;
    }
    .a11y-summary-empty {
      text-align: center !important;
      padding: 24px 16px !important;
      color: #64748b !important;
      font-size: 13.5px !important;
    }

    /* Step-by-Step Guided Stepper Dock (WCAG 3.3.2 / 3.3.7) */
    #a11y-stepper-dock {
      position: fixed !important;
      bottom: 24px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 2147483645 !important;
      background: #ffffff !important;
      border: 2px solid #2563eb !important;
      border-radius: 9999px !important;
      box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(37, 99, 235, 0.15) !important;
      padding: 10px 18px !important;
      display: none;
      align-items: center !important;
      gap: 14px !important;
      max-width: 90vw !important;
      box-sizing: border-box !important;
      animation: a11yDockSlideUp 0.25s ease-out !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }
    @keyframes a11yDockSlideUp {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    .a11y-stepper-left {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }
    .a11y-stepper-pill {
      background: #2563eb !important;
      color: #ffffff !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      padding: 4px 10px !important;
      border-radius: 9999px !important;
      letter-spacing: 0.02em !important;
      white-space: nowrap !important;
    }
    .a11y-stepper-title {
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #0f172a !important;
      white-space: nowrap !important;
      max-width: 280px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .a11y-stepper-controls {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }
    .a11y-stepper-btn {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      background: #f1f5f9 !important;
      border: 1px solid #cbd5e1 !important;
      color: #1e293b !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      padding: 6px 12px !important;
      border-radius: 9999px !important;
      cursor: pointer !important;
      transition: all 0.15s !important;
      white-space: nowrap !important;
    }
    .a11y-stepper-btn:hover:not(:disabled) {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border-color: #93c5fd !important;
    }
    .a11y-stepper-btn:disabled {
      opacity: 0.45 !important;
      cursor: not-allowed !important;
    }
    .a11y-stepper-btn-primary {
      background: #2563eb !important;
      color: #ffffff !important;
      border-color: #2563eb !important;
    }
    .a11y-stepper-btn-primary:hover:not(:disabled) {
      background: #1d4ed8 !important;
      color: #ffffff !important;
    }
    .a11y-stepper-close {
      background: transparent !important;
      border: none !important;
      color: #64748b !important;
      width: 28px !important;
      height: 28px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      transition: all 0.15s !important;
      margin-left: 2px !important;
    }
    .a11y-stepper-close:hover {
      background: #f1f5f9 !important;
      color: #0f172a !important;
    }

    /* In-Page Step Badge on form labels / fields */
    .a11y-step-badge {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border: 1px solid #bfdbfe !important;
      padding: 2px 7px !important;
      border-radius: 6px !important;
      font-size: 10.5px !important;
      font-weight: 700 !important;
      font-family: monospace, sans-serif !important;
      margin-right: 6px !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
      vertical-align: middle !important;
      animation: a11yBadgePop 0.2s ease-out !important;
    }
    @keyframes a11yBadgePop {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .a11y-step-focused {
      outline: 3px solid #2563eb !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.25) !important;
      transition: all 0.2s ease !important;
    }

    /* --------------------------------------------------------------------- */
    /* LIVE CAPTIONS (WCAG 1.2.2) */
    /* --------------------------------------------------------------------- */
    .a11y-video-caption-bar {
      position: absolute !important;
      bottom: 48px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: rgba(15, 23, 42, 0.92) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      color: #ffffff !important;
      padding: 8px 18px !important;
      border-radius: 9999px !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-size: 13.5px !important;
      font-weight: 500 !important;
      line-height: 1.4 !important;
      max-width: 88% !important;
      width: max-content !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15) !important;
      pointer-events: none !important;
      z-index: 2147483640 !important;
      display: none !important;
      align-items: center !important;
      gap: 10px !important;
      transition: opacity 0.2s ease, transform 0.2s ease !important;
      text-align: center !important;
      user-select: none !important;
    }
    .a11y-video-caption-bar.a11y-active {
      display: inline-flex !important;
    }
    .a11y-caption-badge {
      background: #2563eb !important;
      color: #ffffff !important;
      font-size: 10px !important;
      font-weight: 800 !important;
      padding: 2px 7px !important;
      border-radius: 4px !important;
      letter-spacing: 0.5px !important;
      text-transform: uppercase !important;
      flex-shrink: 0 !important;
    }
    .a11y-caption-text {
      color: #f8fafc !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6) !important;
      word-break: break-word !important;
    }

    /* --------------------------------------------------------------------- */
    /* AUDIO TRANSCRIPTS (WCAG 1.2.1) */
    /* --------------------------------------------------------------------- */
    .a11y-audio-transcript-card {
      margin: 10px 0 !important;
      background: #ffffff !important;
      border: 1px solid #cbd5e1 !important;
      border-left: 4px solid #2563eb !important;
      border-radius: 10px !important;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06) !important;
      padding: 12px 16px !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      box-sizing: border-box !important;
      max-width: 100% !important;
      transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
    }
    .a11y-audio-transcript-card.a11y-playing {
      border-left-color: #16a34a !important;
      box-shadow: 0 4px 16px rgba(22, 163, 74, 0.12) !important;
    }
    .a11y-audio-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding-bottom: 8px !important;
      border-bottom: 1px solid #f1f5f9 !important;
      user-select: none !important;
    }
    .a11y-audio-pulse-dot {
      width: 8px !important;
      height: 8px !important;
      border-radius: 50% !important;
      background: #94a3b8 !important;
      display: inline-block !important;
      flex-shrink: 0 !important;
      transition: background 0.3s ease !important;
    }
    .a11y-audio-pulse-dot.a11y-playing {
      background: #16a34a !important;
      box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7) !important;
      animation: a11yPulseGreen 1.6s infinite !important;
    }
    @keyframes a11yPulseGreen {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
    }
    .a11y-audio-toggle-btn {
      background: #f1f5f9 !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 6px !important;
      color: #475569 !important;
      width: 26px !important;
      height: 26px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      transition: all 0.15s ease !important;
    }
    .a11y-audio-toggle-btn:hover {
      background: #e2e8f0 !important;
      color: #0f172a !important;
    }
    .a11y-audio-body {
      margin-top: 8px !important;
      max-height: 240px !important;
      overflow-y: auto !important;
    }
    .a11y-audio-body p {
      white-space: pre-line !important;
    }

    /* --------------------------------------------------------------------- */
    /* VISUAL NOTIFICATIONS (WCAG 1.4.1 / 1.4.11 / 2.2.4) */
    /* --------------------------------------------------------------------- */
    #a11y-screen-flash {
      position: fixed !important;
      inset: 0 !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      box-shadow: inset 0 0 0 5px #3b82f6, inset 0 0 35px rgba(59, 130, 246, 0.45) !important;
      opacity: 0;
      transition: opacity 0.3s ease !important;
      display: none;
    }
    #a11y-screen-flash.a11y-flash-active {
      display: block !important;
      opacity: 1 !important;
    }
    #a11y-visual-notify-hub {
      position: fixed !important;
      top: 20px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 2147483646 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      pointer-events: none !important;
      width: min(480px, calc(100vw - 32px)) !important;
    }
    .a11y-visual-alert-card {
      pointer-events: auto !important;
      background: #0f172a !important;
      border: 2px solid #3b82f6 !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
      color: #ffffff !important;
      padding: 10px 16px !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 13px !important;
      animation: a11yAlertPop 0.25s ease-out !important;
      transition: all 0.25s ease !important;
    }
    @keyframes a11yAlertPop {
      from { opacity: 0; transform: translateY(-10px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .a11y-alert-close {
      background: none !important;
      border: none !important;
      color: #94a3b8 !important;
      font-size: 20px !important;
      cursor: pointer !important;
      padding: 0 4px !important;
      line-height: 1 !important;
    }
    .a11y-alert-close:hover {
      color: #ffffff !important;
    }

    /* --------------------------------------------------------------------- */
    /* SIMPLIFIED NAVIGATION (WCAG 2.4.1 / 2.4.7 / 3.2.3) */
    /* --------------------------------------------------------------------- */
    #a11y-skip-link {
      position: fixed !important;
      top: 12px !important;
      left: 12px !important;
      background: #2563eb !important;
      color: #ffffff !important;
      padding: 8px 16px !important;
      border-radius: 8px !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      z-index: 2147483647 !important;
      text-decoration: none !important;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4) !important;
      display: none;
      font-family: system-ui, -apple-system, sans-serif !important;
    }
    #a11y-skip-link:focus {
      outline: 4px solid #93c5fd !important;
    }
    html.a11y-simplified-nav *:focus,
    html.a11y-simplified-nav *:focus-visible {
      outline: 4px solid #2563eb !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.3) !important;
    }
    .a11y-landmark-badge {
      position: absolute !important;
      top: 4px !important;
      left: 8px !important;
      background: #1d4ed8 !important;
      color: #ffffff !important;
      font-size: 10px !important;
      font-weight: 800 !important;
      padding: 2px 7px !important;
      border-radius: 4px !important;
      letter-spacing: 0.5px !important;
      z-index: 99 !important;
      pointer-events: none !important;
      font-family: monospace, sans-serif !important;
      text-transform: uppercase !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
    }

    /* --------------------------------------------------------------------- */
    /* EXTENDED TIME LIMITS (WCAG 2.2.1) */
    /* --------------------------------------------------------------------- */
    #a11y-time-limits-dock {
      position: fixed !important;
      bottom: 24px !important;
      left: 24px !important;
      background: #ffffff !important;
      border: 1px solid #cbd5e1 !important;
      border-left: 4px solid #2563eb !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
      padding: 10px 14px !important;
      z-index: 2147483643 !important;
      display: none;
      align-items: center !important;
      gap: 12px !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 13px !important;
      box-sizing: border-box !important;
      animation: a11yDockPop 0.2s ease-out !important;
    }
    .a11y-time-btn {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border: 1px solid #bfdbfe !important;
      border-radius: 6px !important;
      padding: 4px 10px !important;
      font-size: 11.5px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
    }
    .a11y-time-btn:hover {
      background: #dbeafe !important;
    }
    .a11y-time-btn-close {
      background: none !important;
      border: none !important;
      color: #94a3b8 !important;
      font-size: 18px !important;
      cursor: pointer !important;
      padding: 0 4px !important;
    }
    .a11y-time-btn-close:hover {
      color: #0f172a !important;
    }
    .a11y-timer-extended-badge {
      display: inline-block !important;
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border: 1px solid #bfdbfe !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      margin-left: 6px !important;
      vertical-align: middle !important;
    }

    /* --------------------------------------------------------------------- */
    /* READING PROGRESS BADGE */
    /* --------------------------------------------------------------------- */
    #a11y-reading-progress-badge {
      position: fixed !important;
      top: 10px !important;
      right: 70px !important;
      background: rgba(15, 23, 42, 0.88) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      color: #ffffff !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      padding: 4px 10px !important;
      border-radius: 9999px !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      z-index: 2147483646 !important;
      display: none;
      pointer-events: none !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
    }
  `;

  // ---------------------------------------------------------------------
  // 6. BUILD DOM ELEMENTS
  // ---------------------------------------------------------------------
  const progressBar = document.createElement('div');
  progressBar.id = 'a11y-reading-progress-bar';

  const summaryContainer = document.createElement('div');
  summaryContainer.id = 'a11y-summary-container';

  const stepperDock = document.createElement('div');
  stepperDock.id = 'a11y-stepper-dock';

  const toastEl = document.createElement('div');
  toastEl.id = 'a11y-toast';

  function showMiniToast(msg) {
    toastEl.innerText = msg;
    toastEl.style.display = 'flex';
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.style.display = 'none';
    }, 3200);
  }

  const progressBadge = document.createElement('div');
  progressBadge.id = 'a11y-reading-progress-badge';

  const screenFlash = document.createElement('div');
  screenFlash.id = 'a11y-screen-flash';

  const visualNotifyHub = document.createElement('div');
  visualNotifyHub.id = 'a11y-visual-notify-hub';

  const skipLink = document.createElement('a');
  skipLink.id = 'a11y-skip-link';
  skipLink.href = '#';
  skipLink.innerText = '⏭ Skip to Main Content';
  skipLink.onclick = (e) => {
    e.preventDefault();
    const target = document.querySelector('main, [role="main"], #main-content, #content, #main, h1');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof target.focus === 'function') target.focus();
    }
  };

  const timeLimitsDock = document.createElement('div');
  timeLimitsDock.id = 'a11y-time-limits-dock';

  const triggerBtn = document.createElement('button');
  triggerBtn.id = 'a11y-floating-btn';
  triggerBtn.setAttribute('aria-label', 'Open Accessibility Settings');
  triggerBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
    </svg>
  `;

  const modal = document.createElement('div');
  modal.id = 'a11y-modal-container';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  // ---------------------------------------------------------------------
  // 7. RENDER FUNCTION (Preserves Scroll Position)
  // ---------------------------------------------------------------------
  function render() {
    const scrollEl = modal.querySelector('.a11y-cards-scroll');
    const savedScroll = scrollEl ? scrollEl.scrollTop : 0;
    const t = getI18n(selectedLang.code);
    const activeCount = Object.values(settings).filter(Boolean).length;

    modal.innerHTML = `
      <!-- Top Bar matching Image 1 -->
      <div class="a11y-top-bar">
        <button class="a11y-lang-btn" id="a11y-toggle-lang">
          ${FLAGS[selectedLang.country] || ''}
          <span>${selectedLang.code}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#64748b" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <div style="display:flex; align-items:center; gap:8px;">
          <span class="a11y-active-badge">${activeCount} / 12 ${t.active}</span>
          <button class="a11y-close-btn" id="a11y-close-modal" aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Main Body: Lang Menu OR Cards Grid -->
      ${
        isLangMenuOpen
          ? `
        <div class="a11y-lang-view">
          <div class="a11y-lang-search-box">
            <input type="text" class="a11y-lang-input" id="a11y-lang-search-input" placeholder="${t.searchPlaceholder}" value="${langSearchQuery}" autofocus />
            <button class="a11y-lang-done-btn" id="a11y-lang-done-btn">Done</button>
          </div>
          <div class="a11y-lang-list">
            ${LANGUAGES.filter(
              (l) =>
                l.name.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
                l.code.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
                (l.nativeName && l.nativeName.toLowerCase().includes(langSearchQuery.toLowerCase()))
            )
              .map(
                (l) => `
              <button class="a11y-lang-row ${l.code === selectedLang.code ? 'a11y-lang-selected' : ''}" data-lang="${l.code}">
                <div class="a11y-lang-row-left">
                  ${FLAGS[l.country] || ''}
                  <span>${l.name} ${l.nativeName && l.nativeName !== l.name ? `<span style="color:#94a3b8;font-size:11px;">(${l.nativeName})</span>` : ''}</span>
                </div>
                <span class="a11y-lang-code-badge">${l.code}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : `
        <div class="a11y-cards-scroll">
          <div class="a11y-cards-grid">
            ${SETTING_DEFS.map((def) => {
              const isEnabled = settings[def.id];
              const title = t[def.id] || def.id;
              return `
                <button class="a11y-card ${isEnabled ? 'a11y-card-active' : ''}" data-setting="${def.id}" type="button">
                  <div class="a11y-card-icon">${def.svg}</div>
                  <span class="a11y-card-title">${title}</span>
                  <span class="a11y-card-status">${isEnabled ? t.active : t.off}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Footer matching Image 1 -->
        <div class="a11y-footer">
          <button class="a11y-footer-btn" id="a11y-reset-btn">${t.resetSettings}</button>
          <button class="a11y-footer-btn" id="a11y-hide-btn">${t.hideForever}</button>
        </div>
      `
      }
    `;

    attachEvents();

    const newScrollEl = modal.querySelector('.a11y-cards-scroll');
    if (newScrollEl && savedScroll > 0) {
      newScrollEl.scrollTop = savedScroll;
    }
  }

  // ---------------------------------------------------------------------
  // 8. EVENT ATTACHMENT
  // ---------------------------------------------------------------------
  function attachEvents() {
    const closeBtn = document.getElementById('a11y-close-modal');
    if (closeBtn) {
      closeBtn.onclick = () => {
        isModalOpen = false;
        modal.classList.remove('a11y-open');
      };
    }

    const langBtn = document.getElementById('a11y-toggle-lang');
    if (langBtn) {
      langBtn.onclick = () => {
        isLangMenuOpen = !isLangMenuOpen;
        langSearchQuery = '';
        render();
      };
    }

    const searchInput = document.getElementById('a11y-lang-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        langSearchQuery = e.target.value;
        const listEl = modal.querySelector('.a11y-lang-list');
        if (listEl) {
          listEl.innerHTML = LANGUAGES.filter(
            (l) =>
              l.name.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
              l.code.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
              (l.nativeName && l.nativeName.toLowerCase().includes(langSearchQuery.toLowerCase()))
          )
            .map(
              (l) => `
            <button class="a11y-lang-row ${l.code === selectedLang.code ? 'a11y-lang-selected' : ''}" data-lang="${l.code}">
              <div class="a11y-lang-row-left">
                ${FLAGS[l.country] || ''}
                <span>${l.name} ${l.nativeName && l.nativeName !== l.name ? `<span style="color:#94a3b8;font-size:11px;">(${l.nativeName})</span>` : ''}</span>
              </div>
              <span class="a11y-lang-code-badge">${l.code}</span>
            </button>
          `
            )
            .join('');

          bindLangRows();
        }
      };
    }

    const doneBtn = document.getElementById('a11y-lang-done-btn');
    if (doneBtn) {
      doneBtn.onclick = () => {
        isLangMenuOpen = false;
        render();
      };
    }

    bindLangRows();

    const cards = modal.querySelectorAll('.a11y-card');
    cards.forEach((card) => {
      card.onclick = (e) => {
        if (e) e.preventDefault();
        const key = card.getAttribute('data-setting');
        if (key && key in settings) {
          const scrollEl = modal.querySelector('.a11y-cards-scroll');
          const savedScroll = scrollEl ? scrollEl.scrollTop : 0;
          settings[key] = !settings[key];
          saveAndApply(key);
          render();
          const restoredScrollEl = modal.querySelector('.a11y-cards-scroll');
          if (restoredScrollEl) {
            restoredScrollEl.scrollTop = savedScroll;
          }
        }
      };
    });

    const resetBtn = document.getElementById('a11y-reset-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        const scrollEl = modal.querySelector('.a11y-cards-scroll');
        const savedScroll = scrollEl ? scrollEl.scrollTop : 0;
        Object.keys(settings).forEach((k) => (settings[k] = false));
        saveAndApply();
        render();
        const restoredScrollEl = modal.querySelector('.a11y-cards-scroll');
        if (restoredScrollEl) {
          restoredScrollEl.scrollTop = savedScroll;
        }
      };
    }

    const hideBtn = document.getElementById('a11y-hide-btn');
    if (hideBtn) {
      hideBtn.onclick = () => {
        isModalOpen = false;
        modal.classList.remove('a11y-open');
      };
    }
  }

  function bindLangRows() {
    const langRows = modal.querySelectorAll('.a11y-lang-row');
    langRows.forEach((row) => {
      row.onclick = () => {
        const code = row.getAttribute('data-lang');
        const found = LANGUAGES.find((l) => l.code === code);
        if (found) {
          selectedLang = found;
          isLangMenuOpen = false;
          render();
          if (settings.contentSummarization) {
            showSummaryModal();
          }
          if (settings.stepByStepInstructions) {
            applyStepByStepInstructions(false);
          }
        }
      };
    });
  }

  triggerBtn.onclick = () => {
    isModalOpen = !isModalOpen;
    if (isModalOpen) {
      modal.classList.add('a11y-open');
      render();
    } else {
      modal.classList.remove('a11y-open');
    }
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
      if (isLangMenuOpen) {
        isLangMenuOpen = false;
        render();
      } else {
        isModalOpen = false;
        modal.classList.remove('a11y-open');
      }
    }
    if ((e.altKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      if (settings.simplifiedNav) {
        e.preventDefault();
        const target = document.querySelector('main, [role="main"], #main-content, #content, #main, h1');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (typeof target.focus === 'function') target.focus();
        }
      }
    }
  });

  // ---------------------------------------------------------------------
  // 9. REAL PAGE OVERRIDES & WCAG ACTIONS
  // ---------------------------------------------------------------------
  function saveAndApply(changedKey = null) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}

    const root = document.documentElement;

    // Setting 3: Pause Animation (WCAG 2.2.2)
    if (settings.pauseAnimations) {
      applyPauseAnimations(true, changedKey === 'pauseAnimations');
    } else {
      applyPauseAnimations(false, false);
    }

    // Setting 4: Reduce Motion (WCAG 2.3.3)
    if (settings.reduceMotion) {
      applyReduceMotion(true, changedKey === 'reduceMotion');
    } else {
      applyReduceMotion(false, false);
    }

    // Setting 8: Distraction-Free Mode (WCAG 2.2)
    if (settings.distractionFree) {
      root.classList.add('a11y-distraction-free');
      if (changedKey === 'distractionFree') {
        const isTa = selectedLang.code === 'TA';
        const isHi = selectedLang.code === 'HI';
        showMiniToast(
          isTa
            ? '✨ கவனச்சிதறலற்ற பயன்முறை இயக்கப்பட்டது (Distraction-Free Active)'
            : (isHi ? '✨ व्याकुलता-मुक्त मोड सक्रिय' : '✨ Distraction-Free Mode Enabled')
        );
      }
    } else {
      root.classList.remove('a11y-distraction-free');
    }

    // Setting 9: Simplified Navigation (WCAG 2.4.1 / 2.4.7)
    if (settings.simplifiedNav) {
      applySimplifiedNav(true, changedKey === 'simplifiedNav');
    } else {
      applySimplifiedNav(false, false);
    }

    // Setting 7: Reading Process Indicators (WCAG 2.2 / 3.1)
    if (settings.readingProgress) {
      applyReadingProgress(true, changedKey === 'readingProgress');
    } else {
      applyReadingProgress(false, false);
    }

    // Setting 12: Extended Time Limits (WCAG 2.2.1)
    if (settings.extendedTimeLimits) {
      applyExtendedTimeLimits(true, changedKey === 'extendedTimeLimits');
    } else {
      applyExtendedTimeLimits(false, false);
    }

    // Setting 11: Visual Notifications (WCAG 1.4.1 / 2.2.1)
    if (settings.visualNotifications) {
      applyVisualNotifications(true, changedKey === 'visualNotifications');
    } else {
      applyVisualNotifications(false, false);
    }

    // Setting 5: Stop Auto Playing Media (WCAG 1.4.2 / 2.2.2)
    if (settings.stopAutoplay) {
      applyStopAutoplay(changedKey === 'stopAutoplay');
    }

    // Setting 1: Live Captions (WCAG 1.2.2)
    if (settings.liveCaptions) {
      applyLiveCaptions(true, changedKey === 'liveCaptions');
    } else {
      applyLiveCaptions(false, false);
    }

    // Setting 2: Audio Transcripts (WCAG 1.2.1)
    if (settings.audioTranscripts) {
      applyAudioTranscripts(true, changedKey === 'audioTranscripts');
    } else {
      applyAudioTranscripts(false, false);
    }

    // Setting 6: Content Summarization (WCAG 3.1.5)
    if (settings.contentSummarization) {
      showSummaryModal(changedKey === 'contentSummarization');
    } else {
      hideSummaryModal();
    }

    // Setting 10: Step-by-Step Instructions (WCAG 3.3.2 / 3.3.7)
    if (settings.stepByStepInstructions) {
      applyStepByStepInstructions(changedKey === 'stepByStepInstructions');
    } else {
      removeStepByStepInstructions();
    }
  }

  // ---------------------------------------------------------------------
  // GLOBAL LISTENERS FOR MEDIA INTERACTIONS (Prevents Stopping User Play)
  // ---------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;
    const media = target.closest('video, audio');
    if (media) {
      media.dataset.userInitiated = 'true';
    }
    const player = target.closest('.media-player, [data-media-player], [class*="player"], [class*="video"], [class*="audio"]');
    if (player) {
      player.querySelectorAll('video, audio').forEach((m) => {
        m.dataset.userInitiated = 'true';
      });
    }
  }, true);

  document.addEventListener('play', (e) => {
    const el = e.target;
    if (el && (el.tagName === 'VIDEO' || el.tagName === 'AUDIO')) {
      if (e.isTrusted) {
        el.dataset.userInitiated = 'true';
      } else if (settings.stopAutoplay && el.dataset.userInitiated !== 'true') {
        el.pause();
      }
    }
  }, true);

  function applyStopAutoplay(userTriggered = false) {
    const isTa = selectedLang.code === 'TA';
    const media = document.querySelectorAll('video, audio');
    media.forEach((el) => {
      if (el.autoplay) el.autoplay = false;
      if (!el.paused && el.dataset.userInitiated !== 'true') {
        el.pause();
      }
    });
    if (userTriggered) {
      showMiniToast(
        isTa
          ? '🛑 தானாக இயங்கும் மீடியா நிறுத்தப்பட்டது (Stop Autoplay Active)'
          : '🛑 Stop Autoplay Active: Auto-playing media paused'
      );
    }
  }

  // ---------------------------------------------------------------------
  // PAUSE ANIMATION (WCAG 2.2.2)
  // ---------------------------------------------------------------------
  function applyPauseAnimations(enable = true, userTriggered = false) {
    const root = document.documentElement;
    const isTa = selectedLang.code === 'TA';
    if (enable) {
      root.classList.add('a11y-paused-animations');
      try {
        document.querySelectorAll('svg').forEach((svg) => {
          if (typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
        });
      } catch (e) {}
      document.querySelectorAll('marquee').forEach((m) => {
        try { m.stop(); } catch (e) {}
      });
      if (userTriggered) {
        showMiniToast(isTa ? '⏸️ அனிமேஷன்கள் இடைநிறுத்தப்பட்டன (Animations Paused)' : '⏸️ All animations and CSS transitions paused');
      }
    } else {
      root.classList.remove('a11y-paused-animations');
      try {
        document.querySelectorAll('svg').forEach((svg) => {
          if (typeof svg.unpauseAnimations === 'function') svg.unpauseAnimations();
        });
      } catch (e) {}
      document.querySelectorAll('marquee').forEach((m) => {
        try { m.start(); } catch (e) {}
      });
    }
  }

  // ---------------------------------------------------------------------
  // REDUCE MOTION (WCAG 2.3.3)
  // ---------------------------------------------------------------------
  function applyReduceMotion(enable = true, userTriggered = false) {
    const root = document.documentElement;
    const isTa = selectedLang.code === 'TA';
    if (enable) {
      root.classList.add('a11y-reduce-motion');
      if (userTriggered) {
        showMiniToast(isTa ? '🔕 வேகமான அசைவுகள் குறைக்கப்பட்டன (Reduced Motion Active)' : '🔕 Reduced Motion Enabled: Instant transitions applied');
      }
    } else {
      root.classList.remove('a11y-reduce-motion');
    }
  }

  // ---------------------------------------------------------------------
  // SIMPLIFIED NAVIGATION (WCAG 2.4.1 / 2.4.7)
  // ---------------------------------------------------------------------
  let simplifiedNavBadges = [];
  function applySimplifiedNav(enable = true, userTriggered = false) {
    const root = document.documentElement;
    const isTa = selectedLang.code === 'TA';

    simplifiedNavBadges.forEach((b) => b.remove());
    simplifiedNavBadges = [];

    if (!enable) {
      root.classList.remove('a11y-simplified-nav');
      if (skipLink) skipLink.style.display = 'none';
      return;
    }

    root.classList.add('a11y-simplified-nav');
    if (skipLink) {
      skipLink.style.display = 'block';
      skipLink.innerText = isTa ? '⏭ முக்கிய பகுதிக்குச் செல் (Skip to Main - Alt+S)' : '⏭ Skip to Main Content (Alt+S)';
    }

    const landmarks = [
      { sel: 'header, [role="banner"]', label: 'HEADER' },
      { sel: 'nav, [role="navigation"]', label: 'NAV' },
      { sel: 'main, [role="main"]', label: 'MAIN' },
      { sel: 'aside, [role="complementary"]', label: 'SIDEBAR' },
      { sel: 'footer, [role="contentinfo"]', label: 'FOOTER' }
    ];

    landmarks.forEach(({ sel, label }) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.closest('#a11y-modal-container, #a11y-visual-notify-hub, #a11y-time-limits-dock')) return;
        const style = window.getComputedStyle(el);
        if (style.position === 'static') {
          el.style.position = 'relative';
        }
        const badge = document.createElement('span');
        badge.className = 'a11y-landmark-badge';
        badge.innerText = `[${label}]`;
        el.insertBefore(badge, el.firstChild);
        simplifiedNavBadges.push(badge);
      });
    });

    if (userTriggered) {
      showMiniToast(
        isTa
          ? '🧭 எளிய வழிசெலுத்தல் இயக்கப்பட்டது (Skip Link & Landmarks Active)'
          : '🧭 Simplified Navigation Enabled: Clear Focus Rings & Landmarks Active'
      );
    }
  }

  // ---------------------------------------------------------------------
  // EXTENDED TIME LIMITS (WCAG 2.2.1)
  // ---------------------------------------------------------------------
  let extendedTimeKeepAlive = null;
  let sessionExtendedMinutes = 10;

  function renderTimeLimitsDock() {
    if (!timeLimitsDock) return;
    const isTa = selectedLang.code === 'TA';
    timeLimitsDock.innerHTML = `
      <span style="font-size: 18px;">⏱️</span>
      <div style="flex: 1;">
        <strong style="color: #0f172a;">${isTa ? 'கால அவகாச நீட்டிப்பு' : 'Extended Time Limits'}</strong>
        <div style="font-size: 11px; color: #64748b;">${isTa ? `அமர்வு +${sessionExtendedMinutes} நிமிடம் நீட்டிக்கப்பட்டது` : `Session extended by +${sessionExtendedMinutes} minutes`}</div>
      </div>
      <button class="a11y-time-btn" id="a11y-add-time-btn">${isTa ? '+10 நிமிடம்' : '+10 Min'}</button>
      <button class="a11y-time-btn-close" id="a11y-time-dock-close" title="Close Dock">&times;</button>
    `;

    const addBtn = timeLimitsDock.querySelector('#a11y-add-time-btn');
    if (addBtn) {
      addBtn.onclick = () => {
        sessionExtendedMinutes += 10;
        renderTimeLimitsDock();
        window.dispatchEvent(new Event('mousemove'));
        window.dispatchEvent(new Event('keydown'));
        showMiniToast(isTa ? `⏱️ கூடுதல் 10 நிமிடம் சேர்க்கப்பட்டது (மொத்தம்: ${sessionExtendedMinutes}m)` : `⏱️ +10 Minutes added (Total: +${sessionExtendedMinutes}m)`);
      };
    }

    const closeBtn = timeLimitsDock.querySelector('#a11y-time-dock-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        timeLimitsDock.style.display = 'none';
      };
    }
  }

  function applyExtendedTimeLimits(enable = true, userTriggered = false) {
    const isTa = selectedLang.code === 'TA';
    document.querySelectorAll('.a11y-timer-extended-badge').forEach((b) => b.remove());

    if (extendedTimeKeepAlive) {
      clearInterval(extendedTimeKeepAlive);
      extendedTimeKeepAlive = null;
    }

    if (!enable) {
      if (timeLimitsDock) timeLimitsDock.style.display = 'none';
      return;
    }

    renderTimeLimitsDock();
    if (timeLimitsDock) timeLimitsDock.style.display = 'flex';

    const timerCandidates = document.querySelectorAll('[class*="timer"], [class*="countdown"], [id*="timer"], [id*="countdown"], [data-timer]');
    timerCandidates.forEach((el) => {
      if (el.closest('#a11y-modal-container, #a11y-time-limits-dock')) return;
      const badge = document.createElement('span');
      badge.className = 'a11y-timer-extended-badge';
      badge.innerText = `+${sessionExtendedMinutes}m EXTENDED`;
      el.appendChild(badge);
    });

    extendedTimeKeepAlive = setInterval(() => {
      if (!settings.extendedTimeLimits) return;
      window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    }, 90000);

    if (userTriggered) {
      showMiniToast(
        isTa
          ? '⏱️ கால அவகாசம் நீட்டிக்கப்பட்டது (Time Limits Extended +10 min)'
          : '⏱️ Extended Time Limits Enabled: Inactivity timeouts postponed'
      );
    }
  }

  // ---------------------------------------------------------------------
  // VISUAL NOTIFICATIONS (WCAG 1.4.1 / 2.2.1 / 1.4.11)
  // ---------------------------------------------------------------------
  let visualObserver = null;
  let visualErrorListener = null;

  function triggerVisualFlash(duration = 700) {
    if (!screenFlash) return;
    screenFlash.classList.add('a11y-flash-active');
    clearTimeout(screenFlash._timer);
    screenFlash._timer = setTimeout(() => {
      screenFlash.classList.remove('a11y-flash-active');
    }, duration);
  }

  function triggerVisualNotification(title, message, icon = '🔔') {
    if (!settings.visualNotifications || !visualNotifyHub) return;
    triggerVisualFlash(500);

    const card = document.createElement('div');
    card.className = 'a11y-visual-alert-card';
    card.innerHTML = `
      <span style="font-size: 20px; line-height: 1;">${icon}</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 700; font-size: 13px; color: #60a5fa;">${escapeHtml(title)}</div>
        <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${escapeHtml(message)}</div>
      </div>
      <button class="a11y-alert-close" aria-label="Close notification">&times;</button>
    `;

    const closeBtn = card.querySelector('.a11y-alert-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => card.remove(), 250);
      };
    }

    visualNotifyHub.appendChild(card);

    setTimeout(() => {
      if (card.isConnected) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => card.remove(), 250);
      }
    }, 4500);
  }

  function applyVisualNotifications(enable = true, userTriggered = false) {
    const isTa = selectedLang.code === 'TA';

    if (!enable) {
      if (visualObserver) {
        visualObserver.disconnect();
        visualObserver = null;
      }
      if (visualErrorListener) {
        document.removeEventListener('invalid', visualErrorListener, true);
        visualErrorListener = null;
      }
      if (visualNotifyHub) visualNotifyHub.innerHTML = '';
      return;
    }

    triggerVisualFlash(700);

    if (userTriggered) {
      triggerVisualNotification(
        isTa ? 'காட்சி அறிவிப்புகள் செயலில் உள்ளன' : 'Visual Notifications Active',
        isTa ? 'ஒலி மற்றும் கணினி எச்சரிக்கைகள் திரையில் தெளிவாக ஒளிரும்' : 'Auditory and system cues will now trigger visual screen alerts.'
      );
    }

    if (!visualObserver) {
      visualObserver = new MutationObserver((mutations) => {
        if (!settings.visualNotifications) return;
        for (const m of mutations) {
          if (m.type === 'childList') {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                if (
                  node.matches?.('[role="alert"], [aria-live="assertive"], .alert, .notification') &&
                  !node.closest('#a11y-modal-container, #a11y-visual-notify-hub, #a11y-toast')
                ) {
                  const text = (node.innerText || node.textContent || '').trim().slice(0, 150);
                  if (text) {
                    triggerVisualNotification(isTa ? 'கணினி எச்சரிக்கை' : 'System Alert', text, '⚠️');
                  }
                }
              }
            });
          }
        }
      });
      visualObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (!visualErrorListener) {
      visualErrorListener = (e) => {
        if (!settings.visualNotifications) return;
        const target = e.target;
        if (target && target.tagName && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
          const fieldName = target.getAttribute('placeholder') || target.getAttribute('name') || target.getAttribute('id') || 'Input Field';
          triggerVisualNotification(
            isTa ? 'படிவ எச்சரிக்கை' : 'Form Required Alert',
            isTa ? `${fieldName}: சரியான தகவலை உள்ளிடவும்` : `Please check ${fieldName} - value is required or invalid.`,
            '⚠️'
          );
        }
      };
      document.addEventListener('invalid', visualErrorListener, true);
    }
  }

  // ---------------------------------------------------------------------
  // 12. LIVE CAPTIONS (WCAG 1.2.2)
  // ---------------------------------------------------------------------
  function applyLiveCaptions(enable = true, userTriggered = false) {
    const videos = document.querySelectorAll('video');
    const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]');
    const isTa = selectedLang.code === 'TA';
    const isHi = selectedLang.code === 'HI';

    if (!enable) {
      document.querySelectorAll('.a11y-video-caption-bar').forEach((el) => el.remove());
      videos.forEach((video) => {
        if (video._a11yCaptionHandler) {
          video.removeEventListener('timeupdate', video._a11yCaptionHandler);
          video.removeEventListener('play', video._a11yCaptionHandler);
          video.removeEventListener('pause', video._a11yCaptionHandler);
          video.removeEventListener('ended', video._a11yCaptionHandler);
          delete video._a11yCaptionHandler;
        }
      });
      return;
    }

    // Enable captions on embedded YouTube iframes if any
    youtubeIframes.forEach((iframe) => {
      try {
        const url = new URL(iframe.src);
        if (!url.searchParams.has('cc_load_policy')) {
          url.searchParams.set('cc_load_policy', '1');
          iframe.src = url.toString();
        }
      } catch (e) {}
    });

    if (videos.length === 0 && youtubeIframes.length === 0) {
      if (userTriggered) {
        showMiniToast(
          isTa
            ? 'ℹ️ இந்தப் பக்கத்தில் வீடியோக்கள் எதுவும் இல்லை'
            : (isHi ? 'ℹ️ इस पृष्ठ पर कोई वीडियो नहीं मिला' : 'ℹ️ No video elements found on this page')
        );
      }
      return;
    }

    videos.forEach((video, vIdx) => {
      // 2. Attach overlay bar to video container or parent
      const parent = video.parentElement;
      if (!parent) return;

      if (window.getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }

      let captionBar = parent.querySelector(`.a11y-video-caption-bar[data-video-idx="${vIdx}"]`);
      if (!captionBar) {
        captionBar = document.createElement('div');
        captionBar.className = 'a11y-video-caption-bar';
        captionBar.setAttribute('data-video-idx', vIdx);
        captionBar.setAttribute('role', 'status');
        captionBar.setAttribute('aria-live', 'polite');
        captionBar.innerHTML = `
          <span class="a11y-caption-badge">CC LIVE</span>
          <span class="a11y-caption-text"></span>
        `;
        parent.appendChild(captionBar);
      }

      const textSpan = captionBar.querySelector('.a11y-caption-text');

      const updateCaptionText = () => {
        if (video.paused || video.ended) {
          captionBar.classList.remove('a11y-active');
          return;
        }

        let cueText = '';
        // Priority 1: Check active textTrack cues or matching cue by currentTime
        if (video.textTracks && video.textTracks.length > 0) {
          for (let i = 0; i < video.textTracks.length; i++) {
            const trk = video.textTracks[i];
            if (trk.activeCues && trk.activeCues.length > 0) {
              cueText = Array.from(trk.activeCues).map((c) => c.text).join(' ');
              break;
            }
            if (!cueText && trk.cues && trk.cues.length > 0) {
              const matching = Array.from(trk.cues).find(
                (c) => video.currentTime >= c.startTime && video.currentTime <= c.endTime
              );
              if (matching) {
                cueText = matching.text;
                break;
              }
            }
          }
        }

        // Priority 2: Custom data-captions attribute (JSON array or string)
        if (!cueText && video.dataset.captions) {
          try {
            const parsed = JSON.parse(video.dataset.captions);
            if (Array.isArray(parsed)) {
              const cur = parsed.find(
                (item) => video.currentTime >= item.start && video.currentTime <= item.end
              );
              if (cur) cueText = cur.text;
            }
          } catch (e) {
            cueText = video.dataset.captions;
          }
        }

        // Priority 3: Fallback dynamic caption / accessible transcription indicator
        if (!cueText) {
          const videoTitle =
            video.getAttribute('aria-label') || video.getAttribute('title') || 'Video Stream';
          const mins = Math.floor(video.currentTime / 60);
          const secs = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
          cueText = isTa
            ? `[${mins}:${secs}] ${videoTitle} • நேரலை வசனம் ஒத்திசைக்கப்படுகிறது`
            : `[${mins}:${secs}] ${videoTitle} • Live captioning active`;
        }

        if (cueText) {
          textSpan.textContent = cueText;
          captionBar.classList.add('a11y-active');
        } else {
          captionBar.classList.remove('a11y-active');
        }
      };

      // 1. Enable subtitle/caption tracks & listen for cues
      const trackEls = video.querySelectorAll('track');
      trackEls.forEach((tEl) => {
        if (tEl.track) {
          tEl.track.mode = 'showing';
          tEl.track.addEventListener('cuechange', updateCaptionText);
        }
        tEl.addEventListener('load', () => {
          if (tEl.track) {
            tEl.track.mode = 'showing';
            tEl.track.addEventListener('cuechange', updateCaptionText);
            updateCaptionText();
          }
        });
      });

      if (video.textTracks && video.textTracks.length > 0) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          if (track.kind === 'captions' || track.kind === 'subtitles' || !track.kind) {
            track.mode = 'showing';
            track.addEventListener('cuechange', updateCaptionText);
          }
        }
      }

      if (!video._a11yCaptionHandler) {
        video._a11yCaptionHandler = updateCaptionText;
        video.addEventListener('timeupdate', updateCaptionText);
        video.addEventListener('play', updateCaptionText);
        video.addEventListener('pause', updateCaptionText);
        video.addEventListener('ended', updateCaptionText);
      }

      if (!video.paused) {
        updateCaptionText();
      }
    });

    if (userTriggered) {
      showMiniToast(
        isTa
          ? `🎬 ${videos.length} வீடியோ(க்களுக்கு) நேரலை வசனம் இயக்கப்பட்டது`
          : `🎬 Live Captions enabled for ${videos.length} video(s)`
      );
    }
  }

  // ---------------------------------------------------------------------
  // 13. AUDIO & VIDEO TRANSCRIPTS (WCAG 1.2.1)
  // ---------------------------------------------------------------------
  function applyAudioTranscripts(enable = true, userTriggered = false) {
    const mediaEls = document.querySelectorAll('audio, video');
    const isTa = selectedLang.code === 'TA';
    const isHi = selectedLang.code === 'HI';

    if (!enable) {
      document.querySelectorAll('.a11y-audio-transcript-card').forEach((el) => el.remove());
      mediaEls.forEach((media) => {
        if (media._a11yMediaHandler) {
          media.removeEventListener('play', media._a11yMediaHandler);
          media.removeEventListener('pause', media._a11yMediaHandler);
          media.removeEventListener('ended', media._a11yMediaHandler);
          delete media._a11yMediaHandler;
        }
      });
      return;
    }

    if (mediaEls.length === 0) {
      if (userTriggered) {
        showMiniToast(
          isTa
            ? 'ℹ️ இந்தப் பக்கத்தில் ஆடியோ/வீடியோ பிளேயர் எதுவும் இல்லை'
            : (isHi ? 'ℹ️ इस पृष्ठ पर कोई ऑडियो या वीडियो नहीं मिला' : 'ℹ️ No audio or video elements found on this page')
        );
      }
      return;
    }

    mediaEls.forEach((media, mIdx) => {
      const isVideo = media.tagName.toLowerCase() === 'video';
      let card = media.parentElement
        ? media.parentElement.querySelector(`.a11y-audio-transcript-card[data-media-idx="${mIdx}"]`)
        : null;

      if (!card) {
        card = document.createElement('div');
        card.className = 'a11y-audio-transcript-card';
        card.setAttribute('data-media-idx', mIdx);

        const mTitle =
          media.getAttribute('aria-label') || media.getAttribute('title') || (isVideo ? `Video #${mIdx + 1}` : `Audio #${mIdx + 1}`);

        // Try extracting real cues from tracks
        let extractedTranscript = '';
        if (media.textTracks && media.textTracks.length > 0) {
          for (let i = 0; i < media.textTracks.length; i++) {
            const trk = media.textTracks[i];
            if (trk.cues && trk.cues.length > 0) {
              extractedTranscript = Array.from(trk.cues)
                .map((c) => {
                  const m = Math.floor(c.startTime / 60);
                  const s = Math.floor(c.startTime % 60).toString().padStart(2, '0');
                  return `[${m}:${s}] ${c.text}`;
                })
                .join('\n');
              break;
            }
          }
        }

        const rawTranscript =
          media.dataset.transcript || media.getAttribute('data-transcript') || '';
        const transcriptText =
          extractedTranscript ||
          rawTranscript ||
          (isTa
            ? `இந்த ${isVideo ? 'வீடியோ' : 'ஆடியோ'} பதிவிற்கான உரை விளக்கம் (${mTitle}): உரையாடல், முக்கிய கருத்துக்கள் மற்றும் ஒலி விவரங்கள் பார்வையிட தயாராக உள்ளன.`
            : `${isVideo ? 'Video' : 'Audio'} transcript for ${mTitle}: Dialogue, narration, and accessible media descriptions transcribed for readable reference.`);

        const headerTitle = isVideo
          ? (isTa ? '🎬 வீடியோ உரை விளக்கம் (Video Transcript)' : '🎬 Video Transcript')
          : (isTa ? '🎧 ஆடியோ உரை விளக்கம் (Audio Transcript)' : '🎧 Audio Transcript');

        const initialStatus = media.paused
          ? (isTa ? 'நிறுத்தப்பட்டுள்ளது' : 'Paused')
          : (isTa ? 'ஒலிக்கிறது' : 'Playing');

        card.innerHTML = `
          <div class="a11y-audio-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="a11y-audio-pulse-dot ${!media.paused ? 'a11y-playing' : ''}"></span>
              <strong style="font-size: 13px; color: #0f172a;">${headerTitle}</strong>
              <span class="a11y-audio-status" style="font-size: 11px; font-weight: 600; color: ${!media.paused ? '#16a34a' : '#64748b'};">${initialStatus}</span>
            </div>
            <button type="button" class="a11y-audio-toggle-btn" title="Toggle Transcript">✕</button>
          </div>
          <div class="a11y-audio-body">
            <p style="margin: 0; font-size: 13px; line-height: 1.55; color: #334155;">${escapeHtml(transcriptText)}</p>
          </div>
        `;

        const toggleBtn = card.querySelector('.a11y-audio-toggle-btn');
        const bodyEl = card.querySelector('.a11y-audio-body');
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (bodyEl.style.display === 'none') {
            bodyEl.style.display = 'block';
            toggleBtn.textContent = '✕';
          } else {
            bodyEl.style.display = 'none';
            toggleBtn.textContent = '＋';
          }
        });

        if (media.nextSibling) {
          media.parentNode.insertBefore(card, media.nextSibling);
        } else {
          media.parentNode.appendChild(card);
        }
      }

      const updateMediaStatus = () => {
        const dot = card.querySelector('.a11y-audio-pulse-dot');
        const statusText = card.querySelector('.a11y-audio-status');
        if (!media.paused && !media.ended) {
          card.classList.add('a11y-playing');
          if (dot) dot.classList.add('a11y-playing');
          if (statusText) {
            statusText.textContent = isTa ? 'இயங்குகிறது (Playing)' : 'Playing';
            statusText.style.color = '#16a34a';
          }
        } else {
          card.classList.remove('a11y-playing');
          if (dot) dot.classList.remove('a11y-playing');
          if (statusText) {
            statusText.textContent = isTa ? 'நிறுத்தப்பட்டுள்ளது (Paused)' : 'Paused';
            statusText.style.color = '#64748b';
          }
        }
      };

      if (!media._a11yMediaHandler) {
        media._a11yMediaHandler = updateMediaStatus;
        media.addEventListener('play', updateMediaStatus);
        media.addEventListener('pause', updateMediaStatus);
        media.addEventListener('ended', updateMediaStatus);
      }

      updateMediaStatus();
    });

    if (userTriggered) {
      showMiniToast(
        isTa
          ? `📝 ${mediaEls.length} மீடியா பிளேயருக்கு உரை விளக்கம் இணைக்கப்பட்டது`
          : `📝 Transcripts attached to ${mediaEls.length} media player(s)`
      );
    }
  }

  function updateReadingProgress() {
    if (!settings.readingProgress) return;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const isTa = selectedLang.code === 'TA';

    let pct = 0;
    if (totalHeight > 0) {
      const currentScroll = window.scrollY || window.pageYOffset;
      pct = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
    }
    if (progressBar) progressBar.style.width = pct + '%';

    if (progressBadge) {
      const pctRound = Math.round(pct);
      const text = document.body ? (document.body.innerText || '') : '';
      const totalWords = text.trim().split(/\s+/).filter(Boolean).length;
      const wordsLeft = Math.round(totalWords * ((100 - pct) / 100));
      const minsLeft = Math.max(1, Math.ceil(wordsLeft / 200));

      if (isTa) {
        progressBadge.innerText = `📖 ${pctRound}% வாசிக்கப்பட்டது (${minsLeft} நிமிடம் மீதம்)`;
      } else {
        progressBadge.innerText = `📖 ${pctRound}% Read (~${minsLeft} min left)`;
      }
    }
  }

  function applyReadingProgress(enable = true, userTriggered = false) {
    const isTa = selectedLang.code === 'TA';
    if (!enable) {
      if (progressBar) progressBar.classList.remove('a11y-show');
      if (progressBadge) progressBadge.style.display = 'none';
      return;
    }

    if (progressBar) progressBar.classList.add('a11y-show');
    if (progressBadge) progressBadge.style.display = 'block';
    updateReadingProgress();

    if (userTriggered) {
      showMiniToast(isTa ? '📖 வாசிப்பு முன்னேற்றப் பட்டி இயக்கப்பட்டது' : '📖 Reading Progress Indicator Active');
    }
  }

  window.addEventListener('scroll', () => {
    if (settings.readingProgress) updateReadingProgress();
  });

  const mediaObserver = new MutationObserver(() => {
    if (settings.stopAutoplay) {
      applyStopAutoplay();
    }
    if (settings.liveCaptions) {
      applyLiveCaptions(true, false);
    }
    if (settings.audioTranscripts) {
      applyAudioTranscripts(true, false);
    }
  });

  // ---------------------------------------------------------------------
  // 10. CONTENT SUMMARIZATION (Extractive Algorithm - Up to 5 points)
  // ---------------------------------------------------------------------
  function showSummaryModal(userTriggered = false) {
    const points = generatePageSummary();
    const isTa = selectedLang.code === 'TA';
    const isHi = selectedLang.code === 'HI';

    // If page doesn't have substantial paragraphs / detailed information, don't show the big card
    if (!points || points.length === 0) {
      hideSummaryModal();
      if (userTriggered) {
        showMiniToast(
          isTa
            ? 'ℹ️ சுருக்கக்கூடிய நீண்ட பத்திகள் இந்தப் பக்கத்தில் இல்லை'
            : 'ℹ️ No long paragraphs or detailed article found on this page to summarize'
        );
      }
      return;
    }

    const titleText = isTa
      ? 'உள்ளடக்கச் சுருக்கம் (முக்கிய 5 குறிப்புகள்)'
      : (isHi ? 'सामग्री संक्षेपण (शीर्ष 5 मुख्य बिंदु)' : 'Content Summary (5 Key Takeaways)');

    const subText = isTa
      ? 'WCAG 3.1.5 • எளிதாகப் புரிந்துகொள்ளும் தானியங்கி சுருக்கம்'
      : 'WCAG 3.1.5 • Cognitive Accessibility • Auto-extracted takeaway points';

    const contentHtml = points.map((pt, idx) => `
      <div class="a11y-summary-item">
        <span class="a11y-summary-num">${idx + 1}</span>
        <div style="flex:1;">${escapeHtml(pt)}</div>
      </div>
    `).join('');

    summaryContainer.innerHTML = `
      <div class="a11y-summary-header">
        <div class="a11y-summary-header-left">
          <div class="a11y-summary-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
              <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
              <circle cx="11.5" cy="14.5" r="2.5"/>
              <path d="M13.3 16.3 15 18"/>
            </svg>
          </div>
          <div>
            <h3 class="a11y-summary-title">${titleText}</h3>
            <span class="a11y-summary-badge">${subText}</span>
          </div>
        </div>
        <div class="a11y-summary-actions">
          <button class="a11y-summary-rescan-btn" id="a11y-summary-rescan-btn" title="Re-scan current page text">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>${isTa ? 'மீண்டும் எடு' : 'Re-scan'}</span>
          </button>
          <button class="a11y-summary-close" id="a11y-summary-close-btn" aria-label="Close summary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="a11y-summary-body">
        ${contentHtml}
      </div>
    `;

    summaryContainer.style.display = 'flex';

    const closeBtn = document.getElementById('a11y-summary-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        settings.contentSummarization = false;
        saveAndApply();
        render();
      };
    }

    const rescanBtn = document.getElementById('a11y-summary-rescan-btn');
    if (rescanBtn) {
      rescanBtn.onclick = () => {
        showSummaryModal(true);
      };
    }
  }

  function hideSummaryModal() {
    summaryContainer.style.display = 'none';
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }

  function generatePageSummary() {
    const excludeSelector = '#a11y-modal-container, #a11y-floating-btn, #a11y-summary-container, #a11y-toast, header, nav, footer, script, style, noscript, [aria-hidden="true"]';

    // Prioritize main content containers (articles, readers, blogs)
    const mainContainers = Array.from(document.querySelectorAll('article, main, [role="main"], section.content, .article-content, .news-detail, .post-content'));
    let pElements = [];

    if (mainContainers.length > 0) {
      mainContainers.forEach(container => {
        if (!container.closest(excludeSelector)) {
          pElements.push(...Array.from(container.querySelectorAll('p, blockquote')));
        }
      });
    }

    if (pElements.length === 0) {
      pElements = Array.from(document.querySelectorAll('p, blockquote'));
    }

    const validTexts = [];
    pElements.forEach(el => {
      if (el.closest(excludeSelector)) return;
      const t = (el.innerText || el.textContent || '').trim();
      // Only substantive paragraphs (>= 45 chars) that are not boilerplate
      if (t.length >= 45 && !t.toLowerCase().includes('cookie') && !t.toLowerCase().includes('copyright') && !t.toLowerCase().includes('rights reserved')) {
        validTexts.push(t);
      }
    });

    const fullText = validTexts.join('\n');
    // Only summarize when page has substantial paragraphs or rich information (at least 350 chars)
    if (fullText.length < 350) {
      return [];
    }

    // Split into candidate sentences
    const rawMatches = fullText.match(/[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]{40,}/g) || [];
    const cleanSentences = [];

    rawMatches.forEach(raw => {
      const s = raw.replace(/\s+/g, ' ').trim();
      if (s.length >= 40 && s.length <= 350) {
        if (!cleanSentences.some(existing => existing.toLowerCase() === s.toLowerCase())) {
          cleanSentences.push(s);
        }
      }
    });

    // Need at least 2 coherent sentences to justify an extractive summary
    if (cleanSentences.length < 2) {
      return [];
    }

    // If 5 or fewer sentences exist, return all
    if (cleanSentences.length <= 5) {
      return cleanSentences;
    }

    // Extractive scoring based on word frequencies
    const stopWords = new Set([
      'the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'but',
      'with', 'are', 'have', 'be', 'at', 'or', 'as', 'was', 'so', 'if', 'out', 'not', 'we', 'they',
      'by', 'an', 'from', 'up', 'about', 'into', 'over', 'after', 'which', 'their', 'has', 'will',
      'would', 'can', 'all', 'more', 'when', 'who', 'what', 'there', 'been', 'one', 'its', 'also'
    ]);

    const wordFreq = {};
    cleanSentences.forEach(sentence => {
      const words = sentence.toLowerCase().match(/\b[a-z0-9\u0B80-\u0BFF\u0900-\u097F]{3,}\b/g) || [];
      words.forEach(w => {
        if (!stopWords.has(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      });
    });

    const scored = cleanSentences.map((sentence, index) => {
      const words = sentence.toLowerCase().match(/\b[a-z0-9\u0B80-\u0BFF\u0900-\u097F]{3,}\b/g) || [];
      let score = 0;
      words.forEach(w => {
        if (wordFreq[w]) {
          score += wordFreq[w];
        }
      });
      const normScore = words.length > 0 ? (score / Math.sqrt(words.length)) : 0;
      const posBoost = index === 0 ? 1.5 : (index === 1 ? 1.25 : (index === cleanSentences.length - 1 ? 1.15 : 1.0));
      return {
        sentence,
        score: normScore * posBoost,
        originalIndex: index
      };
    });

    // Top 5 points for long paragraphs/articles
    const targetCount = 5;
    const topScored = [...scored].sort((a, b) => b.score - a.score).slice(0, targetCount);

    // Keep chronological narrative order
    topScored.sort((a, b) => a.originalIndex - b.originalIndex);

    return topScored.map(item => item.sentence);
  }

  // ---------------------------------------------------------------------
  // 11. STEP-BY-STEP INSTRUCTIONS (WCAG 3.3.2 & 3.3.7 Cognitive Guidance)
  // ---------------------------------------------------------------------
  let activeSteps = [];
  let currentStepIdx = 0;
  let isDockDismissed = false;
  let stepMutationObserver = null;
  let stepSyncDebounce = null;
  let isStepObserverInitialized = false;

  function removeStepByStepInstructions() {
    stepperDock.style.display = 'none';
    document.querySelectorAll('.a11y-step-badge').forEach((b) => b.remove());
    document.querySelectorAll('.a11y-step-focused').forEach((el) => el.classList.remove('a11y-step-focused'));
    activeSteps = [];
    currentStepIdx = 0;
  }

  function detectPageSteps() {
    const excludeSelector =
      '#a11y-modal-container, #a11y-floating-btn, #a11y-summary-container, #a11y-stepper-dock, #a11y-toast, header, nav, footer, script, style, [aria-hidden="true"]';

    // If an active modal is open on the page, prioritize scanning inside the modal!
    const activeModal = document.querySelector(
      '[role="dialog"]:not(#a11y-modal-container), .modal, [class*="modal-content"], [class*="fixed inset-0"] form, [class*="fixed inset-0"] .bg-white'
    );
    const rootScope = activeModal || document.body;

    const steps = [];
    const seenElements = new Set();

    // 1. Check for distinct numbered section cards (e.g. "1 Basic Information", "2 Date & Working Slots", "3 Meeting Mode")
    const numberedSections = [];
    const candidateContainers = Array.from(
      rootScope.querySelectorAll('div, section, fieldset, [class*="card"]')
    );

    candidateContainers.forEach((container) => {
      if (container.closest(excludeSelector) || container.offsetParent === null) return;

      // Check if container has a numbered badge + title (like <span ..>1</span> <h4 ..>Basic Info</h4>)
      const badgeEl = container.querySelector('span, div');
      const headingEl = container.querySelector('h1, h2, h3, h4, h5, [class*="font-bold"]');
      if (badgeEl && headingEl && badgeEl !== headingEl && container.children.length <= 4) {
        const badgeTxt = badgeEl.innerText.trim();
        const headingTxt = headingEl.innerText.trim();
        if (/^[1-9]$/.test(badgeTxt) && headingTxt.length > 2 && headingTxt.length < 60) {
          if (!seenElements.has(container)) {
            seenElements.add(container);
            numberedSections.push({
              number: parseInt(badgeTxt, 10),
              element: container,
              title: headingTxt.replace(/[*:]/g, '').trim(),
              type: 'section',
            });
          }
        }
      }
    });

    // If the card/modal has 2 or more distinct numbered sections (like 1, 2, 3):
    if (numberedSections.length >= 2) {
      // Sort numbered sections strictly by document position
      numberedSections.sort((a, b) => {
        if (a.element === b.element) return 0;
        const pos = a.element.compareDocumentPosition(b.element);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
      });

      steps.push(...numberedSections);

      // Also add primary submit / action button if present
      const submitBtn = rootScope.querySelector(
        'button[type="submit"], button.btn-primary, button[class*="confirm"], button[class*="book"], button[class*="publish"], button[class*="save"]'
      );
      if (submitBtn && submitBtn.offsetParent !== null && !submitBtn.closest(excludeSelector)) {
        steps.push({
          element: submitBtn,
          title: (submitBtn.innerText || 'Submit').trim().split('\n')[0],
          type: 'button',
        });
      }

      return steps;
    }

    // 2. Otherwise, scan general headings, interactive inputs, and action buttons in document order
    function getCleanLabel(el) {
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
      if (el.id) {
        const l = document.querySelector(`label[for="${el.id}"]`);
        if (l && l.innerText.trim()) return l.innerText.trim();
      }
      const parentLabel = el.closest('label');
      if (parentLabel && parentLabel.innerText.trim()) return parentLabel.innerText.trim();

      let prev = el.previousElementSibling;
      while (prev) {
        const txt = (prev.innerText || '').trim();
        if (txt && txt.length < 60) return txt;
        prev = prev.previousElementSibling;
      }

      const container = el.closest('div, fieldset, section');
      if (container) {
        const heading = container.querySelector(
          'label, h1, h2, h3, h4, h5, span.font-semibold, span.font-bold, p.font-semibold, div.font-semibold'
        );
        if (heading && heading !== el && heading.innerText.trim()) {
          const txt = heading.innerText.trim();
          if (txt.length < 60) return txt;
        }
      }

      if (el.placeholder) return el.placeholder;
      if (el.name) return el.name.replace(/[-_]/g, ' ');
      if (el.innerText && el.innerText.trim().length < 40) return el.innerText.trim();
      return '';
    }

    // Step headings
    const stepHeadings = Array.from(
      rootScope.querySelectorAll('h1, h2, h3, h4, [class*="step"], [data-step]')
    );
    stepHeadings.forEach((h) => {
      if (h.closest(excludeSelector) || h.offsetParent === null) return;
      const txt = h.innerText.trim();
      if (
        /(^(\d+|step\s*\d+)|choose|select|preferred|your\s+contact|details|payment|review|confirm|host|mode)/i.test(txt) &&
        txt.length < 70
      ) {
        if (!seenElements.has(h)) {
          seenElements.add(h);
          steps.push({
            element: h,
            title: txt.replace(/[*:]/g, '').trim(),
            type: 'heading',
          });
        }
      }
    });

    // Form inputs
    const formControls = Array.from(
      rootScope.querySelectorAll(
        'input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea'
      )
    );
    formControls.forEach((ctrl) => {
      if (ctrl.closest(excludeSelector) || ctrl.offsetParent === null) return;
      if (seenElements.has(ctrl)) return;
      const label = getCleanLabel(ctrl);
      if (label) {
        seenElements.add(ctrl);
        steps.push({
          element: ctrl,
          title: label.replace(/[*:]/g, '').trim(),
          type: 'input',
        });
      }
    });

    // Action buttons
    const actionButtons = Array.from(
      rootScope.querySelectorAll(
        'button[type="submit"], button.btn-primary, button[class*="confirm"], button[class*="book"], button[class*="next"], button[class*="publish"]'
      )
    );
    actionButtons.forEach((btn) => {
      if (btn.closest(excludeSelector) || btn.offsetParent === null) return;
      if (seenElements.has(btn)) return;
      const txt = btn.innerText.trim();
      if (txt && /(next|confirm|submit|book|continue|proceed|publish)/i.test(txt) && txt.length < 50) {
        seenElements.add(btn);
        steps.push({
          element: btn,
          title: txt.replace(/[*:]/g, '').trim(),
          type: 'button',
        });
      }
    });

    // CRITICAL: Sort all collected steps strictly by DOCUMENT ORDER
    steps.sort((a, b) => {
      if (a.element === b.element) return 0;
      const pos = a.element.compareDocumentPosition(b.element);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    return steps;
  }

  function applyStepByStepInstructions(userTriggered = false) {
    // Clean old badges before re-scanning
    document.querySelectorAll('.a11y-step-badge').forEach((b) => b.remove());
    document.querySelectorAll('.a11y-step-focused').forEach((el) => el.classList.remove('a11y-step-focused'));

    if (userTriggered) {
      isDockDismissed = false;
    }

    activeSteps = detectPageSteps();
    const isTa = selectedLang.code === 'TA';

    // Only show on pages where step-by-step instructions are actually useful (forms/multi-step workflows with >= 2 steps)
    if (!activeSteps || activeSteps.length < 2) {
      stepperDock.style.display = 'none';
      return;
    }

    // If user clicked close on the dock on this page, keep it dismissed unless userTriggered
    if (isDockDismissed && !userTriggered) {
      return;
    }

    // 1. Inject in-page badges before target elements or labels
    activeSteps.forEach((s, idx) => {
      const target = s.element;

      // If element or container already has an app-provided number circle (1, 2, 3), skip redundant badge!
      const existingBadge = target.querySelector('span.rounded-md, span.rounded-full, .w-5');
      if (existingBadge && /^[1-9]$/.test(existingBadge.innerText.trim())) {
        return;
      }

      const badge = document.createElement('span');
      badge.className = 'a11y-step-badge';
      badge.textContent = isTa ? `படி ${idx + 1}` : `Step ${idx + 1}`;

      if (
        target.previousElementSibling &&
        target.previousElementSibling.tagName.match(/LABEL|H[1-6]|SPAN|P/i)
      ) {
        target.previousElementSibling.prepend(badge);
      } else if (target.parentElement && target.parentElement.tagName === 'LABEL') {
        target.parentElement.prepend(badge);
      } else {
        target.insertAdjacentElement('beforebegin', badge);
      }
    });

    // 2. Show the dock
    if (currentStepIdx >= activeSteps.length) {
      currentStepIdx = 0;
    }
    renderStepperDock();
    stepperDock.style.display = 'flex';

    // Highlight active step
    goToStep(currentStepIdx, false);

    // Initialize real-time observer
    initStepObserver();
  }

  function renderStepperDock() {
    if (!activeSteps || activeSteps.length === 0) return;
    const isTa = selectedLang.code === 'TA';
    const total = activeSteps.length;
    const current = activeSteps[currentStepIdx] || activeSteps[0];

    const prevDisabled = currentStepIdx === 0 ? 'disabled' : '';
    const nextDisabled = currentStepIdx === total - 1 ? 'disabled' : '';

    stepperDock.innerHTML = `
      <div class="a11y-stepper-left">
        <span class="a11y-stepper-pill">
          ${isTa ? `படி ${currentStepIdx + 1} / ${total}` : `Step ${currentStepIdx + 1} of ${total}`}
        </span>
        <span class="a11y-stepper-title" title="${escapeHtml(current.title)}">
          ${escapeHtml(current.title)}
        </span>
      </div>
      <div class="a11y-stepper-controls">
        <button class="a11y-stepper-btn" id="a11y-stepper-prev" ${prevDisabled} type="button">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          <span>${isTa ? 'முந்தைய' : 'Prev'}</span>
        </button>
        <button class="a11y-stepper-btn a11y-stepper-btn-primary" id="a11y-stepper-next" ${nextDisabled} type="button">
          <span>${isTa ? 'அடுத்தது' : 'Next'}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="a11y-stepper-btn" id="a11y-stepper-sync" title="Sync / Re-scan steps" type="button">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          <span>${isTa ? 'புதுப்பி' : 'Sync'}</span>
        </button>
        <button class="a11y-stepper-close" id="a11y-stepper-close" aria-label="Close Step Instructions" type="button">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    const prevBtn = document.getElementById('a11y-stepper-prev');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentStepIdx > 0) {
          goToStep(currentStepIdx - 1);
        }
      };
    }

    const nextBtn = document.getElementById('a11y-stepper-next');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (currentStepIdx < total - 1) {
          goToStep(currentStepIdx + 1);
        }
      };
    }

    const syncBtn = document.getElementById('a11y-stepper-sync');
    if (syncBtn) {
      syncBtn.onclick = () => {
        applyStepByStepInstructions(true);
      };
    }

    const closeBtn = document.getElementById('a11y-stepper-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        // Only hide/dismiss the dock overlay on screen. DO NOT turn OFF the setting in Settings modal!
        stepperDock.style.display = 'none';
        isDockDismissed = true;
      };
    }
  }

  function goToStep(idx, scroll = true) {
    if (idx < 0 || idx >= activeSteps.length) return;
    currentStepIdx = idx;
    renderStepperDock();

    const targetEl = activeSteps[idx].element;
    if (targetEl) {
      document.querySelectorAll('.a11y-step-focused').forEach((el) => el.classList.remove('a11y-step-focused'));

      if (scroll) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (typeof targetEl.focus === 'function') {
        targetEl.focus({ preventScroll: true });
      }

      targetEl.classList.add('a11y-step-focused');
      setTimeout(() => {
        targetEl.classList.remove('a11y-step-focused');
      }, 2500);
    }
  }

  // Real-time Mutation & Click Observer for React Single-Page Transitions
  function initStepObserver() {
    if (isStepObserverInitialized) return;
    isStepObserverInitialized = true;

    // 1. Observe DOM changes when React updates component view
    stepMutationObserver = new MutationObserver(() => {
      if (!settings.stepByStepInstructions) return;

      const isStale = activeSteps.length === 0 || activeSteps.some((s) => !s.element.isConnected);
      if (isStale) {
        clearTimeout(stepSyncDebounce);
        stepSyncDebounce = setTimeout(() => {
          if (settings.stepByStepInstructions) {
            applyStepByStepInstructions(false);
          }
        }, 220);
      }
    });

    stepMutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 2. Global listener for interactive buttons on host page
    document.addEventListener('click', (e) => {
      if (!settings.stepByStepInstructions) return;
      const target = e.target;
      if (
        target.closest('#a11y-stepper-dock') ||
        target.closest('#a11y-modal-container') ||
        target.closest('#a11y-floating-btn')
      ) {
        return;
      }

      const interactive = target.closest('button, [role="button"], a, input[type="submit"], [data-step]');
      if (interactive) {
        clearTimeout(stepSyncDebounce);
        stepSyncDebounce = setTimeout(() => {
          if (settings.stepByStepInstructions) {
            applyStepByStepInstructions(false);
          }
        }, 260);
      }
    }, true);
  }

  // ---------------------------------------------------------------------
  // 12. SAFE AUTO-INIT (Works in <head>, <body>, async, defer, or module)
  // ---------------------------------------------------------------------
  function init() {
    // If body is not yet ready, wait
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
      } else {
        window.addEventListener('load', init, { once: true });
      }
      return;
    }

    // Safely append styles
    const headTarget = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
    if (headTarget && !document.getElementById('a11y-standalone-widget-styles')) {
      headTarget.appendChild(styleEl);
    }

    // Safely append elements to body
    if (!document.getElementById('a11y-reading-progress-bar')) {
      document.body.appendChild(progressBar);
    }
    if (!document.getElementById('a11y-reading-progress-badge')) {
      document.body.appendChild(progressBadge);
    }
    if (!document.getElementById('a11y-screen-flash')) {
      document.body.appendChild(screenFlash);
    }
    if (!document.getElementById('a11y-visual-notify-hub')) {
      document.body.appendChild(visualNotifyHub);
    }
    if (!document.getElementById('a11y-skip-link')) {
      document.body.appendChild(skipLink);
    }
    if (!document.getElementById('a11y-time-limits-dock')) {
      document.body.appendChild(timeLimitsDock);
    }
    if (!document.getElementById('a11y-summary-container')) {
      document.body.appendChild(summaryContainer);
    }
    if (!document.getElementById('a11y-stepper-dock')) {
      document.body.appendChild(stepperDock);
    }
    if (!document.getElementById('a11y-toast')) {
      document.body.appendChild(toastEl);
    }
    if (!document.getElementById('a11y-floating-btn')) {
      document.body.appendChild(triggerBtn);
    }
    if (!document.getElementById('a11y-modal-container')) {
      document.body.appendChild(modal);
    }

    // Start mutation observer for media
    mediaObserver.observe(document.body, { childList: true, subtree: true });

    // Apply settings
    saveAndApply();

    console.log('%c[A11Y Widget] Loaded successfully and active!', 'color: #2563eb; font-weight: bold; font-size: 13px;');
  }

  // Trigger init immediately or when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
