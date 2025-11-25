/** @type {import("stylelint").Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // 允许 CSS Modules 中的 :global(...) 伪类
    'selector-pseudo-class-no-unknown': [
      true,
      { ignorePseudoClasses: ['global'] },
    ],
  },
};
