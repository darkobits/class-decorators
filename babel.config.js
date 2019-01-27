module.exports = {
  presets: [
    ['@babel/env', {
      targets: {
        browsers: ['ie >= 11'],
        node: '8.0.0'
      }
    }],
    '@babel/typescript'
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', {
      legacy: true
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-optional-catch-binding',
    ['module-resolver', {
      cwd: 'babelrc',
      root: ['./src'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    }]
  ],
  comments: false
};
