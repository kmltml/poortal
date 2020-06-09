import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'out/main.js',
  output: {
    file: 'out/bundle.js',
    format: 'iife',
    name: "poortal",
    globals: {
      "three": "THREE",
      "@cocos/cannon": "CANNON"
    }
  },
  plugins: [commonjs()]
}
