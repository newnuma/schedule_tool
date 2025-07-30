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
  try {
    const result = await bridgeApi.fetchAll();
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
    fetchInitialData(
      addSubprojects,
      addPhases,
      addAssets,
      addTasks,
      addWorkloads,
      addPeople,
      setLoading
    );
    // eslint-disable-next-line
  }, []);

  return null;
};

export default Initializer;
