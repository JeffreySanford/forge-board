module.exports = {
  // ...existing code...
  
  plugins: [
    // ...existing plugins...
    'eslint-rules'
  ],
  
  rules: {
    // ...existing code...
    
    // Use our custom rules with the correct plugin prefix
    'eslint-rules/socket-cleanup-rule': 'error',
    'eslint-rules/require-non-standalone-components': 'error',
    
    // Disable the old plugin-based rule if it exists
    'require-socket-cleanup/ngondestroy-socket-disconnect': 'off'
  },
  
  settings: {
    'eslint-rules': {
      directory: './eslint-rules'
    }
  }
};