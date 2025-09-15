import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";
import type { IPage } from "../types";


export const AssetTypeArray = ['EXT', 'INT', 'Common', 'COL'] as const;
export type AssetType = typeof AssetTypeArray[number];
export const PhaseTypeArray = ["DESIGN", "PRODT", "ENG"] as const;
export type PhaseType = typeof PhaseTypeArray[number];
export const MilestoneTaskTypeArray = ['Date Receive', 'Date Release', 'Review', 'DR'] as const;
export type MilestoneTaskType = typeof MilestoneTaskTypeArray[number];
export const TaskStatusArray = ['wtg', 'ip', 'fin'] as const;
export type TaskStatus = typeof TaskStatusArray[number];

export interface IForignKey {
    type: "Subproject" | "Phase" | "Asset" | "Task" | "Workload" | "Person" | "WorkCategory" | "Department" | "Step";
    id: number;
    name?: string;
}

export interface ISubproject {
    id: number;
    type: "Subproject";
    name: string;
    start_date: string; // ISO日付文字列
    end_date: string;   // ISO日付文字列
    people: IForignKey[];   // Person参照
    department?: IForignKey | null; // Department参照
    access: "Common" | "Project Team" | "High Confidential";
    editing?: IForignKey | null; // 編集中ユーザー(Person FK)
    pmm_status?: "planning" | "approved";
}



export interface IPhase {
    id: number;
    type: "Phase";
    name: string;
    subproject: IForignKey; 
    start_date: string;
    end_date: string;
    milestone: boolean;
    phase_type: PhaseType;
    updatedAt?: number;
}

export interface IAsset {
    id: number;
    type: "Asset";
    name: string;
    phase: IForignKey; // 親PhaseのID
    start_date: string;
    end_date: string;
    asset_type: AssetType;
    work_category?: IForignKey | null; // WorkCategory
    step?: IForignKey | null; // Step

    //参照用
    color?: string; //Stepの色
    // 更新検知用（管理カウンタ不要で更新を伝播）
    updatedAt?: number;
}

export interface ITask {
    id: number;
    type: "Task";
    name: string;
    asset: IForignKey; // 親AssetのID
    start_date: string;
    end_date: string;
    assignees: IForignKey[]; // Person参照
    status: TaskStatus;

    //参照用
    subproject?: IForignKey; // 追加: 所属SubProject（サーバ埋め込み or 正規化）
    work_category?: IForignKey | null; // 追加: AssetのWorkCategory（サーバ埋め込み or 正規化）
    updatedAt?: number;
}

export interface IMilestoneTask {
    id: number;
    type: "MilestoneTask";
    name: string;
    asset: IForignKey;
    start_date: string;
    end_date: string;
    milestone_type: MilestoneTaskType;
    subproject?: IForignKey;

    //参照用
    asset_type?: AssetType; // 追加: Assetのtype（EXT/INT/Common）
    updatedAt?: number;
}

export interface IPersonWorkload {
    id: number;
    type: "PersonWorkload";
    task: IForignKey; // 親TaskのID
    name: string;
    week: string; // 週の月曜日（ISO文字列）
    person: IForignKey; // Person参照
    man_week: number; // 工数(人週)

    //参照用
    subproject?: IForignKey; // 追加: 所属SubProject（サーバ埋め込み or 正規化）
    updatedAt?: number;
}

export interface IPMMWorkload {
    id: number;
    type: "PMMWorkload";
    subproject: IForignKey; // Subproject参照
    work_category?: IForignKey | null; // WorkCategory参照
    name: string;
    week: string; // 週の月曜日（ISO文字列）
    man_week: number; // 工数(人週)
    updatedAt?: number;
}

export interface IPerson {
    id: number;
    type: "Person";
    name: string;
    email?: string;
    department?: IForignKey | null;
    manager?: IForignKey | null;
    project?: IForignKey[]
}

export interface IWorkCategory {
    id: number;
    name: string;
    description?: string;
}

export interface IStep {
    id: number;
    name: string;
    color: string; // "r, g, b"
}

export interface IAppContext {
    steps: IStep[];
    addSteps: (steps: IStep[]) => void;
    subprojects: ISubproject[];
    addSubprojects: (subprojects: ISubproject[]) => void;

