# sudoku-js
Sudoku solver and generator module for Nodejs or Browser.

## Scripts

| Command | Description |
| ------ | ----------- |
| `test` | Yay tests. |
| `generateConfigs` | Generate full sudoku grids. |
| `generatePuzzles` | Generate sudoku puzzles. |
| `solve` | Find all solutions for a given grid. |
| `generateSieve` | Generate unavoidable sets for a given full grid. |
| `fingerprint` | Generates a fingerprint* for a given full grid. |

\* _**fingerprints**_ are a kind of hash for a full grid. They are designed to remain the same regardless of how the grid is manipulated per symmetry-preserving operations, i.e.:
  - digit-swapping
  - reflection
  - rotation
  - band swap
  - stack swap
  - row swap within a band
  - column swap within a stack

## Installing

Reference: [GitHub docs related to packages](https://docs.github.com/en/packages/learn-github-packages/installing-a-package)

Packages installed via GitHub Packages require authentication to install.

1. Create a personal access token with the `read:packages` scope.
2. Add the GitHub package registry to a `.npmrc` file in your project like below, replacing `GH_PAT` with your PAT:
```
//npm.pkg.github.com/:_authToken=GH_PAT
@metal-pony:registry=https://npm.pkg.github.com
```
3. Then install in your project as normal:
```
npm install @metal-pony/sudoku-js
```
Do not commit your `.npmrc` file. Keep your access token secret.
