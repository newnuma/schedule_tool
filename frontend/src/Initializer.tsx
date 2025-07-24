import { useEffect } from "react";
import { useAppContext } from "./context/AppContext";

// ダミーAPI（実際はbridgeApi.tsなどに置き換え）
const fetchInitialData = async () => {
  return {
    projects: [
      { id: 1, name: "プロジェクトA" },
      { id: 2, name: "プロジェクトB" }
    ],
    tasks: [
      { id: 101, name: "タスクA", project: 1 },
      { id: 102, name: "タスクB", project: 2 }
    ]
  };
};

const Initializer = () => {
  const { setState } = useAppContext();

  useEffect(() => {
    (async () => {
      setState(s => ({ ...s, loading: true }));
      try {
        const data = await fetchInitialData();
        setState(s => ({
          ...s,
          projects: data.projects,
          tasks: data.tasks,
          loading: false,
        }));
      } catch (err) {
        setState(s => ({ ...s, loading: false }));
      }
    })();
  }, [setState]);

  return null; // 画面には何も出さない
};

export default Initializer;
