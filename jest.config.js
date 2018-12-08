// This allows using jest from the root of the repo
//
module.exports = {
  preset: "ts-jest",
  testMatch: ["**/?(*.)test.ts"],
  roots: [
    'packages/',
  ],
  verbose: true,
}
