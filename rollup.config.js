import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'out/main.js',
  output: {
    file: 'out/bundle.js',
    format: 'iife',
    globals: {
      "three": "THREE"
    }
  },
  plugins: [commonjs()]
}
