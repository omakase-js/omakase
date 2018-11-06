module.exports = function(wallaby) {
  return {
    files: [
      "tsconfig.json",
      "packages/*/src/**/*.ts?(x)",
      "packages/*/src/**/*.snap",
      "packages/*/src/**/*.json",
      "!packages/*/src/**/*.test.ts?(x)",
      '!packages/**/node_modules/**'
    ],
    tests: [
      "packages/*/src/**/*.test.ts?(x)",
      '!packages/**/node_modules/**'
    ],

    env: {
      type: "node",
      runner: "node",
    },

    testFramework: "jest",
  }
}
