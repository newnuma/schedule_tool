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
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useFilterActions } from "../../context/FilterContext";

interface CollapsibleFilterPanelProps {
  pageKey: string | string[];
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
  const { clearFilters, activeFilterCount, filtersVersion } = useFilterActions(pageKey);

  // スクロール位置の保持用
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const savedScrollTopRef = React.useRef(0);
  const restoreScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = savedScrollTopRef.current;
  }, []);

  // スクロール位置の保存/復元を強化
  const storageKey = React.useMemo(() => {
    const keys = Array.isArray(pageKey) ? pageKey.join("|") : pageKey;
    return `collapsibleFilterPanel.scrollTop:${keys}`;
  }, [pageKey]);

  const scheduleRestore = React.useCallback(() => {
    // 複数フレームに跨って復元（コンテンツ高さ変動やMUIトランジション対策）
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        restoreScroll();
        // 最後に短いタイマーでもう一度（フォールバック）
        const to = setTimeout(restoreScroll, 30);
        (scheduleRestore as any)._to = to;
      });
      (scheduleRestore as any)._raf2 = raf2;
    });
    (scheduleRestore as any)._raf1 = raf1;
    return () => {
      if ((scheduleRestore as any)._raf1) cancelAnimationFrame((scheduleRestore as any)._raf1);
      if ((scheduleRestore as any)._raf2) cancelAnimationFrame((scheduleRestore as any)._raf2);
      if ((scheduleRestore as any)._to) clearTimeout((scheduleRestore as any)._to);
    };
  }, [restoreScroll]);

  // サブフィルター(子Accordion)の開閉状態を制御・保持
  const computeChildId = React.useCallback((child: React.ReactNode, index: number) => {
    if (React.isValidElement(child) && child.key != null) return String(child.key);
    const lbl = React.isValidElement(child) ? (child.props as any)?.label : undefined;
    return lbl ? `lbl:${String(lbl)}` : `idx:${index}`;
  }, []);
  const childIds = React.useMemo(() => {
    const ids: string[] = [];
    React.Children.forEach(children, (child, index) => {
      ids.push(computeChildId(child, index));
    });
    return ids;
  }, [children, computeChildId]);

  const expandedStorageKey = React.useMemo(() => {
    const keys = Array.isArray(pageKey) ? pageKey.join("|") : pageKey;
    return `collapsibleFilterPanel.expanded:${keys}`;
  }, [pageKey]);

  const [sectionsExpanded, setSectionsExpanded] = React.useState<Record<string, boolean>>(() => {
    let initial: Record<string, boolean> = {};
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(expandedStorageKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') initial = parsed;
      }
    } catch {}
    // 現在の子IDに対して未定義はデフォルト true
    const map: Record<string, boolean> = {};
    childIds.forEach(id => {
      map[id] = initial[id] !== false; // undefined -> true, falseは尊重
    });
    return map;
  });

  // 子IDが増えたらデフォルトtrueで初期化（既存のものは保持）
  React.useEffect(() => {
    setSectionsExpanded(prev => {
      const next = { ...prev } as Record<string, boolean>;
      childIds.forEach(id => {
        if (next[id] === undefined) next[id] = true;
      });
      return next;
    });
  }, [childIds]);

  // 変更を保存
  React.useEffect(() => {
    try {
      sessionStorage.setItem(expandedStorageKey, JSON.stringify(sectionsExpanded));
    } catch {}
  }, [sectionsExpanded, expandedStorageKey]);

  const handleSectionChange = React.useCallback((id: string) => (_: any, expanded: boolean) => {
    setSectionsExpanded(prev => ({ ...prev, [id]: expanded }));
  }, []);

  // activeFilterCount は useFilterActions(pageKey) から取得

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

  // フィルター変更や展開状態の変更後にスクロール位置を復元
  React.useLayoutEffect(() => {
    const cleanup = scheduleRestore();
    return cleanup;
  }, [filtersVersion, panelExpanded, scheduleRestore]);

  // 初期化: セッションからスクロール位置を復元
  React.useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const n = Number(stored);
      if (!Number.isNaN(n)) savedScrollTopRef.current = n;
    }
    // 初回描画後に復元
    const cleanup = scheduleRestore();
    return cleanup;
  }, [storageKey, scheduleRestore]);

  // アンマウント時や他の理由でDOMが外れる前にスクロール位置を保存
  React.useEffect(() => {
    return () => {
      const el = scrollContainerRef.current;
      if (el) savedScrollTopRef.current = el.scrollTop;
    };
  }, []);

  // オブザーバでDOM変更/リサイズ時にも復元
  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const tryRestoreIfNeeded = () => {
      if (!el) return;
      // 以前の位置が0より大きく、現在0や大幅にズレた場合は復元
      if (savedScrollTopRef.current > 0 && Math.abs(el.scrollTop - savedScrollTopRef.current) > 2) {
        el.scrollTop = savedScrollTopRef.current;
      }
    };

    const mo = new MutationObserver(() => {
      // 子要素の追加/削除時
      tryRestoreIfNeeded();
    });
    mo.observe(el, { childList: true, subtree: true });

    const ro = new ResizeObserver(() => {
      // コンテンツ高さの変化時
      tryRestoreIfNeeded();
    });
    ro.observe(el);

    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [panelExpanded]);

  // Reset handler: clear all filters for provided pageKey(s)
  const handleReset = () => {
    const keys = Array.isArray(pageKey) ? pageKey : [pageKey];
    keys.forEach(k => clearFilters(k));
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
          <Box
            ref={scrollContainerRef}
            onScroll={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              savedScrollTopRef.current = el.scrollTop;
              try {
                sessionStorage.setItem(storageKey, String(savedScrollTopRef.current));
              } catch {}
            }}
            sx={{
              maxHeight: 400,
              overflowY: 'auto',
              scrollBehavior: 'auto',
            }}
          >
            {React.Children.map(children, (child, index) => {
              const id = computeChildId(child, index);
              const isExpanded = sectionsExpanded[id] !== false; // 未定義はtrue扱い
              return (
                <React.Fragment key={id}>
                  <Accordion
                    expanded={isExpanded}
                    onChange={handleSectionChange(id)}
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
              );
            })}

            {/* Reset Button Row */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleReset}
                disabled={activeFilterCount === 0}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CollapsibleFilterPanel;
