/* eslint import/prefer-default-export: off */
// import { URL } from 'url';
import path from 'path';
import fs from 'fs';

export const releaseApi =
  'https://development-q5nzhaa-3cez2wngsbbr2.fr-3.platformsh.site/sites/default/files/offline-app/offline.json';
export const releaseApiAuth =
  'https://development-q5nzhaa-3cez2wngsbbr2.fr-3.platformsh.site/sites/default/files/offline-app/login-offline.json';

export function resolveHtmlPath() {
  if (process.env.NODE_ENV === 'development')
    return path.join(__dirname, '../../release/html/'); // inside release directory
  return path.join(__dirname, '../../../release/html/'); // inside resources/release/html
}

export function resolveAppPath() {
  if (process.env.NODE_ENV === 'development')
    return path.join(__dirname, '../../release/');
  return path.join(__dirname, '../../../release/');
}

export function getBuildType() {
  const buildFilePath = path.join(resolveAppPath(), 'BUILD_TYPE.txt');
  const buildType = fs.readFileSync(buildFilePath);
  return buildType.toString()?.trim();
}

export function incrementVersion(currentVersion: string) {
  const [main, major, minor] = currentVersion.split('.');
  const newMinor = Number(minor) + 1;
  if (newMinor > 9) {
    const newMajor = Number(major) + 1;
    if (newMajor > 9) {
      const newMain = Number(main) + 1;
      return `${newMain}.0.0`;
    }
    return `${main}.${newMajor}.0`;
  }
  return `${main}.${major}.${newMinor}`;
}
