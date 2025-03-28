let hasStoredOriginalContent = false;
let originalContent = new Map();

// Receive message from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "transliterate") {
    transliteratePage(request.enabledScripts);
  } else if (request.action === "reset") {
    resetPage();
  }
  sendResponse({status: "success"});
});

function transliteratePage(enabledScripts) {
  if (!hasStoredOriginalContent) {
    // Store the original page content
    storeOriginalContent(document.body);
    hasStoredOriginalContent = true;
  }
  
  // Apply transliteration to the page
  transliterateNode(document.body, enabledScripts);
}

function storeOriginalContent(node) {
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
    originalContent.set(node, node.nodeValue);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
      for (let i = 0; i < node.childNodes.length; i++) {
        storeOriginalContent(node.childNodes[i]);
      }
    }
  }
}

function transliterateNode(node, enabledScripts) {
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
    // Store original content if not already stored
    if (!originalContent.has(node)) {
      originalContent.set(node, node.nodeValue);
    }
    
    let text = node.nodeValue;
    for (const script of enabledScripts) {
      text = transliterateTextByScript(text, script);
    }
    node.nodeValue = text;
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
      for (let i = 0; i < node.childNodes.length; i++) {
        transliterateNode(node.childNodes[i], enabledScripts);
      }
    }
  }
}

function resetPage() {
  originalContent.forEach((originalValue, node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = originalValue;
    }
  });
}

// Transliteration functions for different scripts
function transliterateTextByScript(text, script) {
  switch(script) {
    case 'devanagari':
      return transliterateDevanagari(text);
    case 'bengali':
      return transliterateBengali(text);
    case 'tamil':
      return transliterateTamil(text);
    case 'telugu':
      return transliterateTelugu(text, 'telugu');
    case 'kannada':
      return transliterateKannada(text, 'kannada');
    case 'malayalam':
      return transliterateMalayalam(text);
    case 'gurmukhi':
      return transliterateGurmukhi(text);
    case 'gujarati':
      return transliterateGujarati(text);
    case 'odia':
      return transliterateOdia(text);
    case 'sinhala':
      return transliterateSinhala(text);
      default:
      return text;
  }
}

