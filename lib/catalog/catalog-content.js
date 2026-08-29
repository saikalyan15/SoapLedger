// ---------------------------------------------------------------------------
// Soap catalogue content — the printable catalogue at /catalog.
//
// The page reads the live product list from the database for names, ordering
// and stock status. The customer-facing copy below (English, Hindi, Kannada)
// is curated here so it can be proof-read and kept consistent.
//
// Rules the owner has set for this copy:
//   - Goat milk is bought from verified suppliers. There are NO goats on the
//     farm. Never write "farm goat milk".
//   - Ginger is organically sourced ginger powder, not fresh ginger.
//   - Oats are just oats, not "stone-ground".
//   - The essential oil changes from soap to soap, so it is listed generically
//     ("Essential oil") and the scent is NOT described anywhere.
//   - Kesar & Haldi is on a papaya & cucumber base (it used to be goat milk,
//     which is why the photo file is still named "goatmilk").
//   - Red Rose is a 50 g square on a red wine soap base.
//   - Every description is self-contained. No comparisons to other soaps, no
//     "the same as...", no reading order assumed.
//   - State only facts: what base it is made on and what is in it. No lather,
//     texture or skin-type claims. Colour is fine where it is plainly visible.
//   - No marketing filler, no em dashes, no invented detail. When unsure, ask.
//
// A soap appears in the catalogue only if its `slug` has an entry in
// CATALOG_PRODUCTS. Scope right now: 6 soaps.
// ---------------------------------------------------------------------------

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export const UI = {
  en: {
    coverKicker: 'Healing Soil',
    title: 'Soap Catalogue',
    tagline: 'Handmade in Goa · Small batches · Natural ingredients',
    ethosHeading: 'About our soap',
    ethosBody:
      'Healing Soil soaps are made by hand in Goa, in small batches. We use simple, natural ingredients: plant oils, herbs, fruit peels and flowers, plus goat milk that we buy from verified suppliers. No SLS, no parabens, no synthetic fragrance. Because we make them by hand, each batch comes out a little different.',
    ingredients: 'Ingredients',
    weight: '50 g bar',
    price: 'Price',
    madeIn: 'Handmade in Goa, India',
  },
  hi: {
    coverKicker: 'हीलिंग सॉइल',
    title: 'साबुन कैटलॉग',
    tagline: 'गोवा में हस्तनिर्मित · छोटे बैच · प्राकृतिक सामग्री',
    ethosHeading: 'हमारे साबुन के बारे में',
    ethosBody:
      'हीलिंग सॉइल के साबुन गोवा में, छोटे बैच में, हाथ से बनाए जाते हैं। हम सरल, प्राकृतिक सामग्री का इस्तेमाल करते हैं: वनस्पति तेल, जड़ी-बूटियाँ, फलों के छिलके और फूल, साथ ही बकरी का दूध जो हम सत्यापित आपूर्तिकर्ताओं से खरीदते हैं। कोई SLS नहीं, कोई पैराबेन नहीं, कोई कृत्रिम सुगंध नहीं। हाथ से बनाने की वजह से हर बैच थोड़ा अलग बनता है।',
    ingredients: 'सामग्री',
    weight: '50 ग्राम बार',
    price: 'मूल्य',
    madeIn: 'भारत, गोवा में हस्तनिर्मित',
  },
  kn: {
    coverKicker: 'ಹೀಲಿಂಗ್ ಸಾಯಿಲ್',
    title: 'ಸೋಪ್ ಕ್ಯಾಟಲಾಗ್',
    tagline: 'ಗೋವಾದಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗಿದೆ · ಸಣ್ಣ ಬ್ಯಾಚ್‌ಗಳು · ನೈಸರ್ಗಿಕ ಪದಾರ್ಥಗಳು',
    ethosHeading: 'ನಮ್ಮ ಸೋಪಿನ ಬಗ್ಗೆ',
    ethosBody:
      'ಹೀಲಿಂಗ್ ಸಾಯಿಲ್ ಸೋಪುಗಳನ್ನು ಗೋವಾದಲ್ಲಿ, ಸಣ್ಣ ಬ್ಯಾಚ್‌ಗಳಲ್ಲಿ, ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗುತ್ತದೆ. ನಾವು ಸರಳ, ನೈಸರ್ಗಿಕ ಪದಾರ್ಥಗಳನ್ನು ಬಳಸುತ್ತೇವೆ: ಸಸ್ಯ ಎಣ್ಣೆಗಳು, ಗಿಡಮೂಲಿಕೆಗಳು, ಹಣ್ಣಿನ ಸಿಪ್ಪೆಗಳು ಮತ್ತು ಹೂವುಗಳು, ಜೊತೆಗೆ ಪರಿಶೀಲಿಸಿದ ಪೂರೈಕೆದಾರರಿಂದ ನಾವು ಖರೀದಿಸುವ ಮೇಕೆ ಹಾಲು. SLS ಇಲ್ಲ, ಪ್ಯಾರಬೆನ್ ಇಲ್ಲ, ಕೃತಕ ಸುಗಂಧ ಇಲ್ಲ. ಕೈಯಿಂದ ಮಾಡುವುದರಿಂದ ಪ್ರತಿ ಬ್ಯಾಚ್ ಸ್ವಲ್ಪ ಭಿನ್ನವಾಗಿ ಬರುತ್ತದೆ.',
    ingredients: 'ಪದಾರ್ಥಗಳು',
    weight: '50 ಗ್ರಾಂ ಬಾರ್',
    price: 'ಬೆಲೆ',
    madeIn: 'ಭಾರತದ ಗೋವಾದಲ್ಲಿ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗಿದೆ',
  },
};

