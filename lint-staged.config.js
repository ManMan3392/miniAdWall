// lint-staged.config.js
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix'],
  '*.{css,scss,sass,less}': ['stylelint --fix'],
  '*.{js,jsx,ts,tsx,css,scss,md,json}': ['prettier --write'],
};