function transliterateDevanagari(text) {
    // Define mapping from Devanagari to ISO 15919
    const vowels = {
      'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū',
      'ए': 'ē', 'ऐ': 'ai', 'ओ': 'ō', 'औ': 'au', 'ऋ': 'r̥', 'ॠ': 'r̥̄',
      'ऌ': 'l̥', 'ॡ': 'l̥̄', 'ॲ': 'ê', 'ॳ': 'ô', 'ॴ': 'ôe', 'ॵ': 'ao',
      'ॶ': 'ue', 'ॷ': 'uue'
    };
    
    const consonants = {
      'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ',
      'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
      'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ',
      'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
      'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
      'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'ś', 
      'ष': 'ṣ', 'स': 's', 'ह': 'h',
      'क्ष': 'kṣ', 'त्र': 'tr', 'ज्ञ': 'jñ',
      'ख़': 'q', 'ग़': 'g', 'ज़': 'z', 'फ़': 'f', 'य़': 'y',
      'ङ': 'ng', 'ऩ': 'd', 'ड़': 'ḍ', 'ढ़': 'ṭ',
      'ॸ': 'ay', 'ॹ': 'aay', 'ॺ': 'j', 'ॻ': 'g',
      'ॼ': 'j', 'ॽ': 'g', 'ॾ': 'ḍ', 'ॿ': 'b'
    };
    
    const vowelMarks = {
      'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū',
      'े': 'ē', 'ै': 'ai', 'ो': 'ō', 'ौ': 'au', 'ृ': 'r̥', 'ॄ': 'r̥̄',
      'ॢ': 'l̥', 'ॣ': 'l̥̄'
    };
    
    const others = {
      '्': '​', 'ं': 'ṁ', 'ः': 'ḥ', 'ँ': 'ṃ',
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
      '।': '.'
    };

    const virama = '्';
    
    const scriptType = 'ie';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isDevanagariChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0900-\u097F]/.test(char); // Unicode range for Devanagari
    };

    return processText(text, scriptType, isDevanagariChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateBengali(text) {
    // Define mapping from Bengali to ISO 15919
    const vowels = {
      'অ': 'a', 'আ': 'ā', 'ই': 'i', 'ঈ': 'ī', 'উ': 'u', 'ঊ': 'ū',
      'এ': 'ē', 'ঐ': 'ai', 'ও': 'ō', 'ঔ': 'au', 'ঋ': 'r̥', 'ৠ': 'r̥̄',
      'ঌ': 'l̥', 'ৡ': 'l̥̄'
    };
    
    const consonants = {
      'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ṅ',
      'চ': 'c', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ñ',
      'ট': 'ṭ', 'ঠ': 'ṭh', 'ড': 'ḍ', 'ঢ': 'ḍh', 'ণ': 'ṇ',
      'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
      'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
      'য': 'y', 'র': 'r', 'ল': 'l', 'ব': 'v', 'শ': 'ś', 
      'ষ': 'ṣ', 'স': 's', 'হ': 'h',
      'ক্ষ': 'kṣ', 'ত্র': 'tr', 'জ্ঞ': 'jñ',
      'ৎ': 't', 'ড়': 'ṛ', 'ঢ়': 'ṛh', 'য়': 'ẏ'
    };
    
    const vowelMarks = {
      'া': 'ā', 'ি': 'i', 'ী': 'ī', 'ু': 'u', 'ূ': 'ū',
      'ে': 'ē', 'ৈ': 'ai', 'ো': 'ō', 'ৌ': 'au', 'ৃ': 'r̥', 'ৄ': 'r̥̄',
      'ৢ': 'l̥', 'ৣ': 'l̥̄'
    };
    
    const others = {
      '্': '​', 'ং': 'ṁ', 'ঃ': 'ḥ', 'ঁ': 'ṃ',
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
      '।': '.'
    };

    const virama = '্';

    const scriptType = 'ie';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isBengaliChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0980-\u09FF]/.test(char); // Unicode range for Bengali
    };

    return processText(text, scriptType, isBengaliChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateTamil(text) {
    // Define mapping from Tamil to ISO 15919
    const vowels = {
      'அ': 'a', 'ஆ': 'ā', 'இ': 'i', 'ஈ': 'ī', 'உ': 'u', 'ஊ': 'ū',
      'எ': 'e', 'ஏ': 'ē', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'ō', 'ஔ': 'au'
    };
    
    const consonants = {
      'க': 'k', 'ங': 'ṅ', 'ச': 'c', 'ஞ': 'ñ', 'ட': 'ṭ', 'ண': 'ṇ',
      'த': 't', 'ந': 'n', 'ப': 'p', 'ம': 'm', 'ய': 'y', 'ர': 'r',
      'ல': 'l', 'வ': 'v', 'ழ': 'ḻ', 'ள': 'ḷ', 'ற': 'ṟ', 'ன': 'ṉ',
      'ஜ': 'j', 'ஷ': 'ṣ', 'ஸ': 's', 'ஹ': 'h', 'க்ஷ': 'kṣ'
    };
    
    const vowelMarks = {
      'ா': 'ā', 'ி': 'i', 'ீ': 'ī', 'ு': 'u', 'ூ': 'ū',
      'ெ': 'e', 'ே': 'ē', 'ை': 'ai', 'ொ': 'o', 'ோ': 'ō', 'ௌ': 'au'
    };
    
    const others = {
      '்': '​', 'ஂ': 'ṁ', 'ஃ': 'ḥ',
      '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
      '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
      '।': '.'
    };

    const virama = '்';
    
    const scriptType = 'dr';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isTamilChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0B80-\u0BFF]/.test(char); // Unicode range for Tamil
    };

    return processText(text, scriptType, isTamilChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateTelugu(text, script) {
    // Define mapping from Telugu to ISO 15919
    const vowels = {
      'అ': 'a', 'ఆ': 'ā', 'ఇ': 'i', 'ఈ': 'ī', 'ఉ': 'u', 'ఊ': 'ū',
      'ఋ': 'r̥', 'ౠ': 'r̥̄', 'ఌ': 'l̥', 'ౡ': 'l̥̄',
      'ఎ': 'e', 'ఏ': 'ē', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'ō', 'ఔ': 'au'
    };
    
    const consonants = {
      'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ṅ',
      'చ': 'c', 'ఛ': 'ch', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ñ',
      'ట': 'ṭ', 'ఠ': 'ṭh', 'డ': 'ḍ', 'ఢ': 'ḍh', 'ణ': 'ṇ',
      'త': 't', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
      'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
      'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v', 'శ': 'ś', 
      'ష': 'ṣ', 'స': 's', 'హ': 'h',
      'క్ష': 'kṣ', 'త్ర': 'tr', 'జ్ఞ': 'jñ',
      'ళ': 'ḷ', 'ఱ': 'ṟ'
    };
    
    const vowelMarks = {
      'ా': 'ā', 'ి': 'i', 'ీ': 'ī', 'ు': 'u', 'ూ': 'ū',
      'ృ': 'r̥', 'ౄ': 'r̥̄', 'ౢ': 'l̥', 'ౣ': 'l̥̄',
      'ె': 'e', 'ే': 'ē', 'ై': 'ai', 'ొ': 'o', 'ో': 'ō', 'ౌ': 'au'
    };
    
    const others = {
      '్': '​', 'ం': 'ṁ', 'ః': 'ḥ',
      '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
      '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
      '।': '.'
    };

    const virama = '్';
    
    const scriptType = 'dr';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isTeluguChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0C00-\u0C7F]/.test(char); // Unicode range for Telugu
    };

    return processText(text, scriptType, isTeluguChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateKannada(text, script) {
    // Define mapping from Kannada to ISO 15919
    const vowels = {
      'ಅ': 'a', 'ಆ': 'ā', 'ಇ': 'i', 'ಈ': 'ī', 'ಉ': 'u', 'ಊ': 'ū',
      'ಋ': 'r̥', 'ೠ': 'r̥̄', 'ಌ': 'l̥', 'ೡ': 'l̥̄',
      'ಎ': 'e', 'ಏ': 'ē', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'ō', 'ಔ': 'au'
    };
    
    const consonants = {
      'ಕ': 'k', 'ಖ': 'kh', 'ಗ': 'g', 'ಘ': 'gh', 'ಙ': 'ṅ',
      'ಚ': 'c', 'ಛ': 'ch', 'ಜ': 'j', 'ಝ': 'jh', 'ಞ': 'ñ',
      'ಟ': 'ṭ', 'ಠ': 'ṭh', 'ಡ': 'ḍ', 'ಢ': 'ḍh', 'ಣ': 'ṇ',
      'ತ': 't', 'ಥ': 'th', 'ದ': 'd', 'ಧ': 'dh', 'ನ': 'n',
      'ಪ': 'p', 'ಫ': 'ph', 'ಬ': 'b', 'ಭ': 'bh', 'ಮ': 'm',
      'ಯ': 'y', 'ರ': 'r', 'ಲ': 'l', 'ವ': 'v', 'ಶ': 'ś', 
      'ಷ': 'ṣ', 'ಸ': 's', 'ಹ': 'h',
      'ಕ್ಷ': 'kṣ', 'ತ್ರ': 'tr', 'ಜ್ಞ': 'jñ',
      'ಳ': 'ḷ', 'ೞ': 'ḻ'
    };
    
    const vowelMarks = {
      'ಾ': 'ā', 'ಿ': 'i', 'ೀ': 'ī', 'ು': 'u', 'ೂ': 'ū',
      'ೃ': 'r̥', 'ೄ': 'r̥̄', 'ೢ': 'l̥', 'ೣ': 'l̥̄',
      'ೆ': 'e', 'ೇ': 'ē', 'ೈ': 'ai', 'ೊ': 'o', 'ೋ': 'ō', 'ೌ': 'au'
    };
    
    const others = {
      '್': '​', 'ಂ': 'ṁ', 'ಃ': 'ḥ',
      '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
      '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
      '।': '.'
    };

    const virama = '್';
    
    const scriptType = 'dr';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isKannadaChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0C80-\u0CFF]/.test(char); // Unicode range for Kannada
    };

    return processText(text, scriptType, isKannadaChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateMalayalam(text) {
    // Define mapping from Malayalam to ISO 15919
    const vowels = {
      'അ': 'a', 'ആ': 'ā', 'ഇ': 'i', 'ഈ': 'ī', 'ഉ': 'u', 'ഊ': 'ū',
      'ഋ': 'r̥', 'ൠ': 'r̥̄', 'ഌ': 'l̥', 'ൡ': 'l̥̄',
      'എ': 'e', 'ഏ': 'ē', 'ഐ': 'ai', 'ഒ': 'o', 'ഓ': 'ō', 'ഔ': 'au'
    };
    
    const consonants = {
      'ക': 'k', 'ഖ': 'kh', 'ഗ': 'g', 'ഘ': 'gh', 'ങ': 'ṅ',
      'ച': 'c', 'ഛ': 'ch', 'ജ': 'j', 'ഝ': 'jh', 'ഞ': 'ñ',
      'ട': 'ṭ', 'ഠ': 'ṭh', 'ഡ': 'ḍ', 'ഢ': 'ḍh', 'ണ': 'ṇ',
      'ത': 't', 'ഥ': 'th', 'ദ': 'd', 'ധ': 'dh', 'ന': 'n',
      'പ': 'p', 'ഫ': 'ph', 'ബ': 'b', 'ഭ': 'bh', 'മ': 'm',
      'യ': 'y', 'ര': 'r', 'ല': 'l', 'വ': 'v', 'ശ': 'ś', 
      'ഷ': 'ṣ', 'സ': 's', 'ഹ': 'h',
      'ക്ഷ': 'kṣ', 'ത്ര': 'tr', 'ജ്ഞ': 'jñ',
      'ള': 'ḷ', 'ഴ': 'ḻ', 'റ': 'ṟ'
    };
    
    const vowelMarks = {
      'ാ': 'ā', 'ി': 'i', 'ീ': 'ī', 'ു': 'u', 'ൂ': 'ū',
      'ൃ': 'r̥', 'ൄ': 'r̥̄', 'ൢ': 'l̥', 'ൣ': 'l̥̄',
      'െ': 'e', 'േ': 'ē', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'ō', 'ൌ': 'au'
    };
    
    const others = {
      '്': '​', 'ം': 'ṁ', 'ഃ': 'ḥ',
      '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4',
      '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',
      '।': '.'
    };

    const virama = '്';
    
    const scriptType = 'dr';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isMalayalamChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0D00-\u0D7F]/.test(char); // Unicode range for Malayalam
    };

    return processText(text, scriptType, isMalayalamChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateGurmukhi(text) {
    // Define mapping from Gurmukhi to ISO 15919
    const vowels = {
      'ਅ': 'a', 'ਆ': 'ā', 'ਇ': 'i', 'ਈ': 'ī', 'ਉ': 'u', 'ਊ': 'ū',
      'ਏ': 'ē', 'ਐ': 'ai', 'ਓ': 'ō', 'ਔ': 'au'
    };
    
    const consonants = {
      'ਕ': 'k', 'ਖ': 'kh', 'ਗ': 'g', 'ਘ': 'gh', 'ਙ': 'ṅ',
      'ਚ': 'c', 'ਛ': 'ch', 'ਜ': 'j', 'ਝ': 'jh', 'ਞ': 'ñ',
      'ਟ': 'ṭ', 'ਠ': 'ṭh', 'ਡ': 'ḍ', 'ਢ': 'ḍh', 'ਣ': 'ṇ',
      'ਤ': 't', 'ਥ': 'th', 'ਦ': 'd', 'ਧ': 'dh', 'ਨ': 'n',
      'ਪ': 'p', 'ਫ': 'ph', 'ਬ': 'b', 'ਭ': 'bh', 'ਮ': 'm',
      'ਯ': 'y', 'ਰ': 'r', 'ਲ': 'l', 'ਵ': 'v', 'ਸ਼': 'ś', 
      'ਸ': 's', 'ਹ': 'h',
      'ਖ਼': 'kh', 'ਗ਼': 'g', 'ਜ਼': 'z', 'ਫ਼': 'f', 'ੜ': 'ṛ'
    };
    
    const vowelMarks = {
      'ਾ': 'ā', 'ਿ': 'i', 'ੀ': 'ī', 'ੁ': 'u', 'ੂ': 'ū',
      'ੇ': 'ē', 'ੈ': 'ai', 'ੋ': 'ō', 'ੌ': 'au'
    };
    
    const others = {
      '੍': '​', 'ਂ': 'ṃ', 'ੰ': 'ṁ', 'ਃ': 'ḥ',
      '੦': '0', '੧': '1', '੨': '2', '੩': '3', '੪': '4',
      '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9',
      '।': '.'
    };

    const virama = '੍';
    
    const scriptType = 'ie';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isGurmukhiChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0A00-\u0A7F]/.test(char); // Unicode range for Gurmukhi
    };

    return processText(text, scriptType, isGurmukhiChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateGujarati(text) {
    // Define mapping from Gujarati to ISO 15919
    const vowels = {
      'અ': 'a', 'આ': 'ā', 'ઇ': 'i', 'ઈ': 'ī', 'ઉ': 'u', 'ઊ': 'ū',
      'એ': 'ē', 'ઐ': 'ai', 'ઓ': 'ō', 'ઔ': 'au', 'ઋ': 'r̥', 'ૠ': 'r̥̄',
      'ઌ': 'l̥', 'ૡ': 'l̥̄'
    };
    
    const consonants = {
      'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ઙ': 'ṅ',
      'ચ': 'c', 'છ': 'ch', 'જ': 'j', 'ઝ': 'jh', 'ઞ': 'ñ',
      'ટ': 'ṭ', 'ઠ': 'ṭh', 'ડ': 'ḍ', 'ઢ': 'ḍh', 'ણ': 'ṇ',
      'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n',
      'પ': 'p', 'ફ': 'ph', 'બ': 'b', 'ભ': 'bh', 'મ': 'm',
      'ય': 'y', 'ર': 'r', 'લ': 'l', 'વ': 'v', 'શ': 'ś', 
      'ષ': 'ṣ', 'સ': 's', 'હ': 'h',
      'ક્ષ': 'kṣ', 'ત્ર': 'tr', 'જ્ઞ': 'jñ'
    };
    
    const vowelMarks = {
      'ા': 'ā', 'િ': 'i', 'ી': 'ī', 'ુ': 'u', 'ૂ': 'ū',
      'ે': 'ē', 'ૈ': 'ai', 'ો': 'ō', 'ૌ': 'au', 'ૃ': 'r̥', 'ૄ': 'r̥̄',
      'ૢ': 'l̥', 'ૣ': 'l̥̄'
    };
    
    const others = {
      '્': '​', 'ં': 'ṁ', 'ઃ': 'ḥ', 'ઁ': 'ṃ',
      '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
      '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
      '।': '.'
    };

    const virama = '્';
    
    const scriptType = 'ie';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isGujaratiChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0A80-\u0AFF]/.test(char); // Unicode range for Gujarati
    };

    return processText(text, scriptType, isGujaratiChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateOdia(text) {
    // Define mapping from Odia to ISO 15919
    const vowels = {
      'ଅ': 'a', 'ଆ': 'ā', 'ଇ': 'i', 'ଈ': 'ī', 'ଉ': 'u', 'ଊ': 'ū',
      'ଏ': 'ē', 'ଐ': 'ai', 'ଓ': 'ō', 'ଔ': 'au', 'ଋ': 'r̥', 'ୠ': 'r̥̄',
      'ଌ': 'l̥', 'ୡ': 'l̥̄'
    };
    
    const consonants = {
      'କ': 'k', 'ଖ': 'kh', 'ଗ': 'g', 'ଘ': 'gh', 'ଙ': 'ṅ',
      'ଚ': 'c', 'ଛ': 'ch', 'ଜ': 'j', 'ଝ': 'jh', 'ଞ': 'ñ',
      'ଟ': 'ṭ', 'ଠ': 'ṭh', 'ଡ': 'ḍ', 'ଢ': 'ḍh', 'ଣ': 'ṇ',
      'ତ': 't', 'ଥ': 'th', 'ଦ': 'd', 'ଧ': 'dh', 'ନ': 'n',
      'ପ': 'p', 'ଫ': 'ph', 'ବ': 'b', 'ଭ': 'bh', 'ମ': 'm',
      'ଯ': 'y', 'ର': 'r', 'ଲ': 'l', 'ୱ': 'v', 'ଶ': 'ś', 
      'ଷ': 'ṣ', 'ସ': 's', 'ହ': 'h',
      'କ୍ଷ': 'kṣ', 'ତ୍ର': 'tr', 'ଜ୍ଞ': 'jñ',
      'ଡ଼': 'ṛ', 'ଢ଼': 'ṛh'
    };
    
    const vowelMarks = {
      'ା': 'ā', 'ି': 'i', 'ୀ': 'ī', 'ୁ': 'u', 'ୂ': 'ū',
      'େ': 'ē', 'ୈ': 'ai', 'ୋ': 'ō', 'ୌ': 'au', 'ୃ': 'r̥', 'ୄ': 'r̥̄',
      'ୢ': 'l̥', 'ୣ': 'l̥̄'
    };
    
    const others = {
      '୍': '​', 'ଂ': 'ṁ', 'ଃ': 'ḥ', 'ଁ': 'ṃ',
      '୦': '0', '୧': '1', '୨': '2', '୩': '3', '୪': '4',
      '୫': '5', '୬': '6', '୭': '7', '୮': '8', '୯': '9',
      '।': '.'
    };

    const virama = '୍';
    
    const scriptType = 'ie';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isOdiaChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0B00-\u0B7F]/.test(char); // Unicode range for Odia
    };

    return processText(text, scriptType, isOdiaChar, vowels, consonants, vowelMarks, others, virama);
}

