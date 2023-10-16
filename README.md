# NPM Package Template

> Template for NPM packages, incorporating TypeScript and Jest.

Replace the package name and relevant registry / repository information in `package.json`.

Included workflows:
- run tests on PRs
- publish package to GitHub on release*

*Enable in repo settings: Actions > General > Workflow permissions: Read and Write permissions

## Scripts

| Script | Description |
| ------ | ----------- |
| `build` | Compiles the TypeScript source code to JavaScript and places in `build/`. |
| `test` | Runs the Jest test suite. |

## Publishing

Version bump and create a new commit and tag: `npm version <major|minor|patch>`

Push the commit and tag to GitHub: `git push --follow-tags`

Open a PR to merge the commit into `main`.

Create a release on GitHub using the new tag. This triggers the action that will publish the package to GitHub.

## Using a GitHub package

Create a personal access token with the `read:packages` scope. Unfortunately, even public packages require an authentication token to install.

Add the GitHub package registry to your `.npmrc` file, replacing `GH_PAT` with your personal access token and `GITHUB_USERNAME` with your GitHub username:

```
//npm.pkg.github.com/:_authToken=GH_PAT
@GITHUB_USERNAME:registry=https://npm.pkg.github.com
```

Install the package: `npm install @GITHUB_USERNAME/PACKAGE_NAME` from its `package.json` as normal.