const IMG = '/50g-soap-squares/images';

export const CATALOG_PRODUCTS = {
  'honey-oats-glycerin-soap': {
    image: `${IMG}/honey-oats-glycerin-50g.png`,
    order: 1,
    price: 125,
    content: {
      en: {
        name: 'Honey & Oats Glycerin',
        description: 'A glycerin soap made with honey and oats.',
        ingredients: 'Glycerin soap base, Honey, Oats, Essential oil, Vitamin E',
      },
      hi: {
        name: 'शहद और ओट्स ग्लिसरीन',
        description: 'शहद और ओट्स के साथ बना एक ग्लिसरीन साबुन।',
        ingredients: 'ग्लिसरीन साबुन बेस, शहद, ओट्स, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಗ್ಲಿಸರಿನ್',
        description: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಜೊತೆ ಮಾಡಿದ ಗ್ಲಿಸರಿನ್ ಸೋಪ್.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಜೇನು, ಓಟ್ಸ್, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'honey-and-oats-goatmilk-soap': {
    image: `${IMG}/honey-oats-goatmilk-50g.png`,
    order: 2,
    price: 150,
    content: {
      en: {
        name: 'Honey & Oats Goat Milk',
        description: 'A goat milk soap made with honey and oats.',
        ingredients: 'Goat milk soap base, Honey, Oats, Essential oil, Vitamin E',
      },
      hi: {
        name: 'शहद और ओट्स बकरी का दूध',
        description: 'शहद और ओट्स के साथ बना एक बकरी के दूध का साबुन।',
        ingredients: 'बकरी के दूध का साबुन बेस, शहद, ओट्स, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಮೇಕೆ ಹಾಲು',
        description: 'ಜೇನು ಮತ್ತು ಓಟ್ಸ್ ಜೊತೆ ಮಾಡಿದ ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಜೇನು, ಓಟ್ಸ್, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'ginger-rosemary-glycerin-soap': {
    image: `${IMG}/ginger-rosemary-glycerin-50g.png`,
    order: 3,
    price: 125,
    content: {
      en: {
        name: 'Ginger & Rosemary Glycerin',
        description:
          'A glycerin soap made with organically sourced ginger powder and rosemary.',
        ingredients: 'Glycerin soap base, Ginger powder, Rosemary, Essential oil, Vitamin E',
      },
      hi: {
        name: 'अदरक और रोज़मेरी ग्लिसरीन',
        description: 'जैविक रूप से मंगाए गए अदरक पाउडर और रोज़मेरी के साथ बना एक ग्लिसरीन साबुन।',
        ingredients: 'ग्लिसरीन साबुन बेस, अदरक पाउडर, रोज़मेरी, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಗ್ಲಿಸರಿನ್',
        description:
          'ಸಾವಯವವಾಗಿ ತರಿಸಿದ ಶುಂಠಿ ಪುಡಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಜೊತೆ ಮಾಡಿದ ಗ್ಲಿಸರಿನ್ ಸೋಪ್.',
        ingredients: 'ಗ್ಲಿಸರಿನ್ ಸೋಪ್ ಬೇಸ್, ಶುಂಠಿ ಪುಡಿ, ರೋಸ್ಮೇರಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'ginger-rosemary-goat-milk-soap': {
    image: `${IMG}/ginger-rosemary-goat-milk-50g.png`,
    order: 4,
    price: 150,
    content: {
      en: {
        name: 'Ginger & Rosemary Goat Milk',
        description:
          'A goat milk soap made with organically sourced ginger powder and rosemary.',
        ingredients: 'Goat milk soap base, Ginger powder, Rosemary, Essential oil, Vitamin E',
      },
      hi: {
        name: 'अदरक और रोज़मेरी बकरी का दूध',
        description:
          'जैविक रूप से मंगाए गए अदरक पाउडर और रोज़मेरी के साथ बना एक बकरी के दूध का साबुन।',
        ingredients: 'बकरी के दूध का साबुन बेस, अदरक पाउडर, रोज़मेरी, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಶುಂಠಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಮೇಕೆ ಹಾಲು',
        description:
          'ಸಾವಯವವಾಗಿ ತರಿಸಿದ ಶುಂಠಿ ಪುಡಿ ಮತ್ತು ರೋಸ್ಮೇರಿ ಜೊತೆ ಮಾಡಿದ ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್.',
        ingredients: 'ಮೇಕೆ ಹಾಲಿನ ಸೋಪ್ ಬೇಸ್, ಶುಂಠಿ ಪುಡಿ, ರೋಸ್ಮೇರಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'kesar-haldi-papaya-cucumber-soap': {
    image: `${IMG}/kesar-haldi-goatmilk-50g.png`,
    order: 5,
    price: 150,
    content: {
      en: {
        name: 'Kesar & Haldi',
        description:
          'A soap made on a papaya and cucumber base, with turmeric and saffron. It has a golden colour.',
        ingredients:
          'Papaya and cucumber soap base, Turmeric, Saffron (kesar), Essential oil, Vitamin E',
      },
      hi: {
        name: 'केसर और हल्दी',
        description: 'पपीता और खीरा बेस पर हल्दी और केसर के साथ बना एक साबुन। इसका रंग सुनहरा होता है।',
        ingredients: 'पपीता और खीरा साबुन बेस, हल्दी, केसर, एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ಕೇಸರಿ ಮತ್ತು ಅರಿಶಿನ',
        description:
          'ಪಪ್ಪಾಯಿ ಮತ್ತು ಸೌತೆಕಾಯಿ ಬೇಸ್ ಮೇಲೆ ಅರಿಶಿನ ಮತ್ತು ಕೇಸರಿ ಜೊತೆ ಮಾಡಿದ ಸೋಪ್. ಇದು ಚಿನ್ನದ ಬಣ್ಣದ್ದು.',
        ingredients: 'ಪಪ್ಪಾಯಿ ಮತ್ತು ಸೌತೆಕಾಯಿ ಸೋಪ್ ಬೇಸ್, ಅರಿಶಿನ, ಕೇಸರಿ, ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
  'red-rose-soap': {
    image: `${IMG}/red-rose-50g.png`,
    order: 6,
    price: 125,
    content: {
      en: {
        name: 'Red Rose',
        description:
          'A soap made on a red wine soap base, with rose essential oil. It has a deep red colour.',
        ingredients: 'Red wine soap base, Rose essential oil, Vitamin E',
      },
      hi: {
        name: 'रेड रोज़',
        description:
          'रेड वाइन साबुन बेस पर गुलाब एसेंशियल ऑयल के साथ बना एक साबुन। इसका रंग गहरा लाल होता है।',
        ingredients: 'रेड वाइन साबुन बेस, गुलाब एसेंशियल ऑयल, विटामिन ई',
      },
      kn: {
        name: 'ರೆಡ್ ರೋಸ್',
        description:
          'ರೆಡ್ ವೈನ್ ಸೋಪ್ ಬೇಸ್ ಮೇಲೆ ಗುಲಾಬಿ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್ ಜೊತೆ ಮಾಡಿದ ಸೋಪ್. ಇದು ಗಾಢ ಕೆಂಪು ಬಣ್ಣದ್ದು.',
        ingredients: 'ರೆಡ್ ವೈನ್ ಸೋಪ್ ಬೇಸ್, ಗುಲಾಬಿ ಎಸೆನ್ಷಿಯಲ್ ಆಯಿಲ್, ವಿಟಮಿನ್ ಇ',
      },
    },
  },
};
