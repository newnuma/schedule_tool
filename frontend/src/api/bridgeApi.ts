
// Utilities for accessing the Qt WebChannel dataBridge object.
// Always `await channelReady` before calling any bridge API.

import { IAsset, ITask ,IPhase, IPMMWorkload, IPersonWorkload} from "../context/AppContext";

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
  getBridge()
});

function getBridge(): Promise<BridgeObject | null> {
  if (!bridgePromise) {
    bridgePromise = new Promise((resolve) => {
      const w = window as any;
      const webChannelUrl =
        process.env.REACT_APP_WEBCHANNEL_URL || "ws://localhost:12345";
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
        socket.addEventListener("message", (ev) => {
          console.log("WS message", ev.data);
        });
        socket.addEventListener("error", (err) => {
          console.error("WebSocket error", err);
        });
        socket.addEventListener("close", () => {
          console.log("WebSocket closed");
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
    console.warn(`Bridge not available or method not found: ${method}`);
    return {};
  }
  return bridge[method](...args);
}

// Initial bulk load: steps + data for all three pages
export function initLoad() {
  console.log("call initLoad");
  return callBridge('initLoad');
}

export function fetchDistributePage() {
  console.log("call fetchDistributePage");
  return callBridge('fetchDistributePage');
}

export function fetchProjectPage(id: number) {
  console.log("call fetchProjectPage", id);
  return callBridge('fetchProjectPage', id);
}

export function fetchAssignmentPage(startIso: string, endIso: string) {
  console.log("call fetchAssignmentPage", startIso, endIso);
  return callBridge('fetchAssignmentPage', startIso, endIso);
}

export function fetchAssignmentTasks(startIso: string, endIso: string) {
  console.log("call fetchAssignmentTasks", startIso, endIso);
  return callBridge('fetchAssignmentTasks', startIso, endIso);
}

export function fetchAssignmentWorkloads(startIso: string, endIso: string) {
  console.log("call fetchAssignmentWorkloads", startIso, endIso);
  return callBridge('fetchAssignmentWorkloads', startIso, endIso);
}

export function fetchSteps() {
  console.log("call fetchSteps");
  return callBridge('fetchSteps');
}

export function createEntity(data: Partial<IAsset | IPhase | ITask | IPersonWorkload | IPMMWorkload>) {
  const dataStr = JSON.stringify(data);
  return callBridge('createEntity', dataStr).then((res) => {
    if (res && res.error) {
      throw new Error(res.message || 'DB Error');
    }
    return res;
  });
}

export function updateEntity(id: number, data: Partial<IAsset | IPhase | ITask | IPersonWorkload | IPMMWorkload >) {
  const dataStr = JSON.stringify(data);
  return callBridge('updateEntity', id, dataStr).then((res) => {
    if (res && res.error) {
      throw new Error(res.message || 'DB Error');
    }
    return res;
  });
}

export function deleteEntity(type: string, id: number) {
  return callBridge('deleteEntity', type, id).then((res) => {
    if (res && res.error) {
      throw new Error(res.message || 'DB Error');
    }
    return res;
  });
}

export async function createEntities<T extends object>(dataArr: Partial<T>[]): Promise<T[]> {
  console.log("call createEntities", dataArr);
  const dataStr = JSON.stringify(dataArr);
  return callBridge('createEntities', dataStr);
}

// Bulk update: 配列で一括更新
// Bulk update: 配列で一括更新（bridgeの一括APIを呼ぶ）
export async function updateEntities<T extends { id: number }>(dataArr: Partial<T>[]): Promise<T[]> {
  console.log("call updateEntities", dataArr);
  const dataStr = JSON.stringify(dataArr);
  return callBridge('updateEntities', dataStr);
}