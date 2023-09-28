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
import { ipcMain, Notification } from 'electron';
import logger from '../logger/logger';
// @ts-expect-error
import fetch from 'node-fetch';

const axios = require('axios');
const Store = require('electron-store');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');
// const AdmZip = require('adm-zip');

const store = new Store();
const zipPath = `${resolveAppPath()}html.zip`;

const showNotification = (title: string, body: string) => {
  new Notification({ title, body }).show();
};

const onUpdateDownloaded = (mainWindow: any, updateDate: string) => {
  // const zip = new AdmZip(zipPath);
  // zip.extractAllTo(resolveAppPath(), true);
  logger.info('Extracting downloaded update...' + updateDate);
  showNotification(
    'Installing Updates',
    'Updates are being installed, it might take few minutes.'
  );
  if (mainWindow) mainWindow.setProgressBar(-1);
  fs.rmSync(`${resolveAppPath()}html`, {
    recursive: true,
    force: true,
  });
  decompress(zipPath, resolveAppPath(), {
    plugins: [decompressTargz()],
  })
    .then(() => {
      const buildType = store.get('appEnv');
      const isAuthAppEnv = buildType === 'auth';
      logger.info('Update extracted...');
      store.set(`update-date-${buildType}`, updateDate);
      // eslint-disable-next-line promise/always-return
      const newVersion = incrementVersion(
        store.get(`app-version-${buildType}`) || '1.0.0'
      );
      store.set(`app-version-${buildType}`, newVersion);
      if (isAuthAppEnv && fs.existsSync(`${resolveAppPath()}html-login`)) {
        try {
          logger.info(`Rename "html-login" directory to "html"`);
          fs.renameSync(
            `${resolveAppPath()}html-login`,
            `${resolveAppPath()}html`
          );
        } catch (error) {
          if (mainWindow) mainWindow.setProgressBar(-1);
          logger.error('Rename Error:' + JSON.stringify(error));
        }
      }

      logger.info(`Update installed succesfully... ${newVersion}`);
      dialog
        .showMessageBox({
          type: 'info',
          title: 'Updates Insalled',
          message: 'Updates are installed successfully!',
          buttons: ['OK'],
        })
        .then(() => mainWindow.reload())
        .catch(console.error);
      mainWindow.reload();
    })
    .catch((err: any) => {
      logger.error(`Update installation failed: ${err.message}`);
      logger.error(JSON.stringify(err));
    });
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
    logger.info('Start update downloading...');
    const response = await fetch(url, { timeout: 3600000 });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const totalSize = Number(response.headers.get('content-length'));
    let downloadedSize = 0;
    let progress = '';
    let error = '';
    let updateMessage = '';

    logger.info(`Update total size: ${totalSize}`);

    response.body.on('data', (chunk: any) => {
      downloadedSize += chunk.length;
      progress = ((downloadedSize / totalSize) * 100).toFixed(2);
      // process.stdout.cursorTo(0);
      // process.stdout.write(`Downloading... ${progress}%`);
      // writer.write(chunk);
      updateMessage = `Downloading Update: ${progress}`;
      logger.info(`Downloading Update: ${progress}`);
      if (mainWindow) mainWindow.setProgressBar(Number(progress) / 100);
    });

    response.body.pipe(writer);

    writer.on('finish', () => {
      // process.stdout.cursorTo(0);
      logger.info('Downloaded Update');
      updateMessage = `Downloaded Update.`;
      setTimeout(() => onUpdateDownloaded(mainWindow, updateDate), 2000);
      writer.end();
    });

    writer.on('error', (err: any) => {
      logger.info(`Error occurred while downloading: ${err.message}`);
      logger.info(`Error: ${JSON.stringify(err)}`);
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
  const buildType = store.get('appEnv');
  const isAuthAppEnv = buildType === 'auth';
  const response = await axios({
    url: isAuthAppEnv ? releaseApiAuth : releaseApi,
    method: 'get',
  });

  logger.info('Check For Updates...');
  if (response.data?.date) {
    const lastUpdate = store.get(`update-date-${buildType}`); // update available
    logger.info(`Last Update: ${lastUpdate}`);
    logger.info(
      `Update comparison ${lastUpdate} ${new Date(lastUpdate)} ${new Date(
        response.data.date
      )}
      ${new Date(lastUpdate) < new Date(response.data.date)}
      }`
    );
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