    phases: IPhase[];
    addPhases: (phases: IPhase[]) => void;
    updatePhases: (updates: Partial<IPhase>[]) => void;
    deletePhase: (id: number) => void;

    assets: IAsset[];
    addAssets: (assets: IAsset[]) => void;
    updateAssets: (updates: Partial<IAsset>[]) => void;
    deleteAsset: (id: number) => void;

    tasks: ITask[];
    addTasks: (tasks: ITask[]) => void;
    updateTasks: (updates: Partial<ITask>[]) => void;
    deleteTask: (id: number) => void;

    milestoneTasks: IMilestoneTask[];
    addMilestoneTasks: (tasks: IMilestoneTask[]) => void;
    updateMilestoneTasks: (updates: Partial<IMilestoneTask>[]) => void;

    personWorkloads: IPersonWorkload[];
    addPersonWorkloads: (workloads: IPersonWorkload[]) => void;
    updatePersonWorkloads: (updates: Partial<IPersonWorkload>[]) => void;

    pmmWorkloads: IPMMWorkload[];
    addPMMWorkloads: (workloads: IPMMWorkload[]) => void;
    updatePMMWorkloads: (updates: Partial<IPMMWorkload>[]) => void;

    people: IPerson[];
    addPeople: (people: IPerson[]) => void;

    selectedSubprojectId?: number;
    setSelectedSubprojectId: (id?: number) => void;

    workCategories?: IWorkCategory[];
    setWorkCategories: (categories: IWorkCategory[]) => void;

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
    steps: [],
    addSteps: () => {},
    subprojects: [],
    addSubprojects: () => {},
    phases: [],
    addPhases: () => {},
    updatePhases: () => {},
    deletePhase: () => {},
    assets: [],
    addAssets: () => {},
    updateAssets: () => {},
    deleteAsset: () => {},
    tasks: [],
    addTasks: () => {},
    updateTasks: () => {},
    deleteTask: () => {},
    milestoneTasks: [],
    addMilestoneTasks: () => {},
    updateMilestoneTasks: () => {},
    personWorkloads: [],
    addPersonWorkloads: () => {},
    updatePersonWorkloads: () => {},
    pmmWorkloads: [],
    addPMMWorkloads: () => {},
    updatePMMWorkloads: () => {},
    people: [],
    addPeople: () => {},
    selectedSubprojectId: undefined,
    setSelectedSubprojectId: () => {},
    workCategories: [],
    setWorkCategories: () => {},
    selectedPersonList: [],
    setSelectedPersonList: () => {},
    loading: false,
    setLoading: () => {},
    currentPage: "Distribute",
    setCurrentPage: () => {},
    isEditMode: false,
    setEditMode: () => {},
};