function transliterateSinhala(text) {
    // Define mapping from Sinhala to ISO 15919
    const vowels = {
      'අ': 'a', 'ආ': 'ā', 'ඇ': 'æ', 'ඈ': 'ǣ', 'ඉ': 'i', 'ඊ': 'ī', 
      'උ': 'u', 'ඌ': 'ū', 'ඍ': 'r̥', 'ඎ': 'r̥̄', 'ඏ': 'l̥', 'ඐ': 'l̥̄',
      'එ': 'e', 'ඒ': 'ē', 'ඓ': 'ai', 'ඔ': 'o', 'ඕ': 'ō', 'ඖ': 'au'
    };
    
    const consonants = {
      'ක': 'k', 'ඛ': 'kh', 'ග': 'g', 'ඝ': 'gh', 'ඞ': 'ṅ', 'ඟ': 'ṅg',
      'ච': 'c', 'ඡ': 'ch', 'ජ': 'j', 'ඣ': 'jh', 'ඤ': 'ñ', 'ඦ': 'ñj',
      'ට': 'ṭ', 'ඨ': 'ṭh', 'ඩ': 'ḍ', 'ඪ': 'ḍh', 'ණ': 'ṇ', 'ඬ': 'ṇḍ',
      'ත': 't', 'ථ': 'th', 'ද': 'd', 'ධ': 'dh', 'න': 'n', 'ඳ': 'nd',
      'ප': 'p', 'ඵ': 'ph', 'බ': 'b', 'භ': 'bh', 'ම': 'm', 'ඹ': 'mb',
      'ය': 'y', 'ර': 'r', 'ල': 'l', 'ව': 'v', 'ශ': 'ś', 
      'ෂ': 'ṣ', 'ස': 's', 'හ': 'h', 'ළ': 'ḷ', 'ෆ': 'f'
    };
    
    const vowelMarks = {
      'ා': 'ā', 'ැ': 'æ', 'ෑ': 'ǣ', 'ි': 'i', 'ී': 'ī', 'ු': 'u', 'ූ': 'ū',
      'ෘ': 'r̥', 'ෲ': 'r̥̄', 'ෟ': 'l̥', 'ෳ': 'l̥̄',
      'ෙ': 'e', 'ේ': 'ē', 'ෛ': 'ai', 'ො': 'o', 'ෝ': 'ō', 'ෞ': 'au'
    };
    
    const others = {
      '්': '​', 'ං': 'ṁ', 'ඃ': 'ḥ', '෴': '.',
      '෦': '0', '෧': '1', '෨': '2', '෩': '3', '෪': '4',
      '෫': '5', '෬': '6', '෭': '7', '෮': '8', '෯': '9'
    };

    const virama = '්';
    
    const scriptType = 'ie';

    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    const isSinhalaChar = char => {
        return Object.keys(allChars).includes(char) || 
               char === ' ' || 
               /[\u0D80-\u0DFF]/.test(char); // Unicode range for Sinhala
    };

    return processText(text, scriptType, isSinhalaChar, vowels, consonants, vowelMarks, others, virama);
}

