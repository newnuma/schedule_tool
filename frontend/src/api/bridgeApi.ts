import { useEffect } from "react";
import { useAppContext } from "../context/AppContext";
type BridgeObject = any;

let bridgePromise: Promise<BridgeObject> | null = null;

function getBridge(): Promise<BridgeObject> {
  if (!bridgePromise) {
    bridgePromise = new Promise((resolve) => {
      const w = window as any;
      if (w.qt && w.qt.webChannelTransport) {
        new (w as any).QWebChannel(w.qt.webChannelTransport, (channel: any) => {
          resolve(channel.objects.dataBridge);
        });
      } else {
        // If not running inside the desktop shell, resolve to null
        resolve(null);
      }
    });
  }
  return bridgePromise;
}

async function callBridge(method: string, ...args: any[]): Promise<any> {
  const bridge = await getBridge();
  if (!bridge || typeof bridge[method] !== 'function') {
    throw new Error('Bridge not available');
  }
  return bridge[method](...args);
}

export function fetchSubprojects() {
  return callBridge('getSubprojects');
}

export function fetchSubproject(id: number) {
  return callBridge('getSubproject', id);
}


const fetchInitialData = async (
  addProjects: any,
  addTasks: any,
  addWorkloads: any,
  addPeople: any,
  setLoading: any
) => {
  setLoading(true);
  try {
    // 必要なデータをbridgeApi経由で取得
    const [projects, tasks, workloads, people] = await Promise.all([
      fetchSubprojects(),
      fetchTasks(),
      fetchWorkloads(),
      fetchPeople(),
    ]);
    addTasks(tasks);
    addWorkloads(workloads);
    addPeople(people);
  } catch (e) {
    // エラー処理は適宜
    console.error(e);
  } finally {
    setLoading(false);
  }
};

const Initializer = () => {
  const {
    addProjects,
    addTasks,
    addWorkloads,
    addPeople,
    setLoading,
  } = useAppContext();

  useEffect(() => {
    fetchInitialData(addProjects, addTasks, addWorkloads, addPeople, setLoading);
    // eslint-disable-next-line
  }, []);

  return null; // 画面には何も出さない
};



export function fetchPhase(id: number) {
  return callBridge('getPhase', id);
}

export function fetchAssets() {
  return callBridge('getAssets');
}

export function fetchAsset(id: number) {
  return callBridge('getAsset', id);
}

export function fetchTasks() {
  return callBridge('getTasks');
}

export function fetchTask(id: number) {
  return callBridge('getTask', id);
}

export function fetchWorkloads() {
  return callBridge('getWorkloads');
}

export function fetchWorkload(id: number) {
  return callBridge('getWorkload', id);
}

export function fetchPeople() {
  return callBridge('getPeople');
}

export function fetchPerson(id: number) {
  return callBridge('getPerson', id);
}

export function fetchWorkcategories() {
  return callBridge('getWorkcategories');
}

export function fetchWorkcategory(id: number) {
  return callBridge('getWorkcategory', id);
}

