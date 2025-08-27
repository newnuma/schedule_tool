import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton,
} from "@mui/material";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import DateRangeFilter from "../../components/filters/DateRangeFilter";
import { CollapsibleFilterPanel, CheckboxFilter } from "../../components/filters";
import { useFilterContext } from "../../context/FilterContext";
import { fetchAssignmentWorkloads } from "../../api/bridgeApi";
import { useAppContext } from "../../context/AppContext";
import type { IPerson } from "../../context/AppContext";

const AssinmentWorkload: React.FC = () => {
	const { addPersonWorkloads, setLoading, personWorkloads, people, tasks } = useAppContext();
	const { filters } = useFilterContext();
	const pageKey = "assignment:workload";
	const debounceRef = useRef<number | undefined>(undefined);
	const [expandedPersons, setExpandedPersons] = useState<Set<number>>(new Set());


	useEffect(() => {
		const dr = filters[pageKey]?.dateRange;
		const start = dr?.start;
		const end = dr?.end;
		if (!start || !end) return;
		if (debounceRef.current) window.clearTimeout(debounceRef.current);
		debounceRef.current = window.setTimeout(async () => {
			try {
				setLoading(true);
				const res = await fetchAssignmentWorkloads(start, end);
				addPersonWorkloads(res.personworkloads || []);
			} finally {
				setLoading(false);
			}
		}, 300);
		return () => {
			if (debounceRef.current) window.clearTimeout(debounceRef.current);
		};
	}, [filters, addPersonWorkloads, setLoading]);

	// 期間変更時は展開状態をリセット
	useEffect(() => {
		setExpandedPersons(new Set());
	}, [filters]);

  // Util: YYYY-MM-DD -> Date（ローカル）
  const parseISODate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  // Util: Date -> YYYY-MM-DD（ゼロ詰め、ローカル）
  const toISODate = (dt: Date) => {
    const y = dt.getFullYear();
    const m = `${dt.getMonth() + 1}`.padStart(2, "0");
    const d = `${dt.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  // Util: 表示用 M/D
  const toMonthDay = (dt: Date) => `${dt.getMonth() + 1}/${dt.getDate()}`;

  // 週配列（start~end を月曜ベース（既に月曜渡し）で1週刻み、両端含む）
  const { weekIsos, weekLabels } = useMemo(() => {
    const dr = filters[pageKey]?.dateRange;
    const start = dr?.start;
    const end = dr?.end;
    const result = { weekIsos: [] as string[], weekLabels: [] as string[] };
    if (!start || !end) return result;
    const s = parseISODate(start);
    const e = parseISODate(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return result;
    let cur = new Date(s);
    while (cur <= e) {
      result.weekIsos.push(toISODate(cur));
      result.weekLabels.push(toMonthDay(cur));
      const nx = new Date(cur);
      nx.setDate(nx.getDate() + 7);
      cur = nx;
    }
    return result;
  }, [filters]);

  // マスタ参照用
  const taskNameById = useMemo(() => {
    const m = new Map<number, string>();
    tasks.forEach(t => m.set(t.id, t.name));
    return m;
  }, [tasks]);

	// 期間内データのみを抽出
  const weekSet = useMemo(() => new Set(weekIsos), [weekIsos]);
  const filteredPW = useMemo(() => {
    if (!weekIsos.length) return [] as typeof personWorkloads;
    return personWorkloads.filter(w => weekSet.has(w.week));
  }, [personWorkloads, weekSet, weekIsos.length]);

  // 集計インデックスの構築
  const aggregates = useMemo(() => {
    const personWeek = new Map<string, number>(); // person|week -> sum
    const personTaskWeek = new Map<string, number>(); // person|task|week -> sum
    const personSubprojWeek = new Map<string, number>(); // person|subproj|week -> sum
    const personSubprojects = new Map<number, Set<number>>(); // person -> set(subprojId)
    const personSubprojTasks = new Map<string, Set<number>>(); // person|subproj -> set(taskId)
    const subprojName = new Map<number, string>();

    const add = (map: Map<string, number>, key: string, val: number) => {
      map.set(key, (map.get(key) || 0) + val);
    };

    filteredPW.forEach(w => {
      const personId = w.person.id;
      const taskId = w.task.id;
      const week = w.week;
      const spId = w.subproject?.id ?? 0;
      const spName = w.subproject?.name ?? "(No Subproject)";
      subprojName.set(spId, spName);

      add(personWeek, `${personId}|${week}`, w.man_week || 0);
      add(personTaskWeek, `${personId}|${taskId}|${week}`, w.man_week || 0);
      add(personSubprojWeek, `${personId}|${spId}|${week}`, w.man_week || 0);

      if (!personSubprojects.has(personId)) personSubprojects.set(personId, new Set());
      personSubprojects.get(personId)!.add(spId);

      const pstKey = `${personId}|${spId}`;
      if (!personSubprojTasks.has(pstKey)) personSubprojTasks.set(pstKey, new Set());
      personSubprojTasks.get(pstKey)!.add(taskId);
    });

    return { personWeek, personTaskWeek, personSubprojWeek, personSubprojects, personSubprojTasks, subprojName };
  }, [filteredPW]);

  // 表示ユーティリティ: 1桁小数、0は"0"
  const fmt = (v: number) => {
    if (Math.abs(v) < 1e-9) return "0";
    return v.toFixed(1);
  };

  // トグル操作
  const togglePerson = (pid: number) => {
    setExpandedPersons(prev => {
      const n = new Set(prev);
      if (n.has(pid)) n.delete(pid); else n.add(pid);
      return n;
    });
  };
	// Subproject は個別に折りたたまない（Person 展開時に常に表示）

		// 部署名を付与した People 配列
		type PersonWithDept = IPerson & { departmentName: string };
		const peopleWithDeptName: PersonWithDept[] = useMemo(() =>
			people.map(p => ({ ...p, departmentName: p.department?.name || '(No Department)' })),
			[people]
		);
		// CheckboxFilter 用のオプション配列（ジェネリクスを素直に推論させるため単純化）
		type DeptOption = { departmentName: string };
		const peopleDeptOptions: DeptOption[] = useMemo(
			() => peopleWithDeptName.map(p => ({ departmentName: p.departmentName })),
			[peopleWithDeptName]
		);
	// 部署フィルタの選択値
	const selectedDepartments: string[] = (filters[pageKey]?.dropdown?.["departmentName"] as string[]) || [];
	// 行に効くフィルタを適用した People
	const peopleFiltered = useMemo(() => {
		const sorted = [...peopleWithDeptName].sort((a, b) => a.name.localeCompare(b.name));
		if (!selectedDepartments.length) return sorted;
		return sorted.filter(p => selectedDepartments.includes(p.departmentName));
	}, [peopleWithDeptName, selectedDepartments]);

	return (
		<div>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
				{/* 左上: 列に作用する期間フィルタ */}
				<DateRangeFilter pageKey={pageKey} label="Period (Week)" startProperty="week" endProperty="week" />
				{/* 右上: 行に作用するフィルタ群 */}
				<Box sx={{ ml: 'auto' }}>
					<CollapsibleFilterPanel pageKey={pageKey}>
						<CheckboxFilter<DeptOption>
							pageKey={pageKey}
							data={peopleDeptOptions}
							property="departmentName"
							label="Department"
						/>
					</CollapsibleFilterPanel>
				</Box>
			</Box>

			<TableContainer
				component={Paper}
				sx={{ width: 1200, height: 520, overflow: 'auto' }}
			>
				<Table size="small" sx={{ minWidth: 900 }}>
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									minWidth: 260,
									backgroundColor: '#f5f5f5',
									position: 'sticky',
									left: 0,
									top: 0,
									zIndex: 4,
								}}
							>
							</TableCell>
							{weekLabels.map((label, idx) => (
								<TableCell
									key={idx}
									align="center"
									sx={{ backgroundColor: '#f5f5f5', minWidth: 80, position: 'sticky', top: 0, zIndex: 3 }}
								>
									<strong>{label}</strong>
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{/* Person 行（部署フィルタ適用） */}
						{peopleFiltered.map(person => {
							const pid = person.id;
							const isOpen = expandedPersons.has(pid);
							const spSet = aggregates.personSubprojects.get(pid) || new Set<number>();
							const spList = Array.from(spSet).sort((a, b) => {
								const an = aggregates.subprojName.get(a) || "(No Subproject)";
								const bn = aggregates.subprojName.get(b) || "(No Subproject)";
								return an.localeCompare(bn);
							});
							return (
								<React.Fragment key={pid}>
									<TableRow hover sx={{ backgroundColor: '#ffffff' }}>
										<TableCell
											sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#ffffff' }}
										>
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												<IconButton size="small" onClick={() => togglePerson(pid)} sx={{ mr: 1 }}>
													{isOpen ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
												</IconButton>
												<strong>{person.name}{isOpen ? '△' : '▽'}</strong>
											</Box>
										</TableCell>
										{weekIsos.map((wIso) => {
											const v = aggregates.personWeek.get(`${pid}|${wIso}`) || 0;
											return (
												<TableCell key={wIso} align="center">{fmt(v)}</TableCell>
											);
										})}
									</TableRow>

									{/* SubProject 行（展開時） */}
									{isOpen && spList.map(spid => {
										const spName = aggregates.subprojName.get(spid) || "(No Subproject)";
										const spKey = `${pid}|${spid}`;
										const taskSet = aggregates.personSubprojTasks.get(spKey) || new Set<number>();
										const taskList = Array.from(taskSet).sort((a, b) => (taskNameById.get(a) || '').localeCompare(taskNameById.get(b) || ''));
										return (
											<React.Fragment key={spKey}>
												<TableRow sx={{ backgroundColor: '#eef5ff' }}>
													<TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#eef5ff', pl: 4 }}>
														<Box sx={{ display: 'flex', alignItems: 'center' }}>
															<strong>{spName}</strong>
														</Box>
													</TableCell>
													{weekIsos.map((wIso) => (
														<TableCell key={wIso} align="center">
															{fmt(aggregates.personSubprojWeek.get(`${pid}|${spid}|${wIso}`) || 0)}
														</TableCell>
													))}
												</TableRow>

												{/* Task 行（展開時） */}
												{taskList.map(tid => (
													<TableRow key={`${spKey}|${tid}`}>
														<TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#ffffff', pl: 8 }}>
															{taskNameById.get(tid) || `Task ${tid}`}
														</TableCell>
														{weekIsos.map((wIso) => (
															<TableCell key={wIso} align="center">
																{fmt(aggregates.personTaskWeek.get(`${pid}|${tid}|${wIso}`) || 0)}
															</TableCell>
														))}
													</TableRow>
												))}
											</React.Fragment>
										);
									})}
									</React.Fragment>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
		</div>
	);
};

export default AssinmentWorkload;
