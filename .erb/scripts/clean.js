import rimraf from 'rimraf';
import fs from 'fs';
import path from 'path';
import webpackPaths from '../configs/webpack.paths';

const appBuildFile = path.join(webpackPaths.releasePath, 'BUILD_TYPE.txt');

const foldersToRemove = [
  webpackPaths.distPath,
  webpackPaths.buildPath,
  webpackPaths.dllPath,
  webpackPaths.htmlPath,
];

foldersToRemove.forEach((folder) => {
  if (fs.existsSync(folder)) rimraf.sync(folder);
});

if (
  !fs.existsSync(webpackPaths.htmlLoggedInPath) ||
  !fs.existsSync(webpackPaths.htmlLoggedOutPath)
) {
  throw new Error(`Please make sure following directories exist at release path before making new build:
  1. htmlLoggedIn
  2. htmlLoggedOut
  Release path: ${webpackPaths.releasePath}`);
  return;
}

if (process.argv[3] === 'auth') {
  fs.writeFileSync(appBuildFile, process.argv[3]);
  fs.cpSync(webpackPaths.htmlLoggedInPath, webpackPaths.htmlPath, {
    recursive: true,
  });
  return;
}

fs.writeFileSync(appBuildFile, 'loggedOut');
fs.cpSync(webpackPaths.htmlLoggedOutPath, webpackPaths.htmlPath, {
  recursive: true,
});
