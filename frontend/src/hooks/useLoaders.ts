import { useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import {
  channelReady,
  initLoad as bridgeInitLoad,
  fetchDistributePage,
  fetchProjectPage,
  fetchAssignmentPage,
  fetchSteps,
} from "../api/bridgeApi";

export function useLoaders() {
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

  const initLoad = useCallback(async () => {
    setLoading(true);
    try {
      await channelReady;
      const result = await bridgeInitLoad();
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
    } finally {
      setLoading(false);
    }
  }, [
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
  ]);

  const loadDistributePage = useCallback(async () => {
    setLoading(true);
    try {
      await channelReady;
      const res = await fetchDistributePage();
      addSubprojects(res.subprojects || []);
      addPhases(res.phases || []);
    } finally {
      setLoading(false);
    }
  }, [addSubprojects, addPhases, setLoading]);

  const loadProjectPage = useCallback(
    async (subprojectId: number) => {
      setLoading(true);
      try {
        await channelReady;
        setSelectedSubprojectId(subprojectId);
        const res = await fetchProjectPage(subprojectId);
        addPhases(res.phases || []);
        addAssets(res.assets || []);
        addTasks(res.tasks || []);
        addPersonWorkloads(res.personworkloads || []);
        addPMMWorkloads(res.pmmworkloads || []);
      } finally {
        setLoading(false);
      }
    },
    [
      addPhases,
      addAssets,
      addTasks,
      addPersonWorkloads,
      addPMMWorkloads,
      setLoading,
      setSelectedSubprojectId,
    ]
  );

  const loadAssignmentPage = useCallback(
    async (startIso: string, endIso: string) => {
      setLoading(true);
      try {
        await channelReady;
        const res = await fetchAssignmentPage(startIso, endIso);
        addTasks(res.tasks || []);
        addPersonWorkloads(res.personworkloads || []);
        addPeople(res.person || []);
      } finally {
        setLoading(false);
      }
    },
    [addTasks, addPersonWorkloads, addPeople, setLoading]
  );

  const loadSteps = useCallback(async () => {
    await channelReady;
    const res = await fetchSteps();
    if (Array.isArray(res)) addSteps(res);
    else addSteps(res?.steps || []);
  }, [addSteps]);

  return {
    initLoad,
    loadDistributePage,
    loadProjectPage,
    loadAssignmentPage,
    loadSteps,
  };
}

export default useLoaders;
