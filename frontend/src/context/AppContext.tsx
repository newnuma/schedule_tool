import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";
import type { IPage } from "../types";

// 親子関係に合わせた型定義
export interface ISubproject {
    id: number;
    name: string;
    start_date: string; // ISO日付文字列
    end_date: string;   // ISO日付文字列
    people: number[];   // PersonのID配列
    is_edding: boolean;
}

export interface IPhase {
    id: number;
    name: string;
    subproject: number; // 親SubprojectのID
    start_date: string;
    end_date: string;
}

export interface IAsset {
    id: number;
    name: string;
    phase: number; // 親PhaseのID
    start_date: string;
    end_date: string;
    type: "EXT" | "INT" | "Common";
    work_category?: number | null; // WorkCategoryのID
    status: "waiting" | "In Progress" | "Completed" | "Not Started";
}

export interface ITask {
    id: number;
    name: string;
    asset: number; // 親AssetのID
    start_date: string;
    end_date: string;
    people: number[]; // PersonのID配列
    status: "waiting" | "In Progress" | "Completed" | "Not Started";
}

export interface IWorkload {
    id: number;
    task: number; // 親TaskのID
    name: string;
    start_date: string;
    people: number; // PersonのID
    hours: number;
}

export interface IPerson {
    id: number;
    name: string;
    email?: string;
}

export interface IWorkCategory {
    id: number;
    name: string;
    description?: string;
}

export interface IAppContext {
    subprojects: ISubproject[];
    addSubprojects: (subprojects: ISubproject[]) => void;

    phases: IPhase[];
    addPhases: (phases: IPhase[]) => void;

    assets: IAsset[];
    addAssets: (assets: IAsset[]) => void;

    tasks: ITask[];
    addTasks: (tasks: ITask[]) => void;

    workloads: IWorkload[];
    addWorkloads: (workloads: IWorkload[]) => void;

    people: IPerson[];
    addPeople: (people: IPerson[]) => void;

    selectedSubprojectId?: number;
    setSelectedSubprojectId: (id?: number) => void;

    selectedPersonList: number[];
    setSelectedPersonList: (ids: number[]) => void;

    loading: boolean;
    setLoading: (loading: boolean) => void;

    currentPage: IPage;
    setCurrentPage: (page: IPage) => void;
}

const defaultParams: IAppContext = {
    subprojects: [],
    addSubprojects: () => { },
    phases: [],
    addPhases: () => { },
    assets: [],
    addAssets: () => { },
    tasks: [],
    addTasks: () => { },
    workloads: [],
    addWorkloads: () => { },
    people: [],
    addPeople: () => { },
    selectedSubprojectId: undefined,
    setSelectedSubprojectId: () => { },
    selectedPersonList: [],
    setSelectedPersonList: () => { },
    loading: false,
    setLoading: () => { },
    currentPage: "Distribute",
    setCurrentPage: () => { },
};

const AppContext = createContext<IAppContext>({
    ...defaultParams,
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [subprojects, setSubprojects] = useState<ISubproject[]>([]);
    const [phases, setPhases] = useState<IPhase[]>([]);
    const [assets, setAssets] = useState<IAsset[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [workloads, setWorkloads] = useState<IWorkload[]>([]);
    const [people, setPeople] = useState<IPerson[]>([]);
    const [selectedSubprojectId, setSelectedSubprojectId] = useState<number | undefined>(undefined);
    const [selectedPersonList, setSelectedPersonList] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<IPage>("Distribute");

    // 追加・マージ（ID一意）
    const addSubprojects = useCallback((newItems: ISubproject[]) => {
        setSubprojects((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                if (idx !== -1) merged[idx] = item;
                else merged.push(item);
            });
            return merged;
        });
    }, []);
    const addPhases = useCallback((newItems: IPhase[]) => {
        setPhases((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                if (idx !== -1) merged[idx] = item;
                else merged.push(item);
            });
            return merged;
        });
    }, []);
    const addAssets = useCallback((newItems: IAsset[]) => {
        setAssets((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                if (idx !== -1) merged[idx] = item;
                else merged.push(item);
            });
            return merged;
        });
    }, []);
    const addTasks = useCallback((newItems: ITask[]) => {
        setTasks((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                if (idx !== -1) merged[idx] = item;
                else merged.push(item);
            });
            return merged;
        });
    }, []);
    const addWorkloads = useCallback((newItems: IWorkload[]) => {
        setWorkloads((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                if (idx !== -1) merged[idx] = item;
                else merged.push(item);
            });
            return merged;
        });
    }, []);
    const addPeople = useCallback((newItems: IPerson[]) => {
        setPeople((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                if (idx !== -1) merged[idx] = item;
                else merged.push(item);
            });
            return merged;
        });
    }, []);

    return (
        <AppContext.Provider
            value={{
                subprojects,
                addSubprojects,
                phases,
                addPhases,
                assets,
                addAssets,
                tasks,
                addTasks,
                workloads,
                addWorkloads,
                people,
                addPeople,
                selectedSubprojectId,
                setSelectedSubprojectId,
                selectedPersonList,
                setSelectedPersonList,
                loading,
                setLoading,
                currentPage,
                setCurrentPage,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
