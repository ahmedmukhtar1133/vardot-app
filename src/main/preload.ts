// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  ipcMain,
} from 'electron';

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

const addStyle = () => {
  const style = document.createElement('style');
  document.body.append(style);
  return (styleString: any) => (style.textContent = styleString);
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // remove target blank from logo anchor
    const homePageLink = document.querySelector('a[title="Home"]');
    homePageLink?.removeAttribute('target');

    // insert version
    const mainSection = document.querySelector('.region');
    const copyRight = document.querySelector('.copy-right');
    const versionEle = document.createElement('p');

    const buildType = electronHandler.store.get('appEnv');
    versionEle.innerText = `v${
      electronHandler.store.get(`app-version-${buildType}`) || '1.0.0'
    }`;
    // @ts-expect-error
    versionEle.style =
      'margin-left: 20%; font-size: 12px; font-weight: 600; color: #0072bc';
    mainSection?.insertAdjacentElement('afterend', versionEle);

    const clonedV = versionEle.cloneNode(true);
    // @ts-expect-error
    clonedV.style = 'font-size: 12px; font-weight: 600; color: #ffffff';
    // @ts-expect-error
    copyRight?.insertAdjacentElement('afterend', clonedV);

    // update notification handling dynamically
    let updateCounter = 0;
    const updateHandler = setInterval(() => {
      ipcRenderer
        .invoke('get-download-status')
        .then((response) => {
          const notificationText = document.getElementById('notification-text');
          if (!response || response?.updateMessage?.includes('Downloaded')) {
            document.getElementById('notification')?.classList.add('hide');
            return;
          }

          document.getElementById('notification')?.classList.remove('hide');
          if (notificationText)
            notificationText.innerText = response.updateMessage;
        })
        .catch((error) => {
          updateCounter++;
          if (updateCounter > 20) {
            clearInterval(updateHandler);
            document.getElementById('notification')?.classList.add('hide');
          }
        });
    }, 5000);

    document
      .querySelector('#main-content')
      ?.insertAdjacentHTML(
        'beforeend',
        `<div id="notification" class="hide"> <p id="notification-text"></p></div>`
      );

    addStyle()(`#notification {
  position: fixed;
  width: 350px;
  bottom: 0;
  right: 0;
  background: #0072bc;
  color: white;
  padding: 15px;
  z-index: 10;
  /* Rest of your styling */
}
.hide {
  display: none;
}
`);
  }, 100);
});
