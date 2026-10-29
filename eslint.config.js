import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'public', 'src/api/schema.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  prettier,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    rules: {
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either', depth: 3 }],
      // AGENTS.md › UI: no arbitrary Tailwind values; add a token to @theme in src/index.css.
      'no-restricted-syntax': [
        'error',
        ...['Literal', 'TemplateElement'].map((node) => ({
          selector: `JSXAttribute[name.name='className'] ${node}[${node === 'Literal' ? 'value' : 'value.raw'}=/[\\w:-]-\\[/]`,
          message:
            'No arbitrary Tailwind values (e.g. leading-[18px]): use a token from @theme in src/index.css or add one.',
        })),
      ],
    },
  },
);
