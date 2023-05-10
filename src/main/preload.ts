// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import packageJ from '../../release/app/package.json';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  store: {
    get(key: string) {
      return ipcRenderer.sendSync('electron-store-get', key);
    },
    set(property: string, val: any) {
      ipcRenderer.send('electron-store-set', property, val);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // remove target blank from logo anchor
    const homePageLink = document.querySelector('a[title="Home"]');
    homePageLink?.removeAttribute('target');

    // insert version
    const mainSection = document.querySelector('.region');
    const copyRight = document.querySelector('.copy-right');
    const versionEle = document.createElement('p');
    versionEle.innerText = `v${packageJ?.version}`;
    // @ts-expect-error
    versionEle.style =
      'margin-left: 20%; font-size: 12px; font-weight: 600; color: #0072bc';
    mainSection?.insertAdjacentElement('afterend', versionEle);

    const clonedV = versionEle.cloneNode(true);
    // @ts-expect-error
    clonedV.style = 'font-size: 12px; font-weight: 600; color: #ffffff';
    // @ts-expect-error
    copyRight?.insertAdjacentElement('afterend', clonedV);
  }, 100);
});
