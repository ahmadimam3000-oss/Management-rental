import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
  Bike,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  LayoutGrid,
  ListFilter,
  MessageSquare,
  LogIn,
  LogOut,
  Check,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { MotorMaster, TransaksiSewa, FrequentRenter } from '../types/rental';
import {
  formatRupiah,
  formatIndonesianDateTime,
  checkIsOverdue,
  INDONESIAN_DAYS,
  INDONESIAN_MONTHS_SHORT,
} from '../utils/formatters';

interface RentalScheduleCalendarProps {
  fleet: MotorMaster[];
  transactions: TransaksiSewa[];
  frequentRenters?: FrequentRenter[];
  activeBookYear: number;
  onCheckInRow: (trxId: string) => void;
  onCheckOutRow: (trxId: string) => void;
  onOpenWhatsApp: (trx: TransaksiSewa) => void;
  onOpenNewRentalOnDate: (params: {
    nopol?: string;
    startDateIso?: string;
    statusUnit?: 'Disewa' | 'Booking';
  }) => void;
}

const FULL_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getStartOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function getEndOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function doesTransactionOverlapDay(trx: TransaksiSewa, dayDate: Date): boolean {
  const start = new Date(trx.waktuStartSewa);
  const end = new Date(trx.waktuSelesai || trx.estWaktuKembali || trx.waktuStartSewa);
  if (isNaN(start.getTime())) return false;
  const effectiveEnd = isNaN(end.getTime()) ? start : end;

  const dayStart = getStartOfDay(dayDate).getTime();
  const dayEnd = getEndOfDay(dayDate).getTime();

  return start.getTime() <= dayEnd && effectiveEnd.getTime() >= dayStart;
}

function isSameCalendarDay(isoStr: string | undefined, targetDate: Date): boolean {
  if (!isoStr) return false;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth() === targetDate.getMonth() &&
    d.getDate() === targetDate.getDate()
  );
}

