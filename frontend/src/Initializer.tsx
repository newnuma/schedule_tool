import { useEffect } from "react";
import { useAppContext } from "./context/AppContext";
import * as bridgeApi from "./api/bridgeApi";

const fetchInitialData = async (
  addSubprojects: any,
  addPhases: any,
  addAssets: any,
  addTasks: any,
  addWorkloads: any,
  addPeople: any,
  setLoading: any
) => {
  setLoading(true);
  console.log("Fetching initial data...");
  try {
    const result = await bridgeApi.fetchAll();
    console.log("res",result);
    addSubprojects(result.subproject || []);
    addPhases(result.phases || []);
    addAssets(result.assets || []);
    addTasks(result.tasks || []);
    addWorkloads(result.workloads || []);
    addPeople(result.person || []);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

const Initializer = () => {
  const {
    addSubprojects,
    addPhases,
    addAssets,
    addTasks,
    addWorkloads,
    addPeople,
    setLoading,
  } = useAppContext();

  useEffect(() => {
    (async () => {
      await bridgeApi.channelReady;
      await fetchInitialData(
        addSubprojects,
        addPhases,
        addAssets,
        addTasks,
        addWorkloads,
        addPeople,
        setLoading
      );
    })();
    // eslint-disable-next-line
  }, []);

  return null;
};

export default Initializer;
