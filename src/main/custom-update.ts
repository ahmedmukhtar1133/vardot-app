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
import { ipcMain } from 'electron';
import fetch from 'node-fetch';

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
    const response = await fetch(url, { timeout: 3600000 });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const totalSize = Number(response.headers.get('content-length'));
    let downloadedSize = 0;
    let progress = '';
    let error = '';
    let updateMessage = '';

    response.body.on('data', (chunk: any) => {
      downloadedSize += chunk.length;
      progress = ((downloadedSize / totalSize) * 100).toFixed(2);
      // process.stdout.cursorTo(0);
      // process.stdout.write(`Downloading... ${progress}%`);
      // writer.write(chunk);
      updateMessage = `Downloading Update: ${progress}`;
      console.log('Downloading update...', progress);
      if (mainWindow) mainWindow.setProgressBar(Number(progress) / 100);
    });

    response.body.pipe(writer);

    writer.on('finish', () => {
      // process.stdout.cursorTo(0);
      console.log('Downloaded Update');
      updateMessage = `Downloaded Update.`;
      setTimeout(() => onUpdateDownloaded(mainWindow, updateDate), 5000);
      writer.end();
    });

    writer.on('error', (err: any) => {
      updateMessage = `Error occurred while downloading: ${
        err.message
      } ${JSON.stringify(err)}`;
      console.error('Download Failed', err);
      writer.end();
    });

    ipcMain.handle('get-download-status', async (event, ...args) => {
      if (!progress) return false;
      return { progress, updateMessage, error };
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
          message: `An update is available. Do you want to download and upgrade now?\n\nUpdate size: ${response.data.size}`,
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
