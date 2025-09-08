import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  SxProps,
  Theme,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useFilterContext } from "../../context/FilterContext";

interface CollapsibleFilterPanelProps {
  pageKey: string;
  children: React.ReactNode;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
  sx?: SxProps<Theme>;
}

const CollapsibleFilterPanel: React.FC<CollapsibleFilterPanelProps> = ({
  pageKey,
  children,
  expanded,
  onChange,
  sx,
}) => {
  const { filters } = useFilterContext();

  // フィルター適用数をカウント
  const activeFilterCount = React.useMemo(() => {
    const pageFilters = filters[pageKey];
    if (!pageFilters) return 0;
    let count = 0;
    // Dropdown/Checkbox filters
    if (pageFilters.dropdown) {
      Object.values(pageFilters.dropdown).forEach(values => {
        if (Array.isArray(values) && values.length > 0) {
          count++;
        }
      });
    }
    // DateRange filter
    if (pageFilters.dateRange && (pageFilters.dateRange.start || pageFilters.dateRange.end)) {
      count++;
    }
    return count;
  }, [filters, pageKey]);

  const title = `Filter (${activeFilterCount})`;
  // expanded/onChangeがpropsで渡された場合は制御、なければローカルで管理
  const [localExpanded, setLocalExpanded] = React.useState(false);
  const isControlled = typeof expanded === 'boolean' && typeof onChange === 'function';
  const panelExpanded = isControlled ? expanded : localExpanded;
  const handlePanelChange = (_: any, newExpanded: boolean) => {
    if (isControlled) {
      onChange?.(newExpanded);
    } else {
      setLocalExpanded(newExpanded);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: 280,
        maxWidth: 350,
        ...sx,
      }}
    >
      <Accordion 
  expanded={panelExpanded}
  onChange={handlePanelChange}
        sx={{ 
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          boxShadow: 3,
          '&:before': {
            display: 'none', // デフォルトの区切り線を非表示
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="filter-panel-content"
          id="filter-panel-header"
          sx={{
            minHeight: 48,
            '&.Mui-expanded': {
              minHeight: 48,
            },
            '& .MuiAccordionSummary-content': {
              margin: '8px 0',
            },
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            padding: 2,
            maxHeight: 400,
            overflowY: 'auto',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderTop: 'none',
            boxShadow: 3,
          }}
        >
          {React.Children.map(children, (child, index) => (
            <React.Fragment key={index}>
              <Accordion
                defaultExpanded={true}
                sx={{
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  border: 'none',
                  '&:before': {
                    display: 'none',
                  },
                  margin: 0,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 32,
                    padding: '0 8px',
                    '&.Mui-expanded': {
                      minHeight: 32,
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: '4px 0',
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {React.isValidElement(child) && (child.props as any)?.label ? (child.props as any).label : `Filter ${index + 1}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    padding: '8px 0',
                  }}
                >
                  {React.isValidElement(child) 
                    ? React.cloneElement(child as React.ReactElement<any>, { hideTitle: true })
                    : child
                  }
                </AccordionDetails>
              </Accordion>
              {index < React.Children.count(children) - 1 && (
                <Divider sx={{ my: 1 }} />
              )}
            </React.Fragment>
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CollapsibleFilterPanel;
