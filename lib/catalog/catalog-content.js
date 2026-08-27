// ---------------------------------------------------------------------------
// 50 g Soap Collection — catalogue content
//
// This file is the source of truth for the printable catalogue at /catalog.
// The page reads the live product list from the database for names, ordering
// and stock status, but the customer-facing copy below (in three languages)
// is curated here so it can be proof-read and kept consistent.
//
// The Hindi and Kannada copy is an AI-assisted first draft — please review
// before sharing publicly. English is written for the 50 g size specifically
// (the database descriptions still refer to the 100 g bars).
//
// A soap only appears in the catalogue if its `slug` has an entry in
// CATALOG_PRODUCTS below. Curated boxes, the Valentine's soap and the kids'
// toy collection are deliberately left out.
// ---------------------------------------------------------------------------

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

// UI strings + section labels, per language.
export const UI = {
  en: {
    coverKicker: 'The Healing Soil Collection',
    title: 'The 50 g Soap Collection',
    tagline: 'Handmade in small batches · Real ingredients · Nothing synthetic',
    ethosHeading: 'Our promise',
    ethosBody:
      'Healing Soil soaps are made by hand in small batches in Goa. We start with real ingredients — farm goat milk, cold-pressed oils, sun-dried herbs and fruit peels, homegrown flowers — and leave out SLS, parabens and synthetic fragrance. Every bar is a little different, the way handmade things are. This collection shows each soap in its 50 g size: enough to live with a scent for a few weeks, easy to travel with, and a gentle way to find the ones your skin loves.',
    scentNote:
      'Each soap is made to order in your choice of essential-oil scent — tell us your preference when you order.',
    ingredients: 'Ingredients',
    scent: 'Scent options',
    defaultTag: 'house pick',
    weight: '50 g bar',
    price: 'Price',
    madeIn: 'Handmade in Goa, India',
    contents: 'In this collection',
    base: {
      Glycerine: 'Glycerin bars',
      'Goat Milk': 'Goat milk bars',
      'Shea Butter': 'Shea butter bars',
      'Papaya Cucumber': 'Goat milk bars',
    },
  },
  hi: {
    coverKicker: 'हीलिंग सॉइल संग्रह',
    title: '50 ग्राम साबुन संग्रह',
    tagline: 'छोटे बैच में हस्तनिर्मित · असली सामग्री · कुछ भी कृत्रिम नहीं',
    ethosHeading: 'हमारा वादा',
    ethosBody:
      'हीलिंग सॉइल के साबुन गोवा में छोटे-छोटे बैच में हाथ से बनाए जाते हैं। हम असली सामग्री से शुरुआत करते हैं — फार्म का बकरी का दूध, कोल्ड-प्रेस्ड तेल, धूप में सुखाई गई जड़ी-बूटियाँ और फलों के छिलके, घर में उगाए फूल — और SLS, पैराबेन तथा कृत्रिम सुगंध से दूर रहते हैं। हर साबुन थोड़ा अलग होता है, जैसे हाथ से बनी चीज़ें होती हैं। इस संग्रह में हर साबुन उसके 50 ग्राम आकार में दिखाया गया है: किसी खुशबू के साथ कुछ हफ़्ते बिताने के लिए काफ़ी, यात्रा में साथ ले जाने में आसान, और अपनी त्वचा के लिए सही साबुन ढूँढने का एक सौम्य तरीका।',
    scentNote:
      'हर साबुन आपकी पसंद की एसेंशियल ऑयल खुशबू में ऑर्डर पर बनाया जाता है — ऑर्डर करते समय अपनी पसंद बताएँ।',
    ingredients: 'सामग्री',
    scent: 'खुशबू के विकल्प',
    defaultTag: 'हमारी पसंद',
    weight: '50 ग्राम बार',
    price: 'मूल्य',
    madeIn: 'भारत, गोवा में हस्तनिर्मित',
    contents: 'इस संग्रह में',
    base: {
      Glycerine: 'ग्लिसरीन बार',
      'Goat Milk': 'बकरी के दूध के बार',
      'Shea Butter': 'शिया बटर बार',
      'Papaya Cucumber': 'बकरी के दूध के बार',
    },
  },
  kn: {
    coverKicker: 'ಹೀಲಿಂಗ್ ಸಾಯಿಲ್ ಸಂಗ್ರಹ',
    title: '50 ಗ್ರಾಂ ಸೋಪ್ ಸಂಗ್ರಹ',
    tagline: 'ಸಣ್ಣ ಬ್ಯಾಚ್‌ಗಳಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗಿದೆ · ನಿಜವಾದ ಪದಾರ್ಥಗಳು · ಕೃತಕವಾದದ್ದೇನೂ ಇಲ್ಲ',
    ethosHeading: 'ನಮ್ಮ ಭರವಸೆ',
    ethosBody:
      'ಹೀಲಿಂಗ್ ಸಾಯಿಲ್ ಸೋಪುಗಳನ್ನು ಗೋವಾದಲ್ಲಿ ಸಣ್ಣ ಬ್ಯಾಚ್‌ಗಳಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗುತ್ತದೆ. ನಾವು ನಿಜವಾದ ಪದಾರ್ಥಗಳಿಂದ ಆರಂಭಿಸುತ್ತೇವೆ — ಫಾರ್ಮ್ ಮೇಕೆ ಹಾಲು, ಕೋಲ್ಡ್-ಪ್ರೆಸ್ಡ್ ಎಣ್ಣೆಗಳು, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಗಿಡಮೂಲಿಕೆಗಳು ಮತ್ತು ಹಣ್ಣಿನ ಸಿಪ್ಪೆಗಳು, ಮನೆಯಲ್ಲಿ ಬೆಳೆದ ಹೂವುಗಳು — ಮತ್ತು SLS, ಪ್ಯಾರಬೆನ್ ಹಾಗೂ ಕೃತಕ ಸುಗಂಧವನ್ನು ಬಳಸುವುದಿಲ್ಲ. ಕೈಯಿಂದ ಮಾಡಿದ ವಸ್ತುಗಳಂತೆ ಪ್ರತಿ ಸೋಪ್ ಸ್ವಲ್ಪ ಭಿನ್ನವಾಗಿರುತ್ತದೆ. ಈ ಸಂಗ್ರಹದಲ್ಲಿ ಪ್ರತಿ ಸೋಪನ್ನು ಅದರ 50 ಗ್ರಾಂ ಗಾತ್ರದಲ್ಲಿ ತೋರಿಸಲಾಗಿದೆ: ಒಂದು ಪರಿಮಳದೊಂದಿಗೆ ಕೆಲವು ವಾರ ಕಳೆಯಲು ಸಾಕು, ಪ್ರಯಾಣಕ್ಕೆ ಸುಲಭ, ಮತ್ತು ನಿಮ್ಮ ಚರ್ಮಕ್ಕೆ ಒಪ್ಪುವ ಸೋಪುಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಲು ಒಂದು ಸೌಮ್ಯ ಮಾರ್ಗ.',
    scentNote:
      'ಪ್ರತಿ ಸೋಪನ್ನು ನಿಮ್ಮ ಆಯ್ಕೆಯ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್ ಪರಿಮಳದಲ್ಲಿ ಆರ್ಡರ್ ಮೇರೆಗೆ ತಯಾರಿಸಲಾಗುತ್ತದೆ — ಆರ್ಡರ್ ಮಾಡುವಾಗ ನಿಮ್ಮ ಆಯ್ಕೆ ತಿಳಿಸಿ.',
    ingredients: 'ಪದಾರ್ಥಗಳು',
    scent: 'ಪರಿಮಳದ ಆಯ್ಕೆಗಳು',
    defaultTag: 'ನಮ್ಮ ಆಯ್ಕೆ',
    weight: '50 ಗ್ರಾಂ ಬಾರ್',
    price: 'ಬೆಲೆ',
    madeIn: 'ಭಾರತದ ಗೋವಾದಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗಿದೆ',
    contents: 'ಈ ಸಂಗ್ರಹದಲ್ಲಿ',
    base: {
      Glycerine: 'ಗ್ಲಿಸರಿನ್ ಬಾರ್‌ಗಳು',
      'Goat Milk': 'ಮೇಕೆ ಹಾಲಿನ ಬಾರ್‌ಗಳು',
      'Shea Butter': 'ಶಿಯಾ ಬಟರ್ ಬಾರ್‌ಗಳು',
      'Papaya Cucumber': 'ಮೇಕೆ ಹಾಲಿನ ಬಾರ್‌ಗಳು',
    },
  },
};

