import { useEffect } from "react";
import { useAppContext } from "./context/AppContext";
import { useFilterContext } from "./context/FilterContext";
import * as bridgeApi from "./api/bridgeApi";

const fetchInitialData = async (
  addSteps: any,
  addSubprojects: any,
  addPhases: any,
  addPeople: any,
  setWorkCategories: any,
  setLoading: any,
  setSelectedPersonList: any,
  setSelectedSubprojectId: any,
  setCurrentUser: any,
  setFilters: any
) => {
  setLoading(true);
  console.log("Fetching initial data...");
  try {
    const result = await bridgeApi.initLoad();
    console.log("res", result);
    addSteps(result.steps || []);
    addSubprojects(result.subprojects || []);
    addPhases(result.phases || []);
    addPeople(result.person || []);
    setWorkCategories(result.workCategories || []);
    setSelectedPersonList(result.selectedPersonList || []);
    setSelectedSubprojectId(result.selectedSubprojectId || undefined);
    setCurrentUser(result.currentUser || undefined);
    if (result.filters) {
      setFilters(result.filters);
    }
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
    addPeople,
    setLoading,
    setWorkCategories,
    setSelectedPersonList,
    setSelectedSubprojectId,
    setCurrentUser,

  } = useAppContext();

  const { setFilters } = useFilterContext();

  useEffect(() => {
    (async () => {
      await bridgeApi.channelReady;
      await fetchInitialData(
        addSteps,
        addSubprojects,
        addPhases,
        addPeople,
        setWorkCategories,
        setLoading,
        setSelectedPersonList,
        setSelectedSubprojectId,
        setCurrentUser,
        setFilters,
      );
    })();
    // eslint-disable-next-line
  }, []);

  return null;
};

export default Initializer;
