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
    
    // Combine all character mappings for lookup
    const allChars = {...vowels, ...consonants, ...vowelMarks, ...others};
    
    // Find the word boundaries
    // Split text into words and non-word segments (like spaces, punctuation)
    const segments = [];
    let currentWord = '';
    let currentNonWord = '';
    
    const isDevanagariChar = char => {
      return Object.keys(allChars).includes(char) || 
             char === ' ' || 
             /[\u0900-\u097F]/.test(char); // Unicode range for Devanagari
    };
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (isDevanagariChar(char) && char !== ' ' && char !== '\t' && char !== '\n') {
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
        result += transliterateIEWord(segment.text);
      }
    }
    
    return result;
    
    // Function to transliterate a single Devanagari word
    function transliterateIEWord(word) {
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
        //   else if (i === word.length - 1) {
        //     transliterated += consonants[char] + 'a';
        //   }
          // If followed by a vowel mark or virama, don't add 'a'
          else if (nextChar && (vowelMarks[nextChar] || nextChar === '्')) {
            transliterated += consonants[char];
          }
          // If followed by another consonant but no explicit virama
          else if (nextChar && consonants[nextChar] && word[i+1] !== '्') {
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
}
// Placeholder functions for other scripts
// These would need proper implementation similar to the Devanagari function
function transliterateBengali(text) {
  // Bengali to ISO 15919 mapping would go here
  return text; // Placeholder
}

function transliterateTamil(text) {
  // Tamil to ISO 15919 mapping would go here
  return text; // Placeholder
}

function transliterateTelugu(text, script) {
  // Telugu/Kannada to ISO 15919 mapping would go here
  return text; // Placeholder
}

function transliterateKannada(text, script) {
    // Telugu/Kannada to ISO 15919 mapping would go here
    return text; // Placeholder
  }
  
  function transliterateMalayalam(text) {
  // Malayalam to ISO 15919 mapping would go here
  return text; // Placeholder
}

function transliterateGurmukhi(text) {
  // Gurmukhi to ISO 15919 mapping would go here
  return text; // Placeholder
}

function transliterateGujarati(text) {
  // Gujarati to ISO 15919 mapping would go here
  return text; // Placeholder
}

function transliterateOdia(text) {
  // Odia to ISO 15919 mapping would go here
  return text; // Placeholder
}
