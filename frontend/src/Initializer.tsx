import { useEffect } from "react";
import { useAppContext } from "./context/AppContext";
import * as bridgeApi from "./api/bridgeApi";

const fetchInitialData = async (
  addSteps: any,
  addSubprojects: any,
  addPhases: any,
  addAssets: any,
  addTasks: any,
  addPersonWorkloads: any,
  addPMMWorkloads: any,
  addPeople: any,
  setLoading: any,
  setSelectedPersonList: any,
  setSelectedSubprojectId: any
) => {
  setLoading(true);
  console.log("Fetching initial data...");
  try {
    const result = await bridgeApi.initLoad();
    console.log("res", result);
    addSteps(result.steps || []);
    addSubprojects(result.subprojects || []);
    addPhases(result.phases || []);
    addAssets(result.assets || []);
    addTasks(result.tasks || []);
    addPersonWorkloads(result.personworkloads || []);
    addPMMWorkloads(result.pmmworkloads || []);
    addPeople(result.person || []);
    setSelectedPersonList(result.selectedPersonList || []);
    setSelectedSubprojectId(result.selectedSubprojectId || undefined);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

const Initializer = () => {
  const {
    addSteps,
    addSubprojects,
    addPhases,
    addAssets,
    addTasks,
    addPersonWorkloads,
    addPMMWorkloads,
    addPeople,
    setLoading,
    setSelectedPersonList,
    setSelectedSubprojectId,
  } = useAppContext();

  useEffect(() => {
    (async () => {
      await bridgeApi.channelReady;
      await fetchInitialData(
        addSteps,
        addSubprojects,
        addPhases,
        addAssets,
        addTasks,
        addPersonWorkloads,
        addPMMWorkloads,
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
