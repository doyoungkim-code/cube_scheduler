import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // React Compiler 계열 규칙. 현재 위반은 useDayData/QuickMemo/RoutineAdherence/Calendar/useMediaQuery 의
      // "effect 안에서 로드 후 setState" 패턴(리팩토링 2단계에서 스토어로 교체)과 KanbanCard 의 ref 읽기(3단계 버그 목록)라
      // 그때까지 경고로 두고 신호만 유지한다. 해결되면 다시 error 로 올릴 것.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      // tsc 의 noUnusedLocals 가 이미 잡으므로 `_` 접두 인자만 허용
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
)
