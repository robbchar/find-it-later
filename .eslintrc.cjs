module.exports = {
  root: true,
  extends: ["universe/native", "universe/shared/typescript-analysis", "prettier"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["node_modules/", "dist/", "coverage/"],
};