const IMG = '/50g-soap-squares/images';

export const CATALOG_PRODUCTS = {
  // ---- Glycerin bars -----------------------------------------------------
  'neem-tulsi-glycerin-soap': {
    image: `${IMG}/neem-tulsi-glycerine-50g.png`,
    order: 1,
    price: null,
    content: {
      en: {
        name: 'Neem & Tulsi Glycerin',
        description:
          'Sun-dried neem and tulsi — two herbs Indian households have trusted for generations — set into a clear glycerin base. An earthy, green scent and a light, everyday lather for skin that wants calm, clean care.',
        ingredients:
          'Glycerin soap base, Sun-dried neem, Sun-dried tulsi, Tea-tree essential oil, Vitamin E',
      },
      hi: {
        name: 'नीम और तुलसी ग्लिसरीन',
        description:
          'धूप में सुखाए गए नीम और तुलसी — दो जड़ी-बूटियाँ जिन पर भारतीय घरों ने पीढ़ियों से भरोसा किया है — पारदर्शी ग्लिसरीन बेस में। मिट्टी जैसी हरी खुशबू और हल्का, रोज़ इस्तेमाल लायक झाग, उस त्वचा के लिए जिसे शांत और साफ़ देखभाल चाहिए।',
        ingredients:
          'ग्लिसरीन साबुन बेस, धूप में सुखाया नीम, धूप में सुखाई तुलसी, टी-ट्री एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಬೇವು ಮತ್ತು ತುಳಸಿ ಗ್ಲಿಸರಿನ್',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಬೇವು ಮತ್ತು ತುಳಸಿ — ಭಾರತೀಯ ಮನೆಗಳು ತಲೆಮಾರುಗಳಿಂದ ನಂಬಿರುವ ಎರಡು ಗಿಡಮೂಲಿಕೆಗಳು — ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಬೇಸ್‌ನಲ್ಲಿ. ಮಣ್ಣಿನಂತಹ ಹಸಿರು ಪರಿಮಳ ಮತ್ತು ಹಗುರವಾದ, ದಿನನಿತ್ಯದ ನೊರೆ — ಶಾಂತ, ಶುದ್ಧ ಆರೈಕೆ ಬೇಕಾದ ಚರ್ಮಕ್ಕೆ.',
        ingredients:
          'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಬೇವು, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ತುಳಸಿ, ಟೀ ಟ್ರೀ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'honey-oats-glycerin-soap': {
    image: `${IMG}/honey-oats-glycerin-50g.png`,
    order: 2,
    price: null,
    content: {
      en: {
        name: 'Honey & Oats Glycerin',
        description:
          'Real honey and stone-ground oats in a gentle glycerin base. Softly sweet, lightly textured and mild enough for tired or sensitive skin — the bar to reach for at the end of a long day.',
        ingredients: 'Glycerin soap base, Honey, Oats, Chamomile essential oil, Vitamin E',
      },
      hi: {
        name: 'शहद और ओट्स ग्लिसरीन',
        description:
          'असली शहद और पिसे हुए ओट्स एक सौम्य ग्लिसरीन बेस में। हल्का मीठा, हल्की बनावट वाला, और थकी या संवेदनशील त्वचा के लिए भी नरम — लंबे दिन के अंत में उठाने लायक बार।',
        ingredients: 'ग्लिसरीन साबुन बेस, शहद, ओट्स, कैमोमाइल एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಗ್ಲಿಸರಿನ್',
        description:
          'ನಿಜವಾದ ಜೇನು ಮತ್ತು ಪುಡಿ ಮಾಡಿದ ಓಟ್ಸ್ ಒಂದು ಸೌಮ್ಯ ಗ್ಲಿಸರಿನ್ ಬೇಸ್‌ನಲ್ಲಿ. ಸ್ವಲ್ಪ ಸಿಹಿ, ಹಗುರ ವಿನ್ಯಾಸ, ಮತ್ತು ದಣಿದ ಅಥವಾ ಸೂಕ್ಷ್ಮ ಚರ್ಮಕ್ಕೂ ಮೃದು — ದೀರ್ಘ ದಿನದ ಕೊನೆಯಲ್ಲಿ ಕೈಗೆತ್ತಿಕೊಳ್ಳುವ ಬಾರ್.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಜೇನು, ಓಟ್ಸ್, ಕ್ಯಾಮೊಮೈಲ್ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'ginger-rosemary-glycerin-soap': {
    image: `${IMG}/ginger-rosemary-glycerin-50g.png`,
    order: 3,
    price: null,
    content: {
      en: {
        name: 'Ginger & Rosemary Glycerin',
        description:
          'Fresh ginger and garden rosemary in a clear glycerin base. A warm, herbal, waking-up scent and a clean-rinsing lather — a good morning bar.',
        ingredients: 'Glycerin soap base, Ginger, Rosemary, Rosemary essential oil, Vitamin E',
      },
      hi: {
        name: 'अदरक और रोज़मेरी ग्लिसरीन',
        description:
          'ताज़ा अदरक और बगीचे की रोज़मेरी एक पारदर्शी ग्लिसरीन बेस में। गर्म, जड़ी-बूटी जैसी, जगाने वाली खुशबू और साफ़ धुलने वाला झाग — एक अच्छी सुबह वाला बार।',
        ingredients: 'ग्लिसरीन साबुन बेस, अदरक, रोज़मेरी, रोज़मेरी एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಗ್ಲಿಸರಿನ್',
        description:
          'ತಾಜಾ ಶುಂಠಿ ಮತ್ತು ತೋಟದ ರೋಸ್ಮೇರಿ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಬೇಸ್‌ನಲ್ಲಿ. ಬೆಚ್ಚಗಿನ, ಗಿಡಮೂಲಿಕೆಯ, ಎಚ್ಚರಗೊಳಿಸುವ ಪರಿಮಳ ಮತ್ತು ಶುದ್ಧವಾಗಿ ತೊಳೆದುಹೋಗುವ ನೊರೆ — ಒಳ್ಳೆಯ ಬೆಳಗಿನ ಬಾರ್.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಶುಂಠಿ, ರೋಸ್ಮೇರಿ, ರೋಸ್ಮೇರಿ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  orange: {
    image: `${IMG}/orange-glycerine-50g.png`,
    order: 4,
    price: null,
    content: {
      en: {
        name: 'Orange Glycerin',
        description:
          'Sun-dried orange peel powder in a clear glycerin base. A clean burst of citrus and a light, quick-rinsing lather for an everyday wake-up wash.',
        ingredients: 'Glycerin soap base, Sun-dried orange peel, Orange essential oil, Vitamin E',
      },
      hi: {
        name: 'संतरा ग्लिसरीन',
        description:
          'धूप में सुखाए संतरे के छिलके का पाउडर एक पारदर्शी ग्लिसरीन बेस में। खट्टे-मीठे का साफ़ झोंका और हल्का, जल्दी धुलने वाला झाग — रोज़ की जगाने वाली धुलाई के लिए।',
        ingredients: 'ग्लिसरीन साबुन बेस, धूप में सुखाया संतरे का छिलका, संतरा एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕಿತ್ತಳೆ ಗ್ಲಿಸರಿನ್',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಕಿತ್ತಳೆ ಸಿಪ್ಪೆ ಪುಡಿ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಬೇಸ್‌ನಲ್ಲಿ. ಸಿಟ್ರಸ್‌ನ ಶುದ್ಧ ಸಿಡಿತ ಮತ್ತು ಹಗುರವಾದ, ಬೇಗ ತೊಳೆದುಹೋಗುವ ನೊರೆ — ದಿನನಿತ್ಯದ ಎಚ್ಚರಗೊಳಿಸುವ ಸ್ನಾನಕ್ಕೆ.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಕಿತ್ತಳೆ ಸಿಪ್ಪೆ, ಕಿತ್ತಳೆ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'pomegranate-glycerine': {
    image: `${IMG}/pomegranate-glycerin-50g.png`,
    order: 5,
    price: null,
    content: {
      en: {
        name: 'Pomegranate Glycerin',
        description:
          'Sun-dried pomegranate peel, ground and set into glycerin for deep natural colour and a lightly grainy surface. Antioxidant-rich fruit skincare, made simple.',
        ingredients:
          'Glycerin soap base, Sun-dried pomegranate peel, Ylang ylang essential oil, Vitamin E',
      },
      hi: {
        name: 'अनार ग्लिसरीन',
        description:
          'धूप में सुखाए अनार के छिलके, पीसकर ग्लिसरीन में जमाए गए — गहरा प्राकृतिक रंग और हल्की दानेदार सतह। एंटीऑक्सीडेंट से भरपूर फल की त्वचा देखभाल, सरल तरीके से।',
        ingredients: 'ग्लिसरीन साबुन बेस, धूप में सुखाया अनार का छिलका, इलंग-इलंग एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ದಾಳಿಂಬೆ ಗ್ಲಿಸರಿನ್',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ದಾಳಿಂಬೆ ಸಿಪ್ಪೆ, ಪುಡಿ ಮಾಡಿ ಗ್ಲಿಸರಿನ್‌ನಲ್ಲಿ ಸೇರಿಸಲಾಗಿದೆ — ಆಳವಾದ ನೈಸರ್ಗಿಕ ಬಣ್ಣ ಮತ್ತು ಸ್ವಲ್ಪ ಒರಟಾದ ಮೇಲ್ಮೈ. ಆಂಟಿಆಕ್ಸಿಡೆಂಟ್‌ಗಳಿಂದ ಸಮೃದ್ಧ ಹಣ್ಣಿನ ಚರ್ಮ ಆರೈಕೆ, ಸರಳವಾಗಿ.',
        ingredients:
          'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ದಾಳಿಂಬೆ ಸಿಪ್ಪೆ, ಇಲಂಗ್-ಇಲಂಗ್ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'marigold-soap': {
    image: `${IMG}/marigold-glycerine-50g.png`,
    order: 6,
    price: null,
    content: {
      en: {
        name: 'Marigold Glycerin',
        description:
          'Homegrown marigold, pressed into oil and scattered as petals through a clear glycerin bar. A mild, sweet scent and gentle, calming care for easily irritated skin.',
        ingredients: 'Glycerin soap base, Marigold-infused oil, Marigold petals, Vitamin E',
      },
      hi: {
        name: 'गेंदा ग्लिसरीन',
        description:
          'घर में उगाया गेंदा, तेल में दबाया और पंखुड़ियों के रूप में एक पारदर्शी ग्लिसरीन बार में बिखेरा गया। हल्की, मीठी खुशबू और आसानी से चिड़चिड़ी होने वाली त्वचा के लिए सौम्य, शांत देखभाल।',
        ingredients: 'ग्लिसरीन साबुन बेस, गेंदा-युक्त तेल, गेंदे की पंखुड़ियाँ, विटामिन ई',
      },
      kn: {
        name: 'ಚೆಂಡು ಹೂ ಗ್ಲಿಸರಿನ್',
        description:
          'ಮನೆಯಲ್ಲಿ ಬೆಳೆದ ಚೆಂಡು ಹೂ, ಎಣ್ಣೆಯಲ್ಲಿ ಅದ್ದಿ ಮತ್ತು ದಳಗಳಾಗಿ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಬಾರ್‌ನಲ್ಲಿ ಚದುರಿಸಲಾಗಿದೆ. ಸೌಮ್ಯ, ಸಿಹಿ ಪರಿಮಳ ಮತ್ತು ಸುಲಭವಾಗಿ ಕಿರಿಕಿರಿಗೊಳ್ಳುವ ಚರ್ಮಕ್ಕೆ ಸೌಮ್ಯ, ಶಾಂತಗೊಳಿಸುವ ಆರೈಕೆ.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಚೆಂಡು ಹೂ ಎಣ್ಣೆ, ಚೆಂಡು ಹೂ ದಳಗಳು, ವಿಟಮಿನ್ ಇ',
      },
    },
  },

  // ---- Goat milk bars --------------------------------------------------
  'neem-tulsi-goatmilk-soap': {
    image: `${IMG}/neem-tulsi-goatmilk-50g.png`,
    order: 7,
    price: null,
    content: {
      en: {
        name: 'Neem & Tulsi Goat Milk',
        description:
          'The same purifying neem and tulsi, carried in creamy farm goat milk. A richer, more cushioned lather with a gentle herbal scent — clarifying without leaving skin tight.',
        ingredients:
          'Goat milk soap base, Sun-dried neem, Sun-dried tulsi, Tea-tree essential oil, Vitamin E',
      },
      hi: {
        name: 'नीम और तुलसी बकरी का दूध',
        description:
          'वही शुद्ध करने वाले नीम और तुलसी, मलाईदार फार्म बकरी के दूध में। ज़्यादा घना, मुलायम झाग और हल्की जड़ी-बूटी खुशबू — त्वचा को कसे बिना साफ़ करता है।',
        ingredients:
          'बकरी का दूध साबुन बेस, धूप में सुखाया नीम, धूप में सुखाई तुलसी, टी-ट्री एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಬೇವು ಮತ್ತು ತುಳಸಿ ಮೇಕೆ ಹಾಲು',
        description:
          'ಅದೇ ಶುದ್ಧೀಕರಿಸುವ ಬೇವು ಮತ್ತು ತುಳಸಿ, ಕೆನೆಭರಿತ ಫಾರ್ಮ್ ಮೇಕೆ ಹಾಲಿನಲ್ಲಿ. ಹೆಚ್ಚು ದಟ್ಟವಾದ, ಮೃದುವಾದ ನೊರೆ ಮತ್ತು ಸೌಮ್ಯ ಗಿಡಮೂಲಿಕೆ ಪರಿಮಳ — ಚರ್ಮವನ್ನು ಬಿಗಿಗೊಳಿಸದೆ ಶುದ್ಧಗೊಳಿಸುತ್ತದೆ.',
        ingredients:
          'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಬೇವು, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ತುಳಸಿ, ಟೀ ಟ್ರೀ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'honey-and-oats-goatmilk-soap': {
    image: `${IMG}/honey-oats-goatmilk-50g.png`,
    order: 8,
    price: null,
    content: {
      en: {
        name: 'Honey & Oats Goat Milk',
        description:
          'Honey and oat flakes folded into rich goat milk. Deeply comforting, moisturising and mild — a nourishing bar for dry skin and cold-weather months.',
        ingredients: 'Goat milk soap base, Honey, Oats, Chamomile essential oil, Vitamin E',
      },
      hi: {
        name: 'शहद और ओट्स बकरी का दूध',
        description:
          'शहद और ओट्स के गुच्छे मलाईदार बकरी के दूध में। बेहद आरामदायक, नमी देने वाला और सौम्य — रूखी त्वचा और सर्दियों के महीनों के लिए पोषण देने वाला बार।',
        ingredients: 'बकरी का दूध साबुन बेस, शहद, ओट्स, कैमोमाइल एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಮೇಕೆ ಹಾಲು',
        description:
          'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಚಕ್ಕೆಗಳು ಕೆನೆಭರಿತ ಮೇಕೆ ಹಾಲಿನಲ್ಲಿ. ಆಳವಾಗಿ ಸಾಂತ್ವನ ನೀಡುವ, ತೇವಾಂಶ ಉಳಿಸುವ ಮತ್ತು ಸೌಮ್ಯ — ಒಣ ಚರ್ಮ ಮತ್ತು ಚಳಿಗಾಲದ ತಿಂಗಳುಗಳಿಗೆ ಪೋಷಣೆ ನೀಡುವ ಬಾರ್.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಜೇನು, ಓಟ್ಸ್, ಕ್ಯಾಮೊಮೈಲ್ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'ginger-rosemary-goat-milk-soap': {
    image: `${IMG}/ginger-rosemary-goat-milk-50g.png`,
    order: 9,
    price: null,
    content: {
      en: {
        name: 'Ginger & Rosemary Goat Milk',
        description:
          'Ginger and rosemary in creamy goat milk. The herbal lift of the glycerin bar, with a softer, more moisturising lather that rinses clean.',
        ingredients: 'Goat milk soap base, Ginger, Rosemary, Rosemary essential oil, Vitamin E',
      },
      hi: {
        name: 'अदरक और रोज़मेरी बकरी का दूध',
        description:
          'अदरक और रोज़मेरी मलाईदार बकरी के दूध में। ग्लिसरीन बार जैसी जड़ी-बूटी ताज़गी, पर ज़्यादा मुलायम और नमी देने वाला झाग जो साफ़ धुलता है।',
        ingredients: 'बकरी का दूध साबुन बेस, अदरक, रोज़मेरी, रोज़मेरी एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಮೇಕೆ ಹಾಲು',
        description:
          'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಕೆನೆಭರಿತ ಮೇಕೆ ಹಾಲಿನಲ್ಲಿ. ಗ್ಲಿಸರಿನ್ ಬಾರ್‌ನ ಗಿಡಮೂಲಿಕೆ ಚೈತನ್ಯ, ಆದರೆ ಮೃದುವಾದ, ಹೆಚ್ಚು ತೇವಾಂಶ ನೀಡುವ ನೊರೆ ಶುದ್ಧವಾಗಿ ತೊಳೆದುಹೋಗುತ್ತದೆ.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಶುಂಠಿ, ರೋಸ್ಮೇರಿ, ರೋಸ್ಮೇರಿ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'orange-goatmilk-soap': {
    image: `${IMG}/orange-goatmilk-50g.png`,
    order: 10,
    price: null,
    content: {
      en: {
        name: 'Orange Goat Milk',
        description:
          'Sun-dried orange peel in creamy goat milk. Bright, fresh citrus over a soft, milky lather — cheerful without being sharp.',
        ingredients: 'Goat milk soap base, Sun-dried orange peel, Orange essential oil, Vitamin E',
      },
      hi: {
        name: 'संतरा बकरी का दूध',
        description:
          'धूप में सुखाया संतरे का छिलका मलाईदार बकरी के दूध में। मुलायम, दूधिया झाग पर चमकदार, ताज़ा खट्टे-मीठे की खुशबू — तीखेपन के बिना खुशमिज़ाज।',
        ingredients: 'बकरी का दूध साबुन बेस, धूप में सुखाया संतरे का छिलका, संतरा एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕಿತ್ತಳೆ ಮೇಕೆ ಹಾಲು',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಕಿತ್ತಳೆ ಸಿಪ್ಪೆ ಕೆನೆಭರಿತ ಮೇಕೆ ಹಾಲಿನಲ್ಲಿ. ಮೃದುವಾದ, ಹಾಲಿನ ನೊರೆಯ ಮೇಲೆ ಪ್ರಕಾಶಮಾನ, ತಾಜಾ ಸಿಟ್ರಸ್ ಪರಿಮಳ — ಕಟುತ್ವವಿಲ್ಲದೆ ಉಲ್ಲಾಸಕರ.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಕಿತ್ತಳೆ ಸಿಪ್ಪೆ, ಕಿತ್ತಳೆ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'pomegranate-goatmilk-soap': {
    image: `${IMG}/pomegranate-goatmilk-50g.png`,
    order: 11,
    price: null,
    content: {
      en: {
        name: 'Pomegranate Goat Milk',
        description:
          'Sun-dried pomegranate peel in rich goat milk. Deep natural colour, a creamy lather and a subtly fruity scent that leaves skin feeling soft.',
        ingredients:
          'Goat milk soap base, Sun-dried pomegranate peel, Ylang ylang essential oil, Vitamin E',
      },
      hi: {
        name: 'अनार बकरी का दूध',
        description:
          'धूप में सुखाया अनार का छिलका समृद्ध बकरी के दूध में। गहरा प्राकृतिक रंग, मलाईदार झाग और हल्की फल जैसी खुशबू जो त्वचा को मुलायम छोड़ती है।',
        ingredients: 'बकरी का दूध साबुन बेस, धूप में सुखाया अनार का छिलका, इलंग-इलंग एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ದಾಳಿಂಬೆ ಮೇಕೆ ಹಾಲು',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ದಾಳಿಂಬೆ ಸಿಪ್ಪೆ ಸಮೃದ್ಧ ಮೇಕೆ ಹಾಲಿನಲ್ಲಿ. ಆಳವಾದ ನೈಸರ್ಗಿಕ ಬಣ್ಣ, ಕೆನೆಭರಿತ ನೊರೆ ಮತ್ತು ಚರ್ಮವನ್ನು ಮೃದುವಾಗಿಸುವ ಸೂಕ್ಷ್ಮ ಹಣ್ಣಿನ ಪರಿಮಳ.',
        ingredients:
          'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ದಾಳಿಂಬೆ ಸಿಪ್ಪೆ, ಇಲಂಗ್-ಇಲಂಗ್ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'kesar-haldi-papaya-cucumber-soap': {
    image: `${IMG}/kesar-haldi-goatmilk-50g.png`,
    order: 12,
    price: null,
    content: {
      en: {
        name: 'Kesar & Haldi',
        description:
          'Saffron and turmeric — the pair at the heart of Indian skincare ritual — in a soft, creamy bar. Warm golden colour, a quiet spiced-floral scent and a smooth finish that brightens with everyday use.',
        ingredients: 'Soap base, Turmeric, Saffron (kesar), Ylang ylang essential oil, Vitamin E',
      },
      hi: {
        name: 'केसर और हल्दी',
        description:
          'केसर और हल्दी — भारतीय त्वचा देखभाल की परंपरा का दिल — एक मुलायम, मलाईदार बार में। गर्म सुनहरा रंग, हल्की मसालेदार-पुष्प खुशबू, और एक चिकनी फ़िनिश जो रोज़ इस्तेमाल से निखार लाती है।',
        ingredients: 'साबुन बेस, हल्दी, केसर, इलंग-इलंग एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕೇಸರಿ ಮತ್ತು ಅರಿಶಿನ',
        description:
          'ಕೇಸರಿ ಮತ್ತು ಅರಿಶಿನ — ಭಾರತೀಯ ಚರ್ಮ ಆರೈಕೆ ಸಂಪ್ರದಾಯದ ಹೃದಯ — ಮೃದು, ಕೆನೆಭರಿತ ಬಾರ್‌ನಲ್ಲಿ. ಬೆಚ್ಚಗಿನ ಚಿನ್ನದ ಬಣ್ಣ, ಸೌಮ್ಯ ಮಸಾಲೆ-ಹೂವಿನ ಪರಿಮಳ, ಮತ್ತು ದಿನನಿತ್ಯದ ಬಳಕೆಯಿಂದ ಕಾಂತಿ ತರುವ ನಯವಾದ ಫಿನಿಶ್.',
        ingredients: 'ಸೋಪ್ ಬೇಸ್, ಅರಿಶಿನ, ಕೇಸರಿ, ಇಲಂಗ್-ಇಲಂಗ್ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },

  // ---- Shea butter bars ----------------------------------------------
  'honey-kesar-haldi-sheabutter-soap': {
    image: `${IMG}/honey-kesar-haldi-sheabutter-50g.png`,
    order: 13,
    price: null,
    content: {
      en: {
        name: 'Kesar & Haldi Shea Butter',
        description:
          'Saffron and turmeric in a slow-lathering shea butter bar. The most cushioning way to wear this classic Ayurvedic pairing — warm, rich and softening on the skin.',
        ingredients:
          'Shea butter soap base, Turmeric, Saffron (kesar), Frankincense essential oil, Vitamin E',
      },
      hi: {
        name: 'केसर और हल्दी शिया बटर',
        description:
          'केसर और हल्दी एक धीरे झाग बनाने वाले शिया बटर बार में। इस पारंपरिक आयुर्वेदिक जोड़ी को पहनने का सबसे कोमल तरीका — गर्म, समृद्ध और त्वचा पर मुलायम।',
        ingredients: 'शिया बटर साबुन बेस, हल्दी, केसर, लोबान एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕೇಸರಿ ಮತ್ತು ಅರಿಶಿನ ಶಿಯಾ ಬಟರ್',
        description:
          'ಕೇಸರಿ ಮತ್ತು ಅರಿಶಿನ ನಿಧಾನವಾಗಿ ನೊರೆ ಬರುವ ಶಿಯಾ ಬಟರ್ ಬಾರ್‌ನಲ್ಲಿ. ಈ ಸಾಂಪ್ರದಾಯಿಕ ಆಯುರ್ವೇದ ಜೋಡಿಯನ್ನು ಧರಿಸುವ ಅತ್ಯಂತ ಮೃದು ಮಾರ್ಗ — ಬೆಚ್ಚಗಿನ, ಸಮೃದ್ಧ ಮತ್ತು ಚರ್ಮದ ಮೇಲೆ ಮೃದು.',
        ingredients:
          'ಶಿಯಾ ಬಟರ್ ಸೋಪ್ ಬೇಸ್, ಅರಿಶಿನ, ಕೇಸರಿ, ಫ್ರ್ಯಾಂಕಿನ್ಸೆನ್ಸ್ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'sheabutter-kesar-gulab': {
    image: `${IMG}/kesar-gulab-sheabutter-50g.png`,
    order: 14,
    price: null,
    content: {
      en: {
        name: 'Kesar & Gulab Shea Butter',
        description:
          'Saffron and rose in a rich shea butter bar. Slow, creamy lather and a warm floral scent — the most indulgent soap in the range, made for unhurried baths.',
        ingredients: 'Shea butter soap base, Saffron (kesar), Rose, Rose essential oil, Vitamin E',
      },
      hi: {
        name: 'केसर और गुलाब शिया बटर',
        description:
          'केसर और गुलाब एक समृद्ध शिया बटर बार में। धीमा, मलाईदार झाग और गर्म पुष्प खुशबू — इस श्रेणी का सबसे शानदार साबुन, इत्मीनान से नहाने के लिए बना।',
        ingredients: 'शिया बटर साबुन बेस, केसर, गुलाब, गुलाब एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕೇಸರಿ ಮತ್ತು ಗುಲಾಬಿ ಶಿಯಾ ಬಟರ್',
        description:
          'ಕೇಸರಿ ಮತ್ತು ಗುಲಾಬಿ ಸಮೃದ್ಧ ಶಿಯಾ ಬಟರ್ ಬಾರ್‌ನಲ್ಲಿ. ನಿಧಾನವಾದ, ಕೆನೆಭರಿತ ನೊರೆ ಮತ್ತು ಬೆಚ್ಚಗಿನ ಹೂವಿನ ಪರಿಮಳ — ಶ್ರೇಣಿಯ ಅತ್ಯಂತ ಐಷಾರಾಮಿ ಸೋಪ್, ನಿಧಾನವಾದ ಸ್ನಾನಕ್ಕೆ ಮಾಡಲಾಗಿದೆ.',
        ingredients: 'ಶಿಯಾ ಬಟರ್ ಸೋಪ್ ಬೇಸ್, ಕೇಸರಿ, ಗುಲಾಬಿ, ಗುಲಾಬಿ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
};

// Pull the "Scent options" list out of a product's internal `notes` field,
// which is authored as: "Oils: Tea Tree (default), Eucalyptus, Lavender. ..."
export function parseScents(notes) {
  if (!notes) return [];
  const match = notes.match(/Oils?:\s*([^.]+)/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((raw) => {
      const t = raw.trim();
      const isDefault = /\(default\)/i.test(t);
      return { name: t.replace(/\s*\(default\)/i, '').trim(), isDefault };
    })
    .filter((o) => o.name);
}
