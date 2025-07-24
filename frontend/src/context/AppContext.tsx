import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";
import type { IPage } from "../types";

export interface IPerson {
    id: number;
    name: string;
    email?: string;
}

export interface IProject {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    people: number[]; // Person ID配列
}

export interface ITask {
    id: number;
    name: string;
    project: number; // Project ID
    people: number[]; // Person ID配列
    start_date: string;
    end_date: string;
    status: string;
}

export interface IWorkload {
    id: number;
    task: number; // Task ID
    person: number; // Person ID
    hours: number;
}

export interface IAppContext {
    projects: IProject[];
    addProjects: (projects: IProject[]) => void;

    tasks: ITask[];            // 同上
    addTasks: (tasks: ITask[]) => void; // 追加・マージ

    workloads: IWorkload[];    // 同上
    addWorkloads: (workloads: IWorkload[]) => void; // 追加・マージ

    people: IPerson[];         // 同上
    addPeople: (people: IPerson[]) => void; // 追加・マージ

    selectedProjectId?: number;
    setSelectedProjectId: (projectId?: number) => void;

    selectedPersonList: number[];
    setSelectedPersonList: (personIds: number[]) => void;

    loading: boolean;
    setLoading: (loading: boolean) => void;

    currentPage: IPage; // 現在のページ名
    setCurrentPage: (page: IPage) => void;
}

const defaultParams: IAppContext = {
    projects: [],
    addProjects: () => { },
    tasks: [],
    addTasks: () => { },
    workloads: [],
    addWorkloads: () => { },
    people: [],
    addPeople: () => { },
    selectedProjectId: undefined,
    setSelectedProjectId: () => { },
    selectedPersonList: [],
    setSelectedPersonList: () => { },
    loading: false,
    setLoading: () => { },
    currentPage: "Distribute" 
, // Make sure "Distribute" is a valid IPage value
    setCurrentPage: () => { },
};


const AppContext = createContext<IAppContext>({
    ...defaultParams,
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [projects, setProjects] = useState<IProject[]>(defaultParams.projects);
    const [tasks, setTasks] = useState<ITask[]>(defaultParams.tasks);   
    const [workloads, setWorkloads] = useState<IWorkload[]>(defaultParams.workloads);
    const [people, setPeople] = useState<IPerson[]>(defaultParams.people);
    const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(defaultParams.selectedProjectId);
    const [selectedPersonList, setSelectedPersonList] = useState<number[]>(defaultParams.selectedPersonList);
    const [loading, setLoading] = useState<boolean>(defaultParams.loading);     
    const [currentPage, setCurrentPage] = useState<IPage>(defaultParams.currentPage);  

    // 追加・マージ（ID一意）
    const addProjects = useCallback((newProjects: IProject[]) => {
        setProjects((prevProjects) => {
            const merged = [...prevProjects];
            newProjects.forEach((p) => {
                const idx = merged.findIndex((e) => e.id === p.id);
                if (idx !== -1) {
                    merged[idx] = p;
                } else {
                    merged.push(p);
                }
            });
            return merged;
        });
    }, []);

    const addTasks = useCallback((newTasks: ITask[]) => {
        setTasks((prevTasks) => {
            const merged = [...prevTasks];
            newTasks.forEach((t) => {
                const idx = merged.findIndex((e) => e.id === t.id);
                if (idx !== -1) {
                    merged[idx] = t;
                } else {
                    merged.push(t);
                }
            });
            return merged;
        });
    }, []);

    const addWorkloads = useCallback((newWorkloads: IWorkload[]) => {
        setWorkloads((prevWorkloads) => {
            const merged = [...prevWorkloads];
            newWorkloads.forEach((w) => {
                const idx = merged.findIndex((e) => e.id === w.id);
                if (idx !== -1) {
                    merged[idx] = w;
                } else {
                    merged.push(w);
                }
            });
            return merged;
        });
    }, []);

    const addPeople = useCallback((newPeople: IPerson[]) => {
        setPeople((prevPeople) => {
            const merged = [...prevPeople];
            newPeople.forEach((p) => {
                const idx = merged.findIndex((e) => e.id === p.id);
                if (idx !== -1) {
                    merged[idx] = p;
                } else {
                    merged.push(p);
                }
            });
            return merged;
        });
    }, []);

    // ---------- Context本体 ----------
    return (
        <AppContext.Provider
            value={{
                projects,
                addProjects,
                tasks,
                addTasks,
                workloads,
                addWorkloads,
                people,
                addPeople,
                selectedProjectId,
                setSelectedProjectId,
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
