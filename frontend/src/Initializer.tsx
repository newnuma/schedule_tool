import { useEffect } from "react";
import { useAppContext } from "./context/AppContext";
import * as bridgeApi from "./api/bridgeApi";

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
      bridgeApi.fetchSubprojects(),
      bridgeApi.fetchTasks(),
      bridgeApi.fetchWorkloads(),
      bridgeApi.fetchPeople(),
    ]);
    addProjects(projects);
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

export default Initializer;
