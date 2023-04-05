module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true
  },
  extends: 'eslint-config-standard',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    camelcase: 'off'
  }
}
