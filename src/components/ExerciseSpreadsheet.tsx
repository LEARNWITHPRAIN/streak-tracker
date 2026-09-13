import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Dumbbell, Calendar as CalendarIcon, 
  TrendingUp, Scale, Flame, Check, ChevronRight, Layers, ArrowUpDown,
  BarChart2, List, ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SpreadsheetWorkoutRow } from '@/types/exercise';

interface ExerciseSpreadsheetProps {
  data: SpreadsheetWorkoutRow[];
  loading?: boolean;
  onSelectDay?: (dateKey: string) => void;
}

// ─── Mini SVG Trend Sparkline ─────────────────────────────────────────────────
function TrendSparkline({ values, color = '#a855f7' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const w = 120, h = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 8) + 4;
    const y = h - 6 - ((v - min) / range) * (h - 12);
    return `${x},${y}`;
  });
  const pointsStr = pts.join(' ');
  const lastX = pts[pts.length - 1].split(',')[0];
  const lastY = pts[pts.length - 1].split(',')[1];

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGrad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pts[0].split(',')[0]},${h} ${pointsStr} ${lastX},${h}`}
        fill={`url(#sparkGrad-${color.replace('#','')})`}
      />
      <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(lastX)} cy={parseFloat(lastY)} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Progress View: Per-Exercise Session Timeline ─────────────────────────────
