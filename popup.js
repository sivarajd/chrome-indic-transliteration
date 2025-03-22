document.addEventListener('DOMContentLoaded', function() {
  // Load saved preferences
  chrome.storage.sync.get(['enabledScripts'], function(result) {
    if (result.enabledScripts) {
      for (const script of result.enabledScripts) {
        const checkbox = document.getElementById(script);
        if (checkbox) checkbox.checked = true;
      }
    }
  });

  document.getElementById('transliterate').addEventListener('click', function() {
    // Get all selected scripts
    const scriptCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const enabledScripts = Array.from(scriptCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    // Save preferences
    chrome.storage.sync.set({ enabledScripts: enabledScripts });
    
    // Apply transliteration
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: transliteratePage,
        args: [enabledScripts]
      });
    });
  });
  
  document.getElementById('reset').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: resetPage
      });
    });
  });
});

function transliteratePage(enabledScripts) {
  // This function will be injected into the page
  const originalContent = new Map();
  
  if (!window.hasStoredOriginalContent) {
    // Store the original page content
    storeOriginalContent(document.body);
    window.hasStoredOriginalContent = true;
  }
  
  // Apply transliteration to the page
  transliterateNode(document.body, enabledScripts);
  
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
  
  // Preserve original content for resetting
  window.originalContent = originalContent;
}

function resetPage() {
  // Reset the page to its original content
  if (window.originalContent) {
    window.originalContent.forEach((originalValue, node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.nodeValue = originalValue;
      }
    });
  }
}
