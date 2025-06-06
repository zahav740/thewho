// Force browser mode, disable Electron 
window.isElectron = false; 
window.electronAPI = null; 
// Prevent native callback errors 
if (typeof window !== 'undefined') { 
  window.require = function() { 
    console.warn('Electron require called in browser mode - operation prevented'); 
    return null; 
  }; 
} 