function ExerciseProgressView({
  exerciseName,
  sessions,
  onSelectDay,
}: {
  exerciseName: string;
  sessions: SpreadsheetWorkoutRow[];
  onSelectDay?: (date: string) => void;
}) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => a.date.localeCompare(b.date)),
    [sessions]
  );

  const weightTrend = sorted.map(s => s.maxWeightKg ?? 0);
  const volumeTrend = sorted.map(s => s.totalVolumeKg);
  const hasWeight = weightTrend.some(w => w > 0);

  const delta = (curr: number, prev: number) => {
    if (curr > prev) return 'up' as const;
    if (curr < prev) return 'down' as const;
    return 'same' as const;
  };

  return (
    <div className="space-y-5">
      {/* Header with sparklines */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-900/10 border border-primary/20">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Exercise Progress</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">{exerciseName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{sorted.length} session{sorted.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <div className="flex gap-6 items-end">
          {hasWeight && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Top Weight</span>
              <TrendSparkline values={weightTrend} color="#a855f7" />
            </div>
          )}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Volume</span>
            <TrendSparkline values={volumeTrend} color="#22d3ee" />
          </div>
        </div>
      </div>

      {/* Session Timeline */}
      <div className="relative space-y-0">
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border/60 pointer-events-none" />

        {sorted.map((session, idx) => {
          const isExpanded = expandedSession === session.date;
          const prev = idx > 0 ? sorted[idx - 1] : null;

          const wDelta = prev ? delta(session.maxWeightKg ?? 0, prev.maxWeightKg ?? 0) : 'same';
          const vDelta = prev ? delta(session.totalVolumeKg, prev.totalVolumeKg) : 'same';
          const wDiff = prev && hasWeight ? Math.round((session.maxWeightKg ?? 0) - (prev.maxWeightKg ?? 0)) : 0;
          const vDiff = prev ? Math.round(session.totalVolumeKg - prev.totalVolumeKg) : 0;
          const isLatest = idx === sorted.length - 1;

          return (
            <div key={session.date} className="relative flex gap-4 pb-3">
              {/* Timeline dot */}
              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                isLatest
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                  : session.isComplete
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-muted/60 border-border text-muted-foreground'
              }`}>
                {isLatest ? <TrendingUp className="w-4 h-4" /> : <span className="text-[11px] font-bold">{idx + 1}</span>}
              </div>

              {/* Session Card */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : session.date)}
                  className="w-full text-left"
                >
                  <div className={`rounded-2xl border transition-all duration-200 ${
                    isExpanded ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card/60 hover:border-primary/30 hover:bg-card/80'
                  }`}>
                    {/* Card row */}
                    <div className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <div className="text-[11px] text-muted-foreground font-semibold">{session.dayName || ''}</div>
                          <div className="text-sm font-bold text-foreground font-mono leading-tight">{session.date}</div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          session.isComplete ? 'bg-primary/15 text-primary border-primary/40' : 'bg-muted/50 text-muted-foreground border-border/40'
                        }`}>
                          {session.setsCompleted}/{session.totalSets} sets
                        </span>
                        {hasWeight && (
                          <span className="text-sm font-bold text-foreground font-mono">
                            {session.maxWeightKg ? `${session.maxWeightKg} kg` : 'BW'}
                            {prev && wDiff !== 0 && (
                              <span className={`ml-1.5 text-[11px] font-semibold ${wDelta === 'up' ? 'text-emerald-500' : 'text-red-400'}`}>
                                {wDelta === 'up' ? '+' : ''}{wDiff}kg
                              </span>
                            )}
                          </span>
                        )}
                        {session.totalVolumeKg > 0 && (
                          <span className="text-xs text-muted-foreground font-mono">
                            Vol: <span className="text-foreground font-semibold">{session.totalVolumeKg.toLocaleString()} kg</span>
                            {prev && vDiff !== 0 && (
                              <span className={`ml-1 text-[10px] ${vDelta === 'up' ? 'text-emerald-500' : 'text-red-400'}`}>
                                ({vDelta === 'up' ? '+' : ''}{vDiff})
                              </span>
                            )}
                          </span>
                        )}
                        {prev && (
                          <span>
                            {vDelta === 'up' && <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />}
                            {vDelta === 'down' && <ArrowDown className="w-3.5 h-3.5 text-red-400" />}
                            {vDelta === 'same' && <Minus className="w-3 h-3 text-muted-foreground" />}
                          </span>
                        )}
                        {isLatest && (
                          <span className="text-[9px] bg-primary text-white rounded-full px-1.5 py-0.5 font-bold">Latest</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                        <span className="text-[10px] font-medium hidden sm:block">{isExpanded ? 'Hide' : 'Sets'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Expanded set detail */}
                    {isExpanded && (
                      <div className="border-t border-border/50 px-4 py-3 space-y-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Set Detail</div>
                        <div className="flex flex-wrap gap-2">
                          {session.sets && session.sets.length > 0 ? session.sets.map((s, sIdx) => {
                            const weightLabel = s.weight !== null && s.weight > 0 ? `${s.weight} kg` : 'BW';
                            const repsLabel = s.reps ? `× ${s.reps}` : '';
                            return (
                              <div key={sIdx} className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 min-w-[72px] text-center ${
                                s.completed ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/40 border-border/40 text-muted-foreground opacity-60'
                              }`}>
                                <span className="text-[10px] font-semibold text-muted-foreground mb-0.5">Set {sIdx + 1}</span>
                                <span className="text-sm font-bold font-mono leading-tight">{weightLabel}</span>
                                {repsLabel && <span className="text-[10px] font-medium mt-0.5">{repsLabel}</span>}
                                {s.completed && <Check className="w-3 h-3 mt-1 stroke-[3]" />}
                              </div>
                            );
                          }) : (
                            <span className="text-xs text-muted-foreground italic">No detailed set data recorded</span>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); onSelectDay?.(session.date); }}
                          className="mt-2 text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline"
                        >
                          Open full day snapshot <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



export const ExerciseSpreadsheet: React.FC<ExerciseSpreadsheetProps> = ({
  data,
  loading = false,
  onSelectDay,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'month' | '30days'>('all');
  const [sortField, setSortField] = useState<'date' | 'exercise' | 'volume' | 'weight'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  // 'table' = classic spreadsheet, 'progress' = per-exercise timeline
  const [viewMode, setViewMode] = useState<'table' | 'progress'>('table');

  // Extract unique exercise names for filtering
  const uniqueExercises = useMemo(() => {
    const names = new Set<string>();
    data.forEach(row => {
      if (row.exerciseName) names.add(row.exerciseName);
    });
    return Array.from(names).sort();
  }, [data]);

  // Determine max number of sets across all rows to dynamically generate Set 1..Set N columns
  const maxSetCount = useMemo(() => {
    let max = 3;
    data.forEach(row => {
      if (row.sets && row.sets.length > max) {
        max = Math.min(row.sets.length, 8); // Cap max spreadsheet columns at 8 for readability
      }
    });
    return max;
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

    return data.filter(row => {
      // Exercise filter
      if (selectedExercise !== 'all' && row.exerciseName.toLowerCase() !== selectedExercise.toLowerCase()) {
        return false;
      }

      // Date range filter
      if (dateRange === 'month' && !row.date.startsWith(currentMonthKey)) {
        return false;
      }
      if (dateRange === '30days' && row.date < thirtyDaysStr) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = row.exerciseName.toLowerCase().includes(q);
        const matchesDate = row.date.includes(q) || (row.dayName && row.dayName.toLowerCase().includes(q));
        if (!matchesName && !matchesDate) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'exercise') {
        comparison = a.exerciseName.localeCompare(b.exerciseName);
      } else if (sortField === 'volume') {
        comparison = a.totalVolumeKg - b.totalVolumeKg;
      } else if (sortField === 'weight') {
        comparison = (a.maxWeightKg || 0) - (b.maxWeightKg || 0);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [data, selectedExercise, dateRange, searchQuery, sortField, sortAsc]);

  // Overall Statistics calculated from filtered data
  const stats = useMemo(() => {
    const totalSetsCompleted = filteredData.reduce((sum, r) => sum + r.setsCompleted, 0);
    const totalVolume = filteredData.reduce((sum, r) => sum + r.totalVolumeKg, 0);
    const uniqueDates = new Set(filteredData.map(r => r.date)).size;
    let heaviest = 0;
    filteredData.forEach(r => {
      if (r.maxWeightKg && r.maxWeightKg > heaviest) {
        heaviest = r.maxWeightKg;
      }
    });

    return {
      totalSetsCompleted,
      totalVolume,
      uniqueDates,
      heaviest,
    };
  }, [filteredData]);

  // Export to CSV Function
  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    // Headers
    const setHeaders = Array.from({ length: maxSetCount }, (_, i) => `Set ${i + 1} (kg)`).join(',');
    const headers = `Date,Day,Exercise,${setHeaders},Sets Done,Total Sets,Max Weight (kg),Total Volume (kg),Completion %\n`;

    // Rows
    const rows = filteredData.map(row => {
      const setCols = Array.from({ length: maxSetCount }, (_, i) => {
        const s = row.sets?.[i];
        if (!s) return '';
        if (s.weight === null || s.weight === 0) return `BW${s.completed ? ' (done)' : ''}`;
        return `${s.weight}${s.completed ? ' (done)' : ''}`;
      }).join(',');

      return [
        `"${row.date}"`,
        `"${row.dayName || ''}"`,
        `"${row.exerciseName.replace(/"/g, '""')}"`,
        setCols,
        row.setsCompleted,
        row.totalSets,
        row.maxWeightKg !== null ? row.maxWeightKg : 'BW',
        row.totalVolumeKg,
        `"${row.completionRate}%"`,
      ].join(',');
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `yodha_workout_progress_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: 'date' | 'exercise' | 'volume' | 'weight') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Auto-switch to progress view when a specific exercise is chosen
  const handleExerciseChange = (val: string) => {
    setSelectedExercise(val);
    setViewMode(val !== 'all' ? 'progress' : 'table');
  };

  // Sessions for the selected exercise (sorted oldest→newest) for progress view
  const progressSessions = useMemo(() => {
    if (selectedExercise === 'all') return [];
    return filteredData.filter(
      r => r.exerciseName.toLowerCase() === selectedExercise.toLowerCase()
    );
  }, [filteredData, selectedExercise]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card/60 border border-border/50 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            Workout Days
          </span>
          <span className="text-xl font-bold font-mono text-foreground mt-1">
            {stats.uniqueDates}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card/60 border border-border/50 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Sets Crushed
          </span>
          <span className="text-xl font-bold font-mono text-foreground mt-1">
            {stats.totalSetsCompleted}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card/60 border border-border/50 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-primary" />
            Top Weight
          </span>
          <span className="text-xl font-bold font-mono text-foreground mt-1">
            {stats.heaviest > 0 ? `${stats.heaviest} kg` : 'Bodyweight'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card/60 border border-border/50 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            Total Volume
          </span>
          <span className="text-xl font-bold font-mono text-primary mt-1">
            {stats.totalVolume.toLocaleString()} kg
          </span>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/50 border border-border/50">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise or date..."
              className="h-9 pl-8 text-xs bg-background/80 rounded-xl"
            />
          </div>

          {/* Exercise Filter */}
          <Select value={selectedExercise} onValueChange={handleExerciseChange}>
            <SelectTrigger className="h-9 text-xs bg-background/80 rounded-xl w-[160px]">
              <Filter className="w-3 h-3 mr-1 text-primary" />
              <SelectValue placeholder="All Exercises" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exercises ({uniqueExercises.length})</SelectItem>
              {uniqueExercises.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
            <SelectTrigger className="h-9 text-xs bg-background/80 rounded-xl w-[130px]">
              <CalendarIcon className="w-3 h-3 mr-1 text-primary" />
              <SelectValue placeholder="All History" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All History</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle — visible only when an exercise is selected */}
          {selectedExercise !== 'all' && (
            <div className="flex items-center rounded-xl border border-border/50 overflow-hidden bg-background/80">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 h-9 text-xs font-semibold transition-colors ${
                  viewMode === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table view"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('progress')}
                className={`flex items-center gap-1.5 px-3 h-9 text-xs font-semibold transition-colors ${
                  viewMode === 'progress' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Progress timeline"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Progress</span>
              </button>
            </div>
          )}

          {/* CSV Export Button */}
          <Button
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            size="sm"
            variant="outline"
            className="h-9 text-xs font-semibold rounded-xl border-primary/30 hover:bg-primary/10 text-primary"
            title="Download as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Conditional: Progress Timeline or Spreadsheet Table ── */}
      {viewMode === 'progress' && selectedExercise !== 'all' ? (
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 shadow-lg">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm animate-pulse">Loading progress data...</div>
          ) : progressSessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <BarChart2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              No sessions logged for this exercise yet.
            </div>
          ) : (
            <ExerciseProgressView
              exerciseName={selectedExercise}
              sessions={progressSessions}
              onSelectDay={onSelectDay}
            />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th 
                  className="py-3 px-3.5 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date & Day</span>
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3.5 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('exercise')}
                >
                  <div className="flex items-center gap-1">
                    <span>Exercise</span>
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                  </div>
                </th>

                {/* Dynamic Set Columns (Set 1 .. Set N) */}
                {Array.from({ length: maxSetCount }).map((_, idx) => (
                  <th key={idx} className="py-3 px-2 text-center">
                    Set {idx + 1}
                  </th>
                ))}

                <th className="py-3 px-3 text-center">Sets Done</th>
                <th 
                  className="py-3 px-3 text-center cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('weight')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Top Wt</span>
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-center cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('volume')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Volume</span>
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-right">Progress</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border/40 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={maxSetCount + 6} className="py-12 text-center text-muted-foreground font-sans animate-pulse">
                    Loading spreadsheet workout data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={maxSetCount + 6} className="py-12 text-center text-muted-foreground font-sans">
                    <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    No workout logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, rIdx) => {
                  const isFullyDone = row.isComplete;

                  return (
                    <tr
                      key={`${row.date}-${row.exerciseId}-${rIdx}`}
                      onClick={() => onSelectDay && onSelectDay(row.date)}
                      className="hover:bg-primary/5 transition-colors cursor-pointer group"
                    >
                      {/* Date & Day */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{row.date}</span>
                          {row.dayName && (
                            <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground">
                              {row.dayName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Exercise Name */}
                      <td className="py-2.5 px-3.5 font-sans font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Dumbbell className={`w-3.5 h-3.5 shrink-0 ${isFullyDone ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="group-hover:text-primary transition-colors">{row.exerciseName}</span>
                        </div>
                      </td>

                      {/* Set 1 .. Set N Cells */}
                      {Array.from({ length: maxSetCount }).map((_, sIdx) => {
                        const s = row.sets?.[sIdx];

                        if (!s) {
                          return (
                            <td key={sIdx} className="py-2 px-2 text-center text-muted-foreground/30">
                              -
                            </td>
                          );
                        }

                        const weightLabel = s.weight !== null && s.weight > 0 ? `${s.weight}k` : 'BW';

                        return (
                          <td key={sIdx} className="py-2 px-1.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                s.completed
                                  ? 'bg-primary/15 text-primary border border-primary/30'
                                  : 'bg-muted/30 text-muted-foreground border border-border/30 opacity-70'
                              }`}
                            >
                              <span>{weightLabel}</span>
                              {s.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                          </td>
                        );
                      })}

                      {/* Sets Done / Total */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap text-muted-foreground">
                        <span className={`font-bold ${isFullyDone ? 'text-primary' : 'text-foreground'}`}>
                          {row.setsCompleted}
                        </span>
                        /{row.totalSets}
                      </td>

                      {/* Top Weight */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {row.maxWeightKg !== null ? (
                          <span className="text-primary font-bold">{row.maxWeightKg} kg</span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-sans">BW</span>
                        )}
                      </td>

                      {/* Total Volume */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap text-foreground font-semibold">
                        {row.totalVolumeKg > 0 ? `${row.totalVolumeKg.toLocaleString()} kg` : '-'}
                      </td>

                      {/* Progress Badge */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-sans">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            isFullyDone
                              ? 'bg-primary/20 text-primary border-primary/40'
                              : row.completionRate > 0
                              ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                              : 'bg-muted/50 text-muted-foreground border-border/40'
                          }`}
                        >
                          {row.completionRate}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-muted/20 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-sans">
          <span>Showing {filteredData.length} exercise workout logs</span>
          <span>💡 Pick an exercise above → <TrendingUp className="inline w-3 h-3 mx-0.5" /> Progress to see your improvement</span>
        </div>
      </div>
      )}
    </div>
  );
};

export default ExerciseSpreadsheet;