const AppContext = createContext<IAppContext>({
    ...defaultParams,
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [steps, setSteps] = useState<IStep[]>([]);
    const [subprojects, setSubprojects] = useState<ISubproject[]>([]);
    const [phases, setPhases] = useState<IPhase[]>([]);
    const [assets, setAssets] = useState<IAsset[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [milestoneTasks, setMilestoneTasks] = useState<IMilestoneTask[]>([]);
    const [personWorkloads, setPersonWorkloads] = useState<IPersonWorkload[]>([]);
    const [pmmWorkloads, setPMMWorkloads] = useState<IPMMWorkload[]>([]);
    const [people, setPeople] = useState<IPerson[]>([]);
    const [workCategories, setWorkCategories] = useState<IWorkCategory[]>([]);
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
    const addSteps = useCallback((newItems: IStep[]) => {
        setSteps((prev) => {
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
                    const stamped: IPhase = {
                        ...item,
                        updatedAt: (item as any).updatedAt ?? Date.now(),
                    };
                    if (idx !== -1) merged[idx] = stamped;
                    else merged.push(stamped);
            });
            return merged;
        });
    }, []);
    const addAssets = useCallback((newItems: IAsset[]) => {
        setAssets((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                    const stamped: IAsset = {
                        ...item,
                        updatedAt: item.updatedAt ?? Date.now(),
                    };
                    if (idx !== -1) {
                        merged[idx] = stamped;
                    } else {
                        merged.push(stamped);
                    }
            });
            return merged;
        });
    }, []);
    const addTasks = useCallback((newItems: ITask[]) => {
        setTasks((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                    const stamped: ITask = {
                        ...item,
                        updatedAt: (item as any).updatedAt ?? Date.now(),
                    };
                    if (idx !== -1) merged[idx] = stamped;
                    else merged.push(stamped);
            });
            return merged;
        });
    }, []);
    const addMilestoneTasks = useCallback((newItems: IMilestoneTask[]) => {
        setMilestoneTasks((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                    const stamped: IMilestoneTask = {
                        ...item,
                        updatedAt: (item as any).updatedAt ?? Date.now(),
                    };
                    if (idx !== -1) merged[idx] = stamped;
                    else merged.push(stamped);
            });
            return merged;
        });
    }, []);
    const addPersonWorkloads = useCallback((newItems: IPersonWorkload[]) => {
        setPersonWorkloads((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                    const stamped: IPersonWorkload = {
                        ...item,
                        updatedAt: (item as any).updatedAt ?? Date.now(),
                    };
                    if (idx !== -1) merged[idx] = stamped;
                    else merged.push(stamped);
            });
            return merged;
        });
    }, []);
    const addPMMWorkloads = useCallback((newItems: IPMMWorkload[]) => {
        setPMMWorkloads((prev) => {
            const merged = [...prev];
            newItems.forEach((item) => {
                const idx = merged.findIndex((e) => e.id === item.id);
                    const stamped: IPMMWorkload = {
                        ...item,
                        updatedAt: (item as any).updatedAt ?? Date.now(),
                    };
                    if (idx !== -1) merged[idx] = stamped;
                    else merged.push(stamped);
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

    
    // update系関数（部分フィールドのみ更新）
    const updatePhases = useCallback((updates: Partial<IPhase>[]) => {
        setPhases((prev) => prev.map(phase => {
            const update = updates.find(u => u.id === phase.id);
            return update ? { ...phase, ...update } : phase;
        }));
    }, []);

    const updateAssets = useCallback((updates: Partial<IAsset>[]) => {
        setAssets((prev) => prev.map(asset => {
            const update = updates.find(u => u.id === asset.id);
            return update ? { ...asset, ...update, updatedAt: Date.now() } : asset;
        }));
    }, []);

    const updateTasks = useCallback((updates: Partial<ITask>[]) => {
        setTasks((prev) => prev.map(task => {
            const update = updates.find(u => u.id === task.id);
            return update ? { ...task, ...update } : task;
        }));
    }, []);

    const updateMilestoneTasks = useCallback((updates: Partial<IMilestoneTask>[]) => {
        setMilestoneTasks((prev) => prev.map(task => {
            const update = updates.find(u => u.id === task.id);
            return update ? { ...task, ...update } : task;
        }));
    }, []);

    const updatePersonWorkloads = useCallback((updates: Partial<IPersonWorkload>[]) => {
        setPersonWorkloads((prev) => prev.map(workload => {
            const update = updates.find(u => u.id === workload.id);
            return update ? { ...workload, ...update } : workload;
        }));
    }, []);

    const updatePMMWorkloads = useCallback((updates: Partial<IPMMWorkload>[]) => {
        setPMMWorkloads((prev) => prev.map(workload => {
            const update = updates.find(u => u.id === workload.id);
            return update ? { ...workload, ...update } : workload;
        }));
    }, []);

    // 削除系メソッド
    const deleteAsset = useCallback((id: number) => {
        setAssets((prev) => prev.filter((a) => a.id !== id));
    }, []);
    const deleteTask = useCallback((id: number) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const deletePhase = useCallback((id: number) => {
        setPhases((prev) => prev.filter((p) => p.id !== id));
    }, []);

    return (
        <AppContext.Provider
            value={{
                steps,
                addSteps,
                subprojects,
                addSubprojects,
                phases,
                addPhases,
                updatePhases,
                deletePhase,
                assets,
                addAssets,
                updateAssets,
                deleteAsset,
                tasks,
                addTasks,
                updateTasks,
                deleteTask,
                milestoneTasks,
                addMilestoneTasks,
                updateMilestoneTasks,
                personWorkloads,
                addPersonWorkloads,
                updatePersonWorkloads,
                pmmWorkloads,
                addPMMWorkloads,
                updatePMMWorkloads,
                people,
                addPeople,
                workCategories,
                setWorkCategories,
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
