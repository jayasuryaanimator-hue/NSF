import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateFilterProps {
  dateFilter: string;
  monthFilter: string;
  yearFilter: string;
  onDateChange: (date: string) => void;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  onReset?: () => void;
}

const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function DateFilter({
  dateFilter,
  monthFilter,
  yearFilter,
  onDateChange,
  onMonthChange,
  onYearChange,
  onReset,
}: DateFilterProps) {
  const hasActiveFilter = dateFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={yearFilter} onValueChange={onYearChange}>
        <SelectTrigger className="w-28 h-9 text-sm">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={monthFilter} onValueChange={onMonthChange}>
        <SelectTrigger className="w-32 h-9 text-sm">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="date"
          value={dateFilter === 'all' ? '' : dateFilter}
          onChange={(e) => onDateChange(e.target.value || 'all')}
          className="w-40 h-9 pl-10 text-sm"
        />
      </div>

      {hasActiveFilter && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

export function useDateFilter() {
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  const resetFilters = () => {
    setDateFilter('all');
    setMonthFilter('all');
    setYearFilter(new Date().getFullYear().toString());
  };

  const filterByDate = <T extends { created_at: string }>(items: T[] | undefined): T[] => {
    if (!items) return [];

    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      
      // Date filter (exact date)
      if (dateFilter !== 'all') {
        const filterDate = format(new Date(dateFilter), 'yyyy-MM-dd');
        const itemDateStr = format(itemDate, 'yyyy-MM-dd');
        if (filterDate !== itemDateStr) return false;
      }

      // Month filter
      if (monthFilter !== 'all') {
        const itemMonth = format(itemDate, 'MM');
        const itemYear = format(itemDate, 'yyyy');
        if (itemMonth !== monthFilter || itemYear !== yearFilter) return false;
      }

      // Year filter (when no month selected)
      if (yearFilter !== 'all' && monthFilter === 'all' && dateFilter === 'all') {
        const itemYear = format(itemDate, 'yyyy');
        if (itemYear !== yearFilter) return false;
      }

      return true;
    });
  };

  return {
    dateFilter,
    monthFilter,
    yearFilter,
    setDateFilter,
    setMonthFilter,
    setYearFilter,
    resetFilters,
    filterByDate,
  };
}