function processText(text, scriptType, isScriptChar, vowels, consonants, vowelMarks, others, virama) {
    // Find the word boundaries
    // Split text into words and non-word segments (like spaces, punctuation)
    const segments = [];
    let currentWord = '';
    let currentNonWord = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (isScriptChar(char) && char !== ' ' && char !== '\t' && char !== '\n') {
        // If we had collected non-word chars, push them first
        if (currentNonWord) {
          segments.push({type: 'non-word', text: currentNonWord});
          currentNonWord = '';
        }
        currentWord += char;
      } else {
        // If we had collected word chars, push them first
        if (currentWord) {
          segments.push({type: 'word', text: currentWord});
          currentWord = '';
        }
        currentNonWord += char;
      }
    }
    
    // Push any remaining segments
    if (currentWord) {
      segments.push({type: 'word', text: currentWord});
    }
    if (currentNonWord) {
      segments.push({type: 'non-word', text: currentNonWord});
    }
    
    // Process each segment
    let result = '';
    
    for (const segment of segments) {
      if (segment.type === 'non-word') {
        result += segment.text;
      } else {
        result += transliterateWord(segment.text, scriptType, vowels, consonants, vowelMarks, others, virama);
      }
    }
    
    return result;
}

// Function to transliterate a single IE word
function transliterateWord(word, scriptType, vowels, consonants, vowelMarks, others, virama) {
    if (word.length === 0) return '';
    
    let transliterated = '';
    let i = 0;
    
    while (i < word.length) {
        const char = word[i];
        const nextChar = i + 1 < word.length ? word[i + 1] : null;
        
        // Check for consonants
        if (consonants[char]) {
        // If this is a standalone consonant (single character word)
        if (word.length === 1) {
            transliterated += consonants[char] + 'a';
        } 
        // If this is the last character in the word
        else if (i === word.length - 1) {
            if (scriptType === 'dr') {
                transliterated += consonants[char] + 'a';
            }
        }
        // If followed by a vowel mark or virama, don't add 'a'
        else if (nextChar && (vowelMarks[nextChar] || nextChar === virama)) {
            transliterated += consonants[char];
        }
        // If followed by another consonant but no explicit virama
        else if (nextChar && (consonants[nextChar] || others[nextChar]) && word[i+1] !== virama) {
            transliterated += consonants[char] + 'a';
        }
        // Otherwise, this is a consonant in the middle of a word, add base form
        else {
            transliterated += consonants[char];
        }
        }
        // Check for vowels at the beginning of word
        else if (vowels[char]) {
        transliterated += vowels[char];
        }
        // Check for vowel marks
        else if (vowelMarks[char]) {
        transliterated += vowelMarks[char];
        }
        // Check for other characters
        else if (others[char]) {
        transliterated += others[char];
        }
        // If not recognized, keep as is
        else {
        transliterated += char;
        }
        
        i++;
    }
    
    return transliterated;
}