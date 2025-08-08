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
  setLoading: any,
  setSelectedPersonList: any,
  setSelectedSubprojectId: any
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
    setSelectedPersonList(result.selectedPersonList || []);
    setSelectedSubprojectId(result.selectedSubprojectId || null);
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
    setSelectedPersonList,
    setSelectedSubprojectId
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
        setLoading,
        setSelectedPersonList,
        setSelectedSubprojectId
      );
    })();
    // eslint-disable-next-line
  }, []);

  return null;
};

export default Initializer;
