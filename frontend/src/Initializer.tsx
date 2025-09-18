
import { useEffect } from "react";
import { useAppContext } from "./context/AppContext";
import { useFilterContext } from "./context/FilterContext";
import { useDialogContext } from "./context/DialogContext";
import { initLoad, channelReady } from "./api/bridgeApi";


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
  const { openDialog } = useDialogContext();

  // fetchInitialDataを内部関数として定義し、ProjectPageのfetchDataスタイルに合わせる
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await channelReady;
      const result = await initLoad();
      console.log("Waiting for channel to be ready...");
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
    } catch (e: any) {
      const msg = (e instanceof Error) ? e.message : String(e);
      openDialog({
        title: "Error",
        message: `Failed to fetch initial data.\n${msg}`,
        okText: "OK"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInitialData();
  }, []);

  return null;
};

export default Initializer;