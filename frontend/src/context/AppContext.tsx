import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";
import type { IPage } from "../types";
import { Phase, Asset, Task } from "../types/filter.types";

export interface IForignKey {
    type: "subproject" | "phase" | "asset" | "task" | "workload" | "person" | "workCategory";
    id: number;
    name: string;
}

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
    subproject: IForignKey; 
    start_date: string;
    end_date: string;
}

export interface IAsset {
    id: number;
    name: string;
    phase: IForignKey; // 親PhaseのID
    start_date: string;
    end_date: string;
    type: "EXT" | "INT" | "Common";
    work_category?: number | null; // WorkCategoryのID
    status: "waiting" | "In Progress" | "Completed" | "Not Started";
}

export interface ITask {
    id: number;
    name: string;
    asset: IForignKey; // 親AssetのID
    start_date: string;
    end_date: string;
    people: IForignKey[]; 
    status: "waiting" | "In Progress" | "Completed" | "Not Started";
}

export interface IWorkload {
    id: number;
    task: IForignKey; // 親TaskのID
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
    createPhase: (phase: Omit<Phase, 'id'>) => void;

    assets: IAsset[];
    addAssets: (assets: IAsset[]) => void;
    createAsset: (asset: Omit<Asset, 'id'>) => void;

    tasks: ITask[];
    addTasks: (tasks: ITask[]) => void;
    createTask: (task: Omit<Task, 'id'>) => void;

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

    isEditMode: boolean;
    setEditMode: (enabled: boolean) => void;
}

const defaultParams: IAppContext = {
    subprojects: [],
    addSubprojects: () => { },
    phases: [],
    addPhases: () => { },
    createPhase: () => { },
    assets: [],
    addAssets: () => { },
    createAsset: () => { },
    tasks: [],
    addTasks: () => { },
    createTask: () => { },
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
    isEditMode: false,
    setEditMode: () => { },
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
    const [isEditMode, setEditMode] = useState<boolean>(false);

    // SubProject変更時にEditModeをリセットするカスタム関数
    const handleSetSelectedSubprojectId = useCallback((id?: number) => {
        setSelectedSubprojectId(id);
        setEditMode(false); // SubProject変更時にEditModeをfalseにリセット
    }, []);

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

    // 新しいアイテム作成関数
    const generateId = () => Math.max(0, ...phases.map(p => p.id), ...assets.map(a => a.id), ...tasks.map(t => t.id)) + 1;

    const createPhase = useCallback((phase: Omit<Phase, 'id'>) => {
        const newPhase: IPhase = {
            id: generateId(),
            name: phase.name,
            subproject: {
                type: 'subproject',
                id: phase.subproject_id,
                name: subprojects.find(s => s.id === phase.subproject_id)?.name || 'Unknown'
            },
            start_date: phase.start_date || new Date().toISOString().split('T')[0],
            end_date: phase.end_date || new Date().toISOString().split('T')[0],
        };
        addPhases([newPhase]);
    }, [subprojects, addPhases]);

    const createAsset = useCallback((asset: Omit<Asset, 'id'>) => {
        const newAsset: IAsset = {
            id: generateId(),
            name: asset.name,
            phase: {
                type: 'phase',
                id: asset.phase_id,
                name: phases.find(p => p.id === asset.phase_id)?.name || 'Unknown'
            },
            start_date: asset.start_date || new Date().toISOString().split('T')[0],
            end_date: asset.end_date || new Date().toISOString().split('T')[0],
            type: 'Common' as const,
            status: asset.status === 'Not Started' ? 'Not Started' : 
                   asset.status === 'In Progress' ? 'In Progress' :
                   asset.status === 'Completed' ? 'Completed' : 'waiting',
        };
        addAssets([newAsset]);
    }, [phases, addAssets]);

    const createTask = useCallback((task: Omit<Task, 'id'>) => {
        const newTask: ITask = {
            id: generateId(),
            name: task.name,
            asset: {
                type: 'asset',
                id: task.asset_id,
                name: assets.find(a => a.id === task.asset_id)?.name || 'Unknown'
            },
            start_date: task.start_date || new Date().toISOString().split('T')[0],
            end_date: task.end_date || new Date().toISOString().split('T')[0],
            people: [],
            status: task.status === 'Not Started' ? 'Not Started' : 
                   task.status === 'In Progress' ? 'In Progress' :
                   task.status === 'Completed' ? 'Completed' : 'waiting',
        };
        addTasks([newTask]);
    }, [assets, addTasks]);

    return (
        <AppContext.Provider
            value={{
                subprojects,
                addSubprojects,
                phases,
                addPhases,
                createPhase,
                assets,
                addAssets,
                createAsset,
                tasks,
                addTasks,
                createTask,
                workloads,
                addWorkloads,
                people,
                addPeople,
                selectedSubprojectId,
                setSelectedSubprojectId: handleSetSelectedSubprojectId,
                selectedPersonList,
                setSelectedPersonList,
                loading,
                setLoading,
                currentPage,
                setCurrentPage,
                isEditMode,
                setEditMode,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
