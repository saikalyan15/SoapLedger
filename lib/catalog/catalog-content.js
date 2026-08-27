// ---------------------------------------------------------------------------
// 50 g Soap Collection — catalogue content
//
// This file is the source of truth for the printable catalogue at /catalog.
// The page reads the live product list from the database for names, ordering
// and stock status; the customer-facing copy below (in three languages) is
// curated here so it can be proof-read and kept consistent.
//
// Copy style: plain and factual. State what is in the bar, what it looks and
// feels like, and who it suits. No marketing flourishes or unverifiable
// claims. The Hindi and Kannada copy is an AI-assisted draft — please review
// before sharing publicly.
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
    tagline: 'Handmade in small batches · Natural ingredients · Eco-friendly',
    ethosHeading: 'About our soap',
    ethosBody:
      'Healing Soil soaps are made by hand in small batches in Goa. We use natural ingredients — plant oils, sun-dried herbs and fruit peels, homegrown flowers, and goat milk sourced from verified suppliers — without SLS, parabens or synthetic fragrance. Because the bars are handmade in small batches, each one varies slightly. This collection shows every soap in its 50 g size.',
    ingredients: 'Ingredients',
    weight: '50 g bar',
    price: 'Price',
    madeIn: 'Handmade in Goa, India',
    base: {
      Glycerine: 'Glycerin bars',
      'Goat Milk': 'Goat milk bars',
      'Shea Butter': 'Shea butter bars',
      'Papaya Cucumber': 'Papaya & cucumber bars',
    },
  },
  hi: {
    coverKicker: 'हीलिंग सॉइल संग्रह',
    title: '50 ग्राम साबुन संग्रह',
    tagline: 'छोटे बैच में हस्तनिर्मित · प्राकृतिक सामग्री · पर्यावरण-अनुकूल',
    ethosHeading: 'हमारे साबुन के बारे में',
    ethosBody:
      'हीलिंग सॉइल के साबुन गोवा में छोटे-छोटे बैच में हाथ से बनाए जाते हैं। हम प्राकृतिक सामग्री का उपयोग करते हैं — वनस्पति तेल, धूप में सुखाई गई जड़ी-बूटियाँ और फलों के छिलके, घर में उगाए फूल, और सत्यापित आपूर्तिकर्ताओं से लिया गया बकरी का दूध — बिना SLS, पैराबेन या कृत्रिम सुगंध के। साबुन छोटे बैच में हाथ से बनाए जाते हैं, इसलिए हर बार थोड़ा अलग होता है। इस संग्रह में हर साबुन उसके 50 ग्राम आकार में दिखाया गया है।',
    ingredients: 'सामग्री',
    weight: '50 ग्राम बार',
    price: 'मूल्य',
    madeIn: 'भारत, गोवा में हस्तनिर्मित',
    base: {
      Glycerine: 'ग्लिसरीन बार',
      'Goat Milk': 'बकरी के दूध के बार',
      'Shea Butter': 'शिया बटर बार',
      'Papaya Cucumber': 'पपीता और खीरा बार',
    },
  },
  kn: {
    coverKicker: 'ಹೀಲಿಂಗ್ ಸಾಯಿಲ್ ಸಂಗ್ರಹ',
    title: '50 ಗ್ರಾಂ ಸೋಪ್ ಸಂಗ್ರಹ',
    tagline: 'ಸಣ್ಣ ಬ್ಯಾಚ್‌ಗಳಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗಿದೆ · ನೈಸರ್ಗಿಕ ಪದಾರ್ಥಗಳು · ಪರಿಸರ ಸ್ನೇಹಿ',
    ethosHeading: 'ನಮ್ಮ ಸೋಪಿನ ಬಗ್ಗೆ',
    ethosBody:
      'ಹೀಲಿಂಗ್ ಸಾಯಿಲ್ ಸೋಪುಗಳನ್ನು ಗೋವಾದಲ್ಲಿ ಸಣ್ಣ ಬ್ಯಾಚ್‌ಗಳಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗುತ್ತದೆ. ನಾವು ನೈಸರ್ಗಿಕ ಪದಾರ್ಥಗಳನ್ನು ಬಳಸುತ್ತೇವೆ — ಸಸ್ಯ ಎಣ್ಣೆಗಳು, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಗಿಡಮೂಲಿಕೆಗಳು ಮತ್ತು ಹಣ್ಣಿನ ಸಿಪ್ಪೆಗಳು, ಮನೆಯಲ್ಲಿ ಬೆಳೆದ ಹೂವುಗಳು, ಮತ್ತು ಪರಿಶೀಲಿಸಿದ ಪೂರೈಕೆದಾರರಿಂದ ಪಡೆದ ಮೇಕೆ ಹಾಲು — SLS, ಪ್ಯಾರಬೆನ್ ಅಥವಾ ಕೃತಕ ಸುಗಂಧವಿಲ್ಲದೆ. ಸೋಪುಗಳನ್ನು ಸಣ್ಣ ಬ್ಯಾಚ್‌ಗಳಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸುವುದರಿಂದ ಪ್ರತಿಯೊಂದೂ ಸ್ವಲ್ಪ ಭಿನ್ನವಾಗಿರುತ್ತದೆ. ಈ ಸಂಗ್ರಹದಲ್ಲಿ ಪ್ರತಿ ಸೋಪನ್ನು ಅದರ 50 ಗ್ರಾಂ ಗಾತ್ರದಲ್ಲಿ ತೋರಿಸಲಾಗಿದೆ.',
    ingredients: 'ಪದಾರ್ಥಗಳು',
    weight: '50 ಗ್ರಾಂ ಬಾರ್',
    price: 'ಬೆಲೆ',
    madeIn: 'ಭಾರತದ ಗೋವಾದಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗಿದೆ',
    base: {
      Glycerine: 'ಗ್ಲಿಸರಿನ್ ಬಾರ್‌ಗಳು',
      'Goat Milk': 'ಮೇಕೆ ಹಾಲಿನ ಬಾರ್‌ಗಳು',
      'Shea Butter': 'ಶಿಯಾ ಬಟರ್ ಬಾರ್‌ಗಳು',
      'Papaya Cucumber': 'ಪಪ್ಪಾಯಿ ಮತ್ತು ಸೌತೆಕಾಯಿ ಬಾರ್‌ಗಳು',
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
          'A clear glycerin soap with sun-dried neem and tulsi. Neem and tulsi have natural antibacterial properties, so this bar suits oily skin. Light lather.',
        ingredients: 'Glycerin soap base, Sun-dried neem, Sun-dried tulsi, Essential oil, Vitamin E',
      },
      hi: {
        name: 'नीम और तुलसी ग्लिसरीन',
        description:
          'धूप में सुखाए नीम और तुलसी के साथ एक पारदर्शी ग्लिसरीन साबुन। नीम और तुलसी में प्राकृतिक जीवाणुरोधी गुण होते हैं, इसलिए यह बार तैलीय त्वचा के लिए उपयुक्त है। हल्का झाग।',
        ingredients: 'ग्लिसरीन साबुन बेस, धूप में सुखाया नीम, धूप में सुखाई तुलसी, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಬೇವು ಮತ್ತು ತುಳಸಿ ಗ್ಲಿಸರಿನ್',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಬೇವು ಮತ್ತು ತುಳಸಿ ಇರುವ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಸೋಪ್. ಬೇವು ಮತ್ತು ತುಳಸಿಗೆ ನೈಸರ್ಗಿಕ ಬ್ಯಾಕ್ಟೀರಿಯಾ ನಿರೋಧಕ ಗುಣಗಳಿವೆ, ಆದ್ದರಿಂದ ಈ ಬಾರ್ ಎಣ್ಣೆ ಚರ್ಮಕ್ಕೆ ಸೂಕ್ತ. ಹಗುರವಾದ ನೊರೆ.',
        ingredients:
          'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಬೇವು, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ತುಳಸಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A clear glycerin soap with honey and ground oats. Mild and lightly textured; suits sensitive skin.',
        ingredients: 'Glycerin soap base, Honey, Oats, Essential oil, Vitamin E',
      },
      hi: {
        name: 'शहद और ओट्स ग्लिसरीन',
        description:
          'शहद और पिसे ओट्स के साथ एक पारदर्शी ग्लिसरीन साबुन। हल्का और हल्की बनावट वाला; संवेदनशील त्वचा के लिए उपयुक्त।',
        ingredients: 'ग्लिसरीन साबुन बेस, शहद, ओट्स, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಗ್ಲಿಸರಿನ್',
        description:
          'ಜೇನು ಮತ್ತು ಪುಡಿ ಮಾಡಿದ ಓಟ್ಸ್ ಇರುವ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಸೋಪ್. ಸೌಮ್ಯ ಮತ್ತು ಸ್ವಲ್ಪ ವಿನ್ಯಾಸವುಳ್ಳದ್ದು; ಸೂಕ್ಷ್ಮ ಚರ್ಮಕ್ಕೆ ಸೂಕ್ತ.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಜೇನು, ಓಟ್ಸ್, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A clear glycerin soap with ginger and rosemary. Herbal scent, light lather.',
        ingredients: 'Glycerin soap base, Ginger, Rosemary, Essential oil, Vitamin E',
      },
      hi: {
        name: 'अदरक और रोज़मेरी ग्लिसरीन',
        description: 'अदरक और रोज़मेरी के साथ एक पारदर्शी ग्लिसरीन साबुन। जड़ी-बूटी जैसी खुशबू, हल्का झाग।',
        ingredients: 'ग्लिसरीन साबुन बेस, अदरक, रोज़मेरी, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಗ್ಲಿಸರಿನ್',
        description:
          'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಇರುವ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಸೋಪ್. ಗಿಡಮೂಲಿಕೆ ಪರಿಮಳ, ಹಗುರವಾದ ನೊರೆ.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಶುಂಠಿ, ರೋಸ್ಮೇರಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A clear glycerin soap with sun-dried orange peel powder. Citrus scent, light lather.',
        ingredients: 'Glycerin soap base, Sun-dried orange peel, Essential oil, Vitamin E',
      },
      hi: {
        name: 'संतरा ग्लिसरीन',
        description:
          'धूप में सुखाए संतरे के छिलके के पाउडर के साथ एक पारदर्शी ग्लिसरीन साबुन। खट्टे-मीठे की खुशबू, हल्का झाग।',
        ingredients: 'ग्लिसरीन साबुन बेस, धूप में सुखाया संतरे का छिलका, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕಿತ್ತಳೆ ಗ್ಲಿಸರಿನ್',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಕಿತ್ತಳೆ ಸಿಪ್ಪೆ ಪುಡಿ ಇರುವ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಸೋಪ್. ಸಿಟ್ರಸ್ ಪರಿಮಳ, ಹಗುರವಾದ ನೊರೆ.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಕಿತ್ತಳೆ ಸಿಪ್ಪೆ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A clear glycerin soap with sun-dried, ground pomegranate peel. Deep natural colour and a lightly grainy surface.',
        ingredients: 'Glycerin soap base, Sun-dried pomegranate peel, Essential oil, Vitamin E',
      },
      hi: {
        name: 'अनार ग्लिसरीन',
        description:
          'धूप में सुखाए और पिसे अनार के छिलके के साथ एक पारदर्शी ग्लिसरीन साबुन। गहरा प्राकृतिक रंग और हल्की दानेदार सतह।',
        ingredients: 'ग्लिसरीन साबुन बेस, धूप में सुखाया अनार का छिलका, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ದಾಳಿಂಬೆ ಗ್ಲಿಸರಿನ್',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿ ಪುಡಿ ಮಾಡಿದ ದಾಳಿಂಬೆ ಸಿಪ್ಪೆ ಇರುವ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಸೋಪ್. ಆಳವಾದ ನೈಸರ್ಗಿಕ ಬಣ್ಣ ಮತ್ತು ಸ್ವಲ್ಪ ಒರಟಾದ ಮೇಲ್ಮೈ.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ದಾಳಿಂಬೆ ಸಿಪ್ಪೆ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A clear glycerin soap with homegrown marigold-infused oil and marigold petals. Mild scent.',
        ingredients:
          'Glycerin soap base, Marigold-infused oil, Marigold petals, Essential oil, Vitamin E',
      },
      hi: {
        name: 'गेंदा ग्लिसरीन',
        description:
          'घर में उगाए गेंदे से बने तेल और गेंदे की पंखुड़ियों के साथ एक पारदर्शी ग्लिसरीन साबुन। हल्की खुशबू।',
        ingredients: 'ग्लिसरीन साबुन बेस, गेंदे से बना तेल, गेंदे की पंखुड़ियाँ, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಚೆಂಡು ಹೂ ಗ್ಲಿಸರಿನ್',
        description:
          'ಮನೆಯಲ್ಲಿ ಬೆಳೆದ ಚೆಂಡು ಹೂವಿನ ಎಣ್ಣೆ ಮತ್ತು ಚೆಂಡು ಹೂವಿನ ದಳಗಳು ಇರುವ ಪಾರದರ್ಶಕ ಗ್ಲಿಸರಿನ್ ಸೋಪ್. ಸೌಮ್ಯ ಪರಿಮಳ.',
        ingredients:
          'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಚೆಂಡು ಹೂವಿನ ಎಣ್ಣೆ, ಚೆಂಡು ಹೂವಿನ ದಳಗಳು, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A goat milk soap with sun-dried neem and tulsi. Their natural antibacterial properties suit oily skin; the goat milk base gives a creamier lather than the glycerin bar.',
        ingredients: 'Goat milk soap base, Sun-dried neem, Sun-dried tulsi, Essential oil, Vitamin E',
      },
      hi: {
        name: 'नीम और तुलसी बकरी का दूध',
        description:
          'धूप में सुखाए नीम और तुलसी के साथ एक बकरी के दूध का साबुन। इनके प्राकृतिक जीवाणुरोधी गुण तैलीय त्वचा के लिए उपयुक्त हैं; बकरी के दूध का बेस ग्लिसरीन बार से ज़्यादा मलाईदार झाग देता है।',
        ingredients: 'बकरी के दूध का साबुन बेस, धूप में सुखाया नीम, धूप में सुखाई तुलसी, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಬೇವು ಮತ್ತು ತುಳಸಿ ಮೇಕೆ ಹಾಲು',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಬೇವು ಮತ್ತು ತುಳಸಿ ಇರುವ ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್. ಅವುಗಳ ನೈಸರ್ಗಿಕ ಬ್ಯಾಕ್ಟೀರಿಯಾ ನಿರೋಧಕ ಗುಣಗಳು ಎಣ್ಣೆ ಚರ್ಮಕ್ಕೆ ಸೂಕ್ತ; ಮೇಕೆ ಹಾಲಿನ ಬೇಸ್ ಗ್ಲಿಸರಿನ್ ಬಾರ್‌ಗಿಂತ ಹೆಚ್ಚು ಕೆನೆಭರಿತ ನೊರೆ ನೀಡುತ್ತದೆ.',
        ingredients:
          'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಬೇವು, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ತುಳಸಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
        description: 'A goat milk soap with honey and oats. Creamy lather; suits dry skin.',
        ingredients: 'Goat milk soap base, Honey, Oats, Essential oil, Vitamin E',
      },
      hi: {
        name: 'शहद और ओट्स बकरी का दूध',
        description:
          'शहद और ओट्स के साथ एक बकरी के दूध का साबुन। मलाईदार झाग; रूखी त्वचा के लिए उपयुक्त।',
        ingredients: 'बकरी के दूध का साबुन बेस, शहद, ओट्स, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಮೇಕೆ ಹಾಲು',
        description: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಇರುವ ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್. ಕೆನೆಭರಿತ ನೊರೆ; ಒಣ ಚರ್ಮಕ್ಕೆ ಸೂಕ್ತ.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಜೇನು, ಓಟ್ಸ್, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A goat milk soap with ginger and rosemary. Herbal scent with a creamier lather than the glycerin bar.',
        ingredients: 'Goat milk soap base, Ginger, Rosemary, Essential oil, Vitamin E',
      },
      hi: {
        name: 'अदरक और रोज़मेरी बकरी का दूध',
        description:
          'अदरक और रोज़मेरी के साथ एक बकरी के दूध का साबुन। जड़ी-बूटी जैसी खुशबू, ग्लिसरीन बार से ज़्यादा मलाईदार झाग।',
        ingredients: 'बकरी के दूध का साबुन बेस, अदरक, रोज़मेरी, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಮೇಕೆ ಹಾಲು',
        description:
          'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಇರುವ ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್. ಗಿಡಮೂಲಿಕೆ ಪರಿಮಳ, ಗ್ಲಿಸರಿನ್ ಬಾರ್‌ಗಿಂತ ಹೆಚ್ಚು ಕೆನೆಭರಿತ ನೊರೆ.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಶುಂಠಿ, ರೋಸ್ಮೇರಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A goat milk soap with sun-dried orange peel. Citrus scent, creamy lather.',
        ingredients: 'Goat milk soap base, Sun-dried orange peel, Essential oil, Vitamin E',
      },
      hi: {
        name: 'संतरा बकरी का दूध',
        description:
          'धूप में सुखाए संतरे के छिलके के साथ एक बकरी के दूध का साबुन। खट्टे-मीठे की खुशबू, मलाईदार झाग।',
        ingredients: 'बकरी के दूध का साबुन बेस, धूप में सुखाया संतरे का छिलका, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕಿತ್ತಳೆ ಮೇಕೆ ಹಾಲು',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಕಿತ್ತಳೆ ಸಿಪ್ಪೆ ಇರುವ ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್. ಸಿಟ್ರಸ್ ಪರಿಮಳ, ಕೆನೆಭರಿತ ನೊರೆ.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಕಿತ್ತಳೆ ಸಿಪ್ಪೆ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A goat milk soap with sun-dried pomegranate peel. Deep natural colour, creamy lather.',
        ingredients: 'Goat milk soap base, Sun-dried pomegranate peel, Essential oil, Vitamin E',
      },
      hi: {
        name: 'अनार बकरी का दूध',
        description:
          'धूप में सुखाए अनार के छिलके के साथ एक बकरी के दूध का साबुन। गहरा प्राकृतिक रंग, मलाईदार झाग।',
        ingredients: 'बकरी के दूध का साबुन बेस, धूप में सुखाया अनार का छिलका, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ದಾಳಿಂಬೆ ಮೇಕೆ ಹಾಲು',
        description:
          'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ದಾಳಿಂಬೆ ಸಿಪ್ಪೆ ಇರುವ ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್. ಆಳವಾದ ನೈಸರ್ಗಿಕ ಬಣ್ಣ, ಕೆನೆಭರಿತ ನೊರೆ.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ದಾಳಿಂಬೆ ಸಿಪ್ಪೆ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A soap with a papaya and cucumber base, turmeric and saffron. Warm golden colour, smooth surface, creamy lather.',
        ingredients:
          'Papaya and cucumber soap base, Turmeric, Saffron (kesar), Essential oil, Vitamin E',
      },
      hi: {
        name: 'केसर और हल्दी',
        description:
          'पपीता और खीरा बेस, हल्दी और केसर के साथ एक साबुन। गर्म सुनहरा रंग, चिकनी सतह, मलाईदार झाग।',
        ingredients: 'पपीता और खीरा साबुन बेस, हल्दी, केसर, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕೇಸರಿ ಮತ್ತು ಅರಿಶಿನ',
        description:
          'ಪಪ್ಪಾಯಿ ಮತ್ತು ಸೌತೆಕಾಯಿ ಬೇಸ್, ಅರಿಶಿನ ಮತ್ತು ಕೇಸರಿ ಇರುವ ಸೋಪ್. ಬೆಚ್ಚಗಿನ ಚಿನ್ನದ ಬಣ್ಣ, ನಯವಾದ ಮೇಲ್ಮೈ, ಕೆನೆಭರಿತ ನೊರೆ.',
        ingredients:
          'ಪಪ್ಪಾಯಿ ಮತ್ತು ಸೌತೆಕಾಯಿ ಸೋಪ್ ಬೇಸ್, ಅರಿಶಿನ, ಕೇಸರಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A shea butter soap with turmeric and saffron. Rich, slow lather; suits dry skin.',
        ingredients: 'Shea butter soap base, Turmeric, Saffron (kesar), Essential oil, Vitamin E',
      },
      hi: {
        name: 'केसर और हल्दी शिया बटर',
        description:
          'हल्दी और केसर के साथ एक शिया बटर साबुन। गाढ़ा, धीमा झाग; रूखी त्वचा के लिए उपयुक्त।',
        ingredients: 'शिया बटर साबुन बेस, हल्दी, केसर, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕೇಸರಿ ಮತ್ತು ಅರಿಶಿನ ಶಿಯಾ ಬಟರ್',
        description:
          'ಅರಿಶಿನ ಮತ್ತು ಕೇಸರಿ ಇರುವ ಶಿಯಾ ಬಟರ್ ಸೋಪ್. ಸಮೃದ್ಧ, ನಿಧಾನವಾದ ನೊರೆ; ಒಣ ಚರ್ಮಕ್ಕೆ ಸೂಕ್ತ.',
        ingredients: 'ಶಿಯಾ ಬಟರ್ ಸೋಪ್ ಬೇಸ್, ಅರಿಶಿನ, ಕೇಸರಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
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
          'A shea butter soap with saffron and rose. Rich, slow lather; suits dry skin.',
        ingredients: 'Shea butter soap base, Saffron (kesar), Rose, Essential oil, Vitamin E',
      },
      hi: {
        name: 'केसर और गुलाब शिया बटर',
        description:
          'केसर और गुलाब के साथ एक शिया बटर साबुन। गाढ़ा, धीमा झाग; रूखी त्वचा के लिए उपयुक्त।',
        ingredients: 'शिया बटर साबुन बेस, केसर, गुलाब, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕೇಸರಿ ಮತ್ತು ಗುಲಾಬಿ ಶಿಯಾ ಬಟರ್',
        description:
          'ಕೇಸರಿ ಮತ್ತು ಗುಲಾಬಿ ಇರುವ ಶಿಯಾ ಬಟರ್ ಸೋಪ್. ಸಮೃದ್ಧ, ನಿಧಾನವಾದ ನೊರೆ; ಒಣ ಚರ್ಮಕ್ಕೆ ಸೂಕ್ತ.',
        ingredients: 'ಶಿಯಾ ಬಟರ್ ಸೋಪ್ ಬೇಸ್, ಕೇಸರಿ, ಗುಲಾಬಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
};
