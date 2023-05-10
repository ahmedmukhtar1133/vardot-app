/* eslint import/prefer-default-export: off */
// import { URL } from 'url';
import path from 'path';

export function resolveHtmlPath() {
  if (process.env.NODE_ENV === 'development')
    return path.join(__dirname, '../../release/app/html/');
  return path.join(__dirname, '../../html/');
}
