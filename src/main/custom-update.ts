/* eslint-disable no-console, no-param-reassign, promise/no-nesting */
/* eslint-disable import/prefer-default-export */
import { dialog } from 'electron';
import fs from 'fs';
import {
  resolveAppPath,
  releaseApi,
  incrementVersion,
  releaseApiAuth,
} from './util';

const axios = require('axios');
const Store = require('electron-store');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');
// const AdmZip = require('adm-zip');

const store = new Store();
const zipPath = `${resolveAppPath()}html.zip`;

const onUpdateDownloaded = (mainWindow: any, updateDate: string) => {
  // const zip = new AdmZip(zipPath);
  // zip.extractAllTo(resolveAppPath(), true);
  decompress(zipPath, resolveAppPath(), {
    plugins: [decompressTargz()],
  })
    .then(() => {
      store.set('update-date', updateDate);
      // eslint-disable-next-line promise/always-return
      const newVersion = incrementVersion(store.get('app-version') || '1.0.0');
      store.set('app-version', newVersion);
      dialog
        .showMessageBox({
          type: 'info',
          title: 'Update downloaded',
          message: 'Update was downloaded successfully, please install now!',
          buttons: ['Install'],
        })
        .then(() => mainWindow.reload())
        .catch(console.error);
    })
    .catch(console.error);
};

const downloadUpdate = async (
  url: string,
  destinationPath: string,
  mainWindow: any,
  updateDate: string
) => {
  const writer = fs.createWriteStream(destinationPath, {
    flags: 'w',
    encoding: 'utf-8',
  });

  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });

    const totalSize = response.headers['content-length'];
    let downloadedSize = 0;

    response.data.on('data', (chunk: any) => {
      downloadedSize += chunk.length;
      const progress = (downloadedSize / totalSize) /** *100 */
        .toFixed(2);
      // process.stdout.cursorTo(0);
      // process.stdout.write(`Downloading... ${progress}%`);
      writer.write(chunk);
      if (mainWindow) mainWindow.setProgressBar(Number(progress));
    });

    response.data.on('end', () => {
      // process.stdout.cursorTo(0);
      setTimeout(() => onUpdateDownloaded(mainWindow, updateDate), 5000);
      writer.end();
    });
  } catch (error) {
    console.error('Error occurred while downloading file:', error);
  }
};

export const checkForUpdatesAndNotify = async (mainWindow: any) => {
  const isAuthAppEnv = store.get('appEnv') === 'auth';
  const response = await axios({
    url: isAuthAppEnv ? releaseApiAuth : releaseApi,
    method: 'get',
  });

  if (response.data?.date) {
    const lastUpdate = store.get('update-date'); // update available
    if (!lastUpdate || new Date(lastUpdate) < new Date(response.data.date)) {
      dialog
        .showMessageBox({
          type: 'info',
          title: 'Install Updates',
          message:
            'An update is available. Do you want to download and upgrade now?',
          buttons: ['Yes', 'Later'],
        })
        .then(async (buttonIndex) => {
          if (buttonIndex.response === 0) {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

            await downloadUpdate(
              response.data?.link,
              zipPath,
              mainWindow,
              response.data?.date
            );
          }
          return true;
        })
        .catch(undefined);
    }
  }
};
