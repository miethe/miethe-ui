/**
 * Babel config for Jest transforms in the @miethe/ui package.
 *
 * Uses framework-agnostic @babel/preset-* instead of next/babel so that this
 * standalone repo has no Next.js devDependency.
 * (Previously used next/babel when living in the skillmeat monorepo workspace.)
 *
 * This file is only used by Jest (via babel-jest). The production build uses
 * tsc (tsconfig.build.json) and does not read this file.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-typescript'],
  ],
};
