// Utilities for accessing the Qt WebChannel dataBridge object.
// Always `await channelReady` before calling any bridge API.

type BridgeObject = any;

let bridgePromise: Promise<BridgeObject | null> | null = null;
let readyResolve: (() => void) | null = null;

/**
 * Resolves once the QWebChannel connection has been established and
 * the `dataBridge` object is available. Components must `await` this
 * before invoking any bridge API method.
 */
export const channelReady: Promise<void> = new Promise((resolve) => {
  readyResolve = resolve;
});

function getBridge(): Promise<BridgeObject | null> {
  if (!bridgePromise) {
    bridgePromise = new Promise((resolve) => {
      const w = window as any;
      const webChannelUrl = "ws://localhost:12345";
      if (w.qt && w.qt.webChannelTransport) {
        new (w as any).QWebChannel(w.qt.webChannelTransport, (channel: any) => {
          readyResolve && readyResolve();
          resolve(channel.objects.dataBridge);
        });
      } else if (webChannelUrl) {
        const socket = new WebSocket(webChannelUrl);
        socket.addEventListener("open", () => {
          new (w as any).QWebChannel(socket, (channel: any) => {
            readyResolve && readyResolve();
            resolve(channel.objects.dataBridge);
          });
        });
      } else {
        // Not running inside the desktop shell
        readyResolve && readyResolve();
        resolve(null);
      }
    });
  }
  return bridgePromise;
}

async function callBridge(method: string, ...args: any[]): Promise<any> {
  await channelReady;
  const bridge = await getBridge();
  if (!bridge || typeof bridge[method] !== "function") {
    throw new Error("Bridge not available");
  }
  return bridge[method](...args);
}

export function fetchAll() {
  return callBridge('fetchAll');
}

// export function fetchSubproject(id: number) {
//   return callBridge('getSubproject', id);
// }



// export function fetchPhase(id: number) {
//   return callBridge('getPhase', id);
// }

// export function fetchAssets() {
//   return callBridge('getAssets');
// }

// export function fetchAsset(id: number) {
//   return callBridge('getAsset', id);
// }

// export function fetchTasks() {
//   return callBridge('getTasks');
// }

// export function fetchTask(id: number) {
//   return callBridge('getTask', id);
// }

// export function fetchWorkloads() {
//   return callBridge('getWorkloads');
// }

// export function fetchWorkload(id: number) {
//   return callBridge('getWorkload', id);
// }

// export function fetchPeople() {
//   return callBridge('getPeople');
// }

// export function fetchPerson(id: number) {
//   return callBridge('getPerson', id);
// }

// export function fetchWorkcategories() {
//   return callBridge('getWorkcategories');
// }

// export function fetchWorkcategory(id: number) {
//   return callBridge('getWorkcategory', id);
// }

