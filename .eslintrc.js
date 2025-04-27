module.exports = {
  // Keep existing configurations
  
  plugins: [
    // ...existing plugins
    'eslint-plugin-forge' // Use the full plugin name
  ],
  
  rules: {
    // ...existing rules
    
    // Use the correct rule names with plugin prefix
    'eslint-plugin-forge/socket-cleanup-rule': 'error',
    'eslint-plugin-forge/require-non-standalone-components': 'error',
    
    // Disable the old rule
    'require-socket-cleanup/ngondestroy-socket-disconnect': 'off',
    'socket-cleanup-rule': 'off'
  }
};