export const RentalScheduleCalendar: React.FC<RentalScheduleCalendarProps> = ({
  fleet,
  transactions,
  activeBookYear,
  onCheckInRow,
  onCheckOutRow,
  onOpenWhatsApp,
  onOpenNewRentalOnDate,
}) => {
  const today = useMemo(() => new Date(), []);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const now = new Date();
    if (now.getFullYear() !== activeBookYear) {
      return new Date(activeBookYear, now.getMonth(), 1);
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [calendarSubView, setCalendarSubView] = useState<'monthly' | 'fleet_matrix'>('monthly');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Booking' | 'Disewa' | 'Overdue' | 'Selesai' | 'Refund'>('ALL');
  const [selectedBikeFilter, setSelectedBikeFilter] = useState<string>('ALL');

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      if (selectedBikeFilter !== 'ALL' && trx.nopolMotor !== selectedBikeFilter) {
        return false;
      }
      if (statusFilter !== 'ALL') {
        const { isOverdue } = checkIsOverdue(trx);
        const effectiveStatus = isOverdue && trx.statusUnit !== 'Selesai' ? 'Overdue' : trx.statusUnit;
        if (effectiveStatus !== statusFilter) return false;
      }
      return true;
    });
  }, [transactions, selectedBikeFilter, statusFilter]);

  // Build 42-day calendar grid (starting Monday for Indonesian business standard)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      overlappingTrxs: TransaksiSewa[];
      startingPickups: TransaksiSewa[];
      returningDropoffs: TransaksiSewa[];
    }> = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d,
        dateKey: toDateKey(d),
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: toDateKey(d) === toDateKey(today),
        isSelected: toDateKey(d) === toDateKey(selectedDate),
        overlappingTrxs: filteredTransactions.filter((t) => doesTransactionOverlapDay(t, d)),
        startingPickups: filteredTransactions.filter((t) => isSameCalendarDay(t.waktuStartSewa, d)),
        returningDropoffs: filteredTransactions.filter((t) =>
          isSameCalendarDay(t.waktuSelesai || t.estWaktuKembali, d)
        ),
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      days.push({
        date: d,
        dateKey: toDateKey(d),
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: toDateKey(d) === toDateKey(today),
        isSelected: toDateKey(d) === toDateKey(selectedDate),
        overlappingTrxs: filteredTransactions.filter((t) => doesTransactionOverlapDay(t, d)),
        startingPickups: filteredTransactions.filter((t) => isSameCalendarDay(t.waktuStartSewa, d)),
        returningDropoffs: filteredTransactions.filter((t) =>
          isSameCalendarDay(t.waktuSelesai || t.estWaktuKembali, d)
        ),
      });
    }

    // Next month padding up to 35 or 42 cells
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateKey: toDateKey(d),
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: toDateKey(d) === toDateKey(today),
        isSelected: toDateKey(d) === toDateKey(selectedDate),
        overlappingTrxs: filteredTransactions.filter((t) => doesTransactionOverlapDay(t, d)),
        startingPickups: filteredTransactions.filter((t) => isSameCalendarDay(t.waktuStartSewa, d)),
        returningDropoffs: filteredTransactions.filter((t) =>
          isSameCalendarDay(t.waktuSelesai || t.estWaktuKembali, d)
        ),
      });
    }

    return days;
  }, [year, month, today, selectedDate, filteredTransactions]);

  // Days of the current month for the 13-Fleet Gantt Matrix
  const monthDaysArray = useMemo(() => {
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, idx) => new Date(year, month, idx + 1));
  }, [year, month]);

  // Selected day details
  const selectedDaySchedules = useMemo(() => {
    return filteredTransactions
      .filter((t) => doesTransactionOverlapDay(t, selectedDate))
      .sort((a, b) => new Date(a.waktuStartSewa).getTime() - new Date(b.waktuStartSewa).getTime());
  }, [filteredTransactions, selectedDate]);

  // Available units on selectedDate
  const availableBikesOnSelectedDate = useMemo(() => {
    const busyNopols = new Set(
      transactions
        .filter(
          (t) =>
            t.statusUnit !== 'Selesai' &&
            t.statusUnit !== 'Refund' &&
            doesTransactionOverlapDay(t, selectedDate)
        )
        .map((t) => t.nopolMotor)
    );
    return fleet.filter((b) => !busyNopols.has(b.nopol) && b.status !== 'Perawatan');
  }, [fleet, transactions, selectedDate]);

  // Summary metrics for current month & today
  const summaryStats = useMemo(() => {
    const activeRentalsNow = transactions.filter((t) => t.statusUnit === 'Disewa').length;
    const upcomingBookings = transactions.filter((t) => t.statusUnit === 'Booking').length;
    const overdueCount = transactions.filter((t) => {
      const { isOverdue } = checkIsOverdue(t);
      return isOverdue && t.statusUnit !== 'Selesai';
    }).length;
    const todayPickupsOrReturns = transactions.filter(
      (t) =>
        isSameCalendarDay(t.waktuStartSewa, today) ||
        isSameCalendarDay(t.estWaktuKembali, today)
    ).length;

    return {
      activeRentalsNow,
      upcomingBookings,
      overdueCount,
      todayPickupsOrReturns,
    };
  }, [transactions, today]);

  const handleCreateScheduleOnSelectedDate = (
    statusUnit: 'Booking' | 'Disewa' = 'Booking',
    nopol?: string
  ) => {
    const d = new Date(selectedDate);
    const now = new Date();
    d.setHours(now.getHours(), 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:00`;
    onOpenNewRentalOnDate({
      nopol,
      startDateIso: localIso,
      statusUnit,
    });
  };

  const selectedDateFormatted = `${INDONESIAN_DAYS[selectedDate.getDay()]}, ${selectedDate.getDate()} ${
    FULL_MONTH_NAMES[selectedDate.getMonth()]
  } ${selectedDate.getFullYear()}`;

  return (
    <div className="space-y-5">
      {/* Top Operational Schedule Header & KPI Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Kalender Jadwal Sewa &amp; Booking Armada
                </h1>
                <p className="text-xs text-slate-400">
                  Pantau jadwal keluar-masuk motor, pesanan booking mendatang, dan ketersediaan {fleet.length} unit per tanggal
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCreateScheduleOnSelectedDate('Booking')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CalendarClock className="w-4 h-4 shrink-0" />
              <span>+ Jadwal Booking</span>
            </button>
            <button
              onClick={() => handleCreateScheduleOnSelectedDate('Disewa')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>+ Sewa Langsung</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Strip Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Sedang Disewa</div>
              <div className="text-lg sm:text-xl font-black text-cyan-400 font-mono mt-0.5">
                {summaryStats.activeRentalsNow} <span className="text-xs font-normal text-slate-400">Unit</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bike className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Booking Terjadwal</div>
              <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5">
                {summaryStats.upcomingBookings} <span className="text-xs font-normal text-slate-400">Jadwal</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Agenda Hari Ini</div>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                {summaryStats.todayPickupsOrReturns} <span className="text-xs font-normal text-slate-400">Aktivitas</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Lewat Waktu (Overdue)</div>
              <div className="text-lg sm:text-xl font-black text-rose-400 font-mono mt-0.5">
                {summaryStats.overdueCount} <span className="text-xs font-normal text-slate-400">Unit</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation & View Mode Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-sm sm:text-base font-extrabold text-white min-w-[150px] text-center">
              {FULL_MONTH_NAMES[month]} {year}
            </div>
            <button
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleGoToToday}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Hari Ini
          </button>
        </div>

        {/* Sub-view Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-view mode toggle: Monthly Grid vs Fleet Timeline Matrix */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setCalendarSubView('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                calendarSubView === 'monthly'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kalender Bulanan</span>
            </button>
            <button
              onClick={() => setCalendarSubView('fleet_matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                calendarSubView === 'fleet_matrix'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Matriks {fleet.length} Unit</span>
            </button>
          </div>

          {/* Filter by Motor Unit */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedBikeFilter}
              onChange={(e) => setSelectedBikeFilter(e.target.value)}
              aria-label="Filter Unit Motor"
              className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">Semua Armada ({fleet.length} Unit)</option>
              {fleet.map((b) => (
                <option key={b.nopol} value={b.nopol}>
                  {b.namaUnit} · {b.nopol}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'ALL' | 'Booking' | 'Disewa' | 'Overdue' | 'Selesai' | 'Refund'
              )
            }
            aria-label="Filter Status Jadwal"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="Booking">Booking (Pesanan)</option>
            <option value="Disewa">Sedang Disewa</option>
            <option value="Overdue">Overdue (Telat)</option>
            <option value="Selesai">Selesai Kembali</option>
            <option value="Refund">Refund / Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Main Content Split: Calendar Grid / Matrix on Left + Selected Date Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Monthly Grid OR Fleet Matrix */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {calendarSubView === 'monthly' ? (
            <div>
              {/* Weekday Header (Senin - Minggu) */}
              <div className="grid grid-cols-7 bg-slate-950/90 border-b border-slate-800 text-center py-2.5">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dayLabel, i) => (
                  <div
                    key={dayLabel}
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      i >= 5 ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    {dayLabel}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/80 border-b border-slate-800">
                {calendarDays.map((cell) => {
                  const activeCellTrxs = cell.overlappingTrxs;
                  const bookingCount = activeCellTrxs.filter(
                    (t) => t.statusUnit === 'Booking'
                  ).length;
                  const rentedCount = activeCellTrxs.filter(
                    (t) => t.statusUnit === 'Disewa'
                  ).length;
                  const overdueCount = activeCellTrxs.filter((t) => {
                    const { isOverdue } = checkIsOverdue(t);
                    return isOverdue && t.statusUnit !== 'Selesai';
                  }).length;

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      onClick={() => setSelectedDate(cell.date)}
                      className={`min-h-[82px] sm:min-h-[108px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                        !cell.isCurrentMonth
                          ? 'bg-slate-950/50 text-slate-600'
                          : 'bg-slate-900/60 hover:bg-slate-800/60 text-slate-200'
                      } ${
                        cell.isSelected
                          ? 'ring-2 ring-inset ring-cyan-400 bg-cyan-950/25'
                          : ''
                      }`}
                    >
                      {/* Top Row: Day Number + Pickup/Return Badges */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center ${
                            cell.isToday
                              ? 'bg-cyan-400 text-slate-950 shadow-sm'
                              : cell.isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : cell.isCurrentMonth
                              ? 'text-slate-200'
                              : 'text-slate-600'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Compact dots on mobile / badges on desktop */}
                        {activeCellTrxs.length > 0 && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-slate-300">
                            {activeCellTrxs.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips List (Desktop) & Status Bars (Mobile) */}
                      <div className="mt-1.5 space-y-1 w-full overflow-hidden">
                        {activeCellTrxs.slice(0, 3).map((trx) => {
                          const { isOverdue } = checkIsOverdue(trx);
                          const isStart = isSameCalendarDay(trx.waktuStartSewa, cell.date);
                          const isReturn = isSameCalendarDay(
                            trx.waktuSelesai || trx.estWaktuKembali,
                            cell.date
                          );

                          let chipStyle =
                            'bg-cyan-950/90 border-cyan-700/70 text-cyan-200';
                          if (trx.statusUnit === 'Booking') {
                            chipStyle =
                              'bg-amber-950/90 border-amber-700/70 text-amber-200';
                          } else if (trx.statusUnit === 'Refund') {
                            chipStyle =
                              'bg-purple-950/80 border-purple-700/60 text-purple-200 line-through opacity-80';
                          } else if (isOverdue && trx.statusUnit !== 'Selesai') {
                            chipStyle =
                              'bg-rose-950/90 border-rose-700/70 text-rose-200';
                          } else if (trx.statusUnit === 'Selesai') {
                            chipStyle =
                              'bg-emerald-950/80 border-emerald-800/60 text-emerald-300';
                          }

                          return (
                            <div
                              key={`${cell.dateKey}-${trx.id}`}
                              className={`px-1.5 py-0.5 rounded border text-[10px] leading-tight truncate font-medium ${chipStyle}`}
                            >
                              <span className="font-mono font-bold">
                                {trx.nopolMotor.replace(/^N\s+/, '')}
                              </span>
                              <span className="hidden sm:inline">
                                {' '}
                                · {trx.namaPenyewa}
                              </span>
                              {isStart && (
                                <span
                                  title="Mulai Sewa"
                                  className="hidden xl:inline ml-1 text-[9px] opacity-80"
                                >
                                  (Ambil)
                                </span>
                              )}
                              {!isStart && isReturn && (
                                <span
                                  title="Jadwal Kembali"
                                  className="hidden xl:inline ml-1 text-[9px] opacity-80"
                                >
                                  (Kembali)
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {activeCellTrxs.length > 3 && (
                          <div className="text-[10px] font-semibold text-cyan-400 pl-1">
                            +{activeCellTrxs.length - 3} jadwal lainnya
                          </div>
                        )}
                      </div>

                      {/* Bottom status indicator bar */}
                      <div className="flex items-center gap-1 mt-1 w-full">
                        {bookingCount > 0 && (
                          <span
                            className="h-1 flex-1 rounded-full bg-amber-400"
                            title={`${bookingCount} Booking`}
                          />
                        )}
                        {rentedCount > 0 && (
                          <span
                            className="h-1 flex-1 rounded-full bg-cyan-400"
                            title={`${rentedCount} Disewa`}
                          />
                        )}
                        {overdueCount > 0 && (
                          <span
                            className="h-1 flex-1 rounded-full bg-rose-500"
                            title={`${overdueCount} Overdue`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend Footer */}
              <div className="px-4 py-3 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                    <span>Booking Terjadwal</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                    <span>Sedang Disewa</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                    <span>Overdue / Lewat Waktu</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                    <span>Selesai</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Klik tanggal untuk melihat rincian jam ambil/kembali &amp; tambah booking baru
                </div>
              </div>
            </div>
          ) : (
            /* 13-Fleet Unit Monthly Timeline Matrix View */
            <div>
              <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    Matriks Ketersediaan &amp; Jadwal {fleet.length} Unit Armada ({FULL_MONTH_NAMES[month]} {year})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Klik kotak tanggal pada baris motor untuk melihat jadwal atau langsung membuat booking unit tersebut
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800">
                      <th className="sticky left-0 z-10 bg-slate-950 px-3 py-2.5 text-[11px] font-bold text-slate-300 border-r border-slate-800 min-w-[155px]">
                        Unit Armada
                      </th>
                      {monthDaysArray.map((d) => {
                        const isTodayCol = toDateKey(d) === toDateKey(today);
                        const isSelectedCol = toDateKey(d) === toDateKey(selectedDate);
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        return (
                          <th
                            key={toDateKey(d)}
                            onClick={() => setSelectedDate(d)}
                            className={`px-1 py-2 text-center min-w-[32px] border-r border-slate-800/60 cursor-pointer transition-colors ${
                              isSelectedCol
                                ? 'bg-cyan-950/60 text-cyan-300'
                                : isTodayCol
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : isWeekend
                                ? 'bg-slate-900/90 text-amber-400'
                                : 'text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            <div className="text-[9px] uppercase leading-none">
                              {INDONESIAN_DAYS[d.getDay()].slice(0, 3)}
                            </div>
                            <div className="text-xs font-mono font-bold mt-0.5">
                              {d.getDate()}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {fleet
                      .filter(
                        (b) =>
                          selectedBikeFilter === 'ALL' || b.nopol === selectedBikeFilter
                      )
                      .map((bike) => (
                        <tr
                          key={bike.nopol}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="sticky left-0 z-10 bg-slate-900 px-3 py-2 border-r border-slate-800">
                            <div className="text-xs font-bold text-white truncate">
                              {bike.namaUnit}
                            </div>
                            <div className="text-[10px] font-mono text-cyan-400">
                              {bike.nopol}
                            </div>
                          </td>
                          {monthDaysArray.map((d) => {
                            const matchingTrx = transactions.find(
                              (t) =>
                                t.nopolMotor === bike.nopol &&
                                t.statusUnit !== 'Refund' &&
                                doesTransactionOverlapDay(t, d)
                            );
                            const isSelectedCell =
                              toDateKey(d) === toDateKey(selectedDate);

                            let cellBg = 'hover:bg-slate-800/80';
                            let cellIndicator = null;

                            if (matchingTrx) {
                              const { isOverdue } = checkIsOverdue(matchingTrx);
                              if (matchingTrx.statusUnit === 'Booking') {
                                cellBg = 'bg-amber-500/25 hover:bg-amber-500/40';
                                cellIndicator = (
                                  <span
                                    title={`Booking: ${matchingTrx.namaPenyewa}`}
                                    className="w-4 h-4 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center mx-auto"
                                  >
                                    B
                                  </span>
                                );
                              } else if (
                                isOverdue &&
                                matchingTrx.statusUnit !== 'Selesai'
                              ) {
                                cellBg = 'bg-rose-500/30 hover:bg-rose-500/45';
                                cellIndicator = (
                                  <span
                                    title={`Overdue: ${matchingTrx.namaPenyewa}`}
                                    className="w-4 h-4 rounded-md bg-rose-500 text-white font-black text-[9px] flex items-center justify-center mx-auto"
                                  >
                                    !
                                  </span>
                                );
                              } else if (matchingTrx.statusUnit === 'Disewa') {
                                cellBg = 'bg-cyan-500/25 hover:bg-cyan-500/40';
                                cellIndicator = (
                                  <span
                                    title={`Disewa: ${matchingTrx.namaPenyewa}`}
                                    className="w-4 h-4 rounded-md bg-cyan-400 text-slate-950 font-black text-[9px] flex items-center justify-center mx-auto"
                                  >
                                    S
                                  </span>
                                );
                              } else if (matchingTrx.statusUnit === 'Selesai') {
                                cellBg = 'bg-emerald-500/15 hover:bg-emerald-500/30';
                                cellIndicator = (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                                );
                              }
                            }

                            return (
                              <td
                                key={`${bike.nopol}-${toDateKey(d)}`}
                                onClick={() => {
                                  setSelectedDate(d);
                                  if (!matchingTrx) {
                                    const targetDate = new Date(d);
                                    targetDate.setHours(9, 0, 0, 0);
                                    const pad = (n: number) =>
                                      String(n).padStart(2, '0');
                                    const iso = `${targetDate.getFullYear()}-${pad(
                                      targetDate.getMonth() + 1
                                    )}-${pad(targetDate.getDate())}T09:00`;
                                    onOpenNewRentalOnDate({
                                      nopol: bike.nopol,
                                      startDateIso: iso,
                                      statusUnit: 'Booking',
                                    });
                                  }
                                }}
                                className={`p-1 text-center border-r border-slate-800/50 cursor-pointer transition-colors ${cellBg} ${
                                  isSelectedCell ? 'ring-1 ring-inset ring-cyan-400' : ''
                                }`}
                              >
                                {cellIndicator || (
                                  <span className="text-[10px] text-slate-700 hover:text-cyan-400">
                                    ·
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Day Schedule & Unit Availability Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Detail Agenda Tanggal
                </div>
                <h2 className="text-base font-extrabold text-white mt-0.5">
                  {selectedDateFormatted}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300">
                {selectedDaySchedules.length} Jadwal
              </span>
            </div>

            {/* Quick Create Booking / Rental on Selected Date */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCreateScheduleOnSelectedDate('Booking')}
                className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CalendarClock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Booking Tanggal Ini</span>
              </button>
              <button
                onClick={() => handleCreateScheduleOnSelectedDate('Disewa')}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Sewa Tanggal Ini</span>
              </button>
            </div>

            {/* List of Active / Booked Transactions on Selected Date */}
            {selectedDaySchedules.length === 0 ? (
              <div className="py-8 px-4 text-center bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-bold text-slate-300">
                  Belum Ada Jadwal Sewa / Booking
                </div>
                <p className="text-[11px] text-slate-500">
                  Semua unit armada tersedia pada tanggal ini. Klik tombol di atas atau pilih motor di bawah untuk membuat jadwal baru.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {selectedDaySchedules.map((trx) => {
                  const bike = fleet.find((b) => b.nopol === trx.nopolMotor);
                  const { isOverdue, hoursLate } = checkIsOverdue(trx);
                  const isPickupToday = isSameCalendarDay(
                    trx.waktuStartSewa,
                    selectedDate
                  );
                  const isReturnToday = isSameCalendarDay(
                    trx.waktuSelesai || trx.estWaktuKembali,
                    selectedDate
                  );

                  return (
                    <div
                      key={trx.id}
                      className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 space-y-2.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold text-white">
                              {bike ? bike.namaUnit : trx.nopolMotor}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-cyan-400">
                              {trx.nopolMotor}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mt-1">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{trx.namaPenyewa}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[11px] text-slate-400">
                              {trx.kategoriPelanggan}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${
                            trx.statusUnit === 'Booking'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : trx.statusUnit === 'Refund'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : isOverdue && trx.statusUnit !== 'Selesai'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : trx.statusUnit === 'Disewa'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {isOverdue && trx.statusUnit !== 'Selesai'
                            ? `Overdue +${hoursLate}j`
                            : trx.statusUnit}
                        </span>
                      </div>

                      {/* Schedule Time Window */}
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Mulai Ambil:</span>
                          <span
                            className={`font-mono font-semibold ${
                              isPickupToday ? 'text-cyan-300 font-bold' : ''
                            }`}
                          >
                            {formatIndonesianDateTime(trx.waktuStartSewa)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Est. Kembali:</span>
                          <span
                            className={`font-mono font-semibold ${
                              isReturnToday ? 'text-amber-300 font-bold' : ''
                            }`}
                          >
                            {formatIndonesianDateTime(trx.estWaktuKembali)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-slate-300">
                          <span>
                            Durasi:{' '}
                            <strong>
                              {trx.paketKhusus === 'Per Jam'
                                ? `${trx.durasiJam || 1} Jam`
                                : trx.paketKhusus === 'Paket 12 Jam'
                                ? `${trx.lamaSewaHari > 0 ? `${trx.lamaSewaHari} Hari + ` : ''}Paket 12 Jam`
                                : `${trx.lamaSewaHari} Hari`}
                            </strong>
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {formatRupiah(trx.totalPemasukan)} ({trx.statusBayar})
                          </span>
                        </div>
                        {trx.statusUnit === 'Refund' && trx.keteranganRefund && (
                          <div className="pt-1 border-t border-slate-800 text-[10px] text-purple-300">
                            <strong>Ket. Refund:</strong> {trx.keteranganRefund}
                          </div>
                        )}
                      </div>

                      {/* Direct Operational Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => onOpenWhatsApp(trx)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Nota WA</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {trx.statusUnit === 'Booking' && (
                            <button
                              onClick={() => onCheckInRow(trx.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Check-In Ambil</span>
                            </button>
                          )}

                          {(trx.statusUnit === 'Disewa' ||
                            trx.statusUnit === 'Overdue') && (
                            <button
                              onClick={() => onCheckOutRow(trx.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Selesai Kembali</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available Fleet Units on Selected Date */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Unit Kosong / Tersedia ({availableBikesOnSelectedDate.length})</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Klik unit untuk booking
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {availableBikesOnSelectedDate.map((bike) => (
                  <button
                    key={bike.nopol}
                    onClick={() =>
                      handleCreateScheduleOnSelectedDate('Booking', bike.nopol)
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 text-left transition-all cursor-pointer group flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-white">
                      {bike.namaUnit}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-300">
                      {bike.nopol}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
