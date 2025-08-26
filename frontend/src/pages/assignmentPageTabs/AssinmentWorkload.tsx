import React, { useEffect, useRef } from "react";
import { Typography } from "@mui/material";
import DateRangeFilter from "../../components/filters/DateRangeFilter";
import { useFilterContext } from "../../context/FilterContext";
import { fetchAssignmentWorkloads } from "../../api/bridgeApi";
import { useAppContext } from "../../context/AppContext";

const AssinmentWorkload: React.FC = () => {
	const { addPersonWorkloads, setLoading } = useAppContext();
	const { filters } = useFilterContext();
	const pageKey = "assignment:workload";
	const debounceRef = useRef<number | undefined>(undefined);

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

	return (
		<div>
			<Typography variant="h6" gutterBottom>
				Workload
			</Typography>
			<DateRangeFilter pageKey={pageKey} label="Period (Week)" startProperty="week" endProperty="week" />
		</div>
	);
};

export default AssinmentWorkload;
