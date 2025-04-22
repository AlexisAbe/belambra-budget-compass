
const { execSync } = require('child_process');

// Initialize Husky
console.log('Setting up Husky...');
execSync('npx husky install', { stdio: 'inherit' });

// Make pre-commit hook executable
console.log('Making pre-commit hook executable...');
execSync('chmod +x .husky/pre-commit', { stdio: 'inherit' });

console.log('Husky setup complete! Pre-commit hooks are now configured.');
