import React, { useState, useMemo } from 'react';
import { 
  Table, Search, Filter, Download, Dumbbell, Calendar as CalendarIcon, 
  TrendingUp, Scale, Flame, Check, ChevronRight, Layers, ArrowUpDown
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
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
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

      {/* Spreadsheet Table Container */}
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
          <span>💡 Click any row to view full day snapshot</span>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSpreadsheet;
