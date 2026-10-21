import React, { useState, useEffect } from 'react';
import { MotorMaster, BikeStatus } from '../types/rental';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Bike, 
  Check, 
  Search, 
  Wrench, 
  ShieldCheck,
  ListFilter
} from 'lucide-react';

interface FleetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  fleet: MotorMaster[];
  initialEditBike?: MotorMaster | null;
  initialView?: 'list' | 'form';
  onAddBike: (newBike: Omit<MotorMaster, 'no'>) => void;
  onUpdateBike: (oldNopol: string, updatedBike: MotorMaster) => void;
  onDeleteBike: (nopol: string) => void;
}

const STANDARD_BIKE_TYPES = [
  'Honda Beat',
  'Yamaha Fazzio',
  'Honda Scoopy',
  'Yamaha Mio J',
  'Honda Vario 125',
  'Honda Vario 160',
  'Yamaha NMAX',
  'Honda PCX'
];

export const FleetManagementModal: React.FC<FleetManagementModalProps> = ({
  isOpen,
  onClose,
  fleet,
  initialEditBike,
  initialView = 'list',
  onAddBike,
  onUpdateBike,
  onDeleteBike
}) => {
  const [activeMode, setActiveMode] = useState<'list' | 'form'>(initialView);
  const [editingBike, setEditingBike] = useState<MotorMaster | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [namaUnit, setNamaUnit] = useState('');
  const [nopol, setNopol] = useState('');
  const [tipeMotor, setTipeMotor] = useState('Honda Beat');
  const [isCustomTipe, setIsCustomTipe] = useState(false);
  const [customTipeText, setCustomTipeText] = useState('');
  const [status, setStatus] = useState<BikeStatus>('Tersedia');
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [warna, setWarna] = useState('');
  const [kilometer, setKilometer] = useState<number>(10000);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialEditBike) {
        populateFormForEdit(initialEditBike);
        setActiveMode('form');
      } else if (initialView === 'form') {
        resetForm();
        setActiveMode('form');
      } else {
        setEditingBike(null);
        setActiveMode('list');
      }
    }
  }, [isOpen, initialEditBike, initialView]);

  const resetForm = () => {
    setEditingBike(null);
    setNamaUnit('');
    setNopol('');
    setTipeMotor('Honda Beat');
    setIsCustomTipe(false);
    setCustomTipeText('');
    setStatus('Tersedia');
    setTahun(2024);
    setWarna('Hitam');
    setKilometer(5000);
    setFormError(null);
  };

  const populateFormForEdit = (bike: MotorMaster) => {
    setEditingBike(bike);
    setNamaUnit(bike.namaUnit);
    setNopol(bike.nopol);
    if (STANDARD_BIKE_TYPES.includes(bike.tipeMotor)) {
      setTipeMotor(bike.tipeMotor);
      setIsCustomTipe(false);
      setCustomTipeText('');
    } else {
      setTipeMotor('Lainnya');
      setIsCustomTipe(true);
      setCustomTipeText(bike.tipeMotor);
    }
    setStatus(bike.status);
    setTahun(bike.tahun || 2023);
    setWarna(bike.warna || 'Standar');
    setKilometer(bike.kilometer || 0);
    setFormError(null);
  };

  const handleOpenAddForm = () => {
    resetForm();
    setActiveMode('form');
  };

  const handleOpenEditForm = (bike: MotorMaster) => {
    populateFormForEdit(bike);
    setActiveMode('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNama = namaUnit.trim().toUpperCase();
    const cleanNopol = nopol.trim().toUpperCase();
    const finalTipe = isCustomTipe ? customTipeText.trim() : tipeMotor;

    if (!cleanNama) {
      setFormError('Nama Unit wajib diisi (contoh: BEAT 7).');
      return;
    }
    if (!cleanNopol) {
      setFormError('Plat Nomor (Nopol) wajib diisi (contoh: N 1234 AB).');
      return;
    }
    if (!finalTipe) {
      setFormError('Tipe Motor wajib diisi.');
      return;
    }

    // Check duplicate nopol
    const duplicate = fleet.find(
      b => b.nopol.toLowerCase() === cleanNopol.toLowerCase() &&
           (!editingBike || b.nopol.toLowerCase() !== editingBike.nopol.toLowerCase())
    );
    if (duplicate) {
      setFormError(`Plat nomor "${cleanNopol}" sudah terdaftar pada unit ${duplicate.namaUnit}.`);
      return;
    }

    if (editingBike) {
      onUpdateBike(editingBike.nopol, {
        no: editingBike.no,
        namaUnit: cleanNama,
        nopol: cleanNopol,
        tipeMotor: finalTipe,
        status,
        tahun: Number(tahun) || 2023,
        warna: warna.trim() || 'Standar',
        kilometer: Number(kilometer) || 0
      });
    } else {
      onAddBike({
        namaUnit: cleanNama,
        nopol: cleanNopol,
        tipeMotor: finalTipe,
        status,
        tahun: Number(tahun) || 2024,
        warna: warna.trim() || 'Standar',
        kilometer: Number(kilometer) || 0
      });
    }

    if (initialEditBike || initialView === 'form') {
      onClose();
    } else {
      setActiveMode('list');
      resetForm();
    }
  };

  if (!isOpen) return null;

  const filteredFleet = fleet.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.namaUnit.toLowerCase().includes(q) ||
      b.nopol.toLowerCase().includes(q) ||
      b.tipeMotor.toLowerCase().includes(q) ||
      (b.warna || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadgeClass = (s: BikeStatus) => {
    switch (s) {
      case 'Tersedia':
        return 'bg-emerald-950/70 text-emerald-400 border-emerald-800';
      case 'Disewa':
        return 'bg-cyan-950/70 text-cyan-400 border-cyan-800';
      case 'Booking':
        return 'bg-amber-950/70 text-amber-400 border-amber-800';
      case 'Overdue':
        return 'bg-rose-950/70 text-rose-400 border-rose-800';
      case 'Perawatan':
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Kelola Master Armada Motor · Ai Rent</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {fleet.length} Unit
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tambah unit baru, ubah detail spesifikasi/plat nomor, atau hapus unit armada.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Bar */}
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingBike(null);
                setActiveMode('list');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeMode === 'list'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Daftar Armada ({fleet.length})</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddForm}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeMode === 'form' && !editingBike
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-emerald-800/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Armada Baru</span>
            </button>

            {activeMode === 'form' && editingBike && (
              <span className="px-3 py-1.5 rounded-lg font-semibold bg-amber-400 text-slate-950 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit: {editingBike.namaUnit} ({editingBike.nopol})</span>
              </span>
            )}
          </div>

          {activeMode === 'list' && (
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama unit, plat nopol, tipe..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeMode === 'list' ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">No</th>
                      <th className="py-3 px-3">Nama Unit</th>
                      <th className="py-3 px-3">Plat Nomor (Nopol)</th>
                      <th className="py-3 px-3">Tipe Motor</th>
                      <th className="py-3 px-3">Spesifikasi</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Aksi Edit / Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredFleet.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-500">
                          Tidak ada unit armada yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredFleet.map((bike, idx) => (
                        <tr key={bike.nopol} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-white">{bike.namaUnit}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-black border border-slate-700 rounded font-mono font-bold text-cyan-300 tracking-wider">
                              {bike.nopol}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">{bike.tipeMotor}</td>
                          <td className="py-2.5 px-3 text-slate-400">
                            Thn {bike.tahun || 2023} · {bike.warna || 'Standar'} · {(bike.kilometer || 0).toLocaleString('id-ID')} km
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${getStatusBadgeClass(bike.status)}`}>
                              {bike.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(bike)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 text-cyan-400 border border-slate-700 hover:border-cyan-700 rounded-lg font-medium transition-colors"
                                title="Edit Unit Ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteBike(bike.nopol)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 hover:border-rose-700 rounded-lg font-medium transition-colors"
                                title="Hapus Unit Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  {editingBike ? `✏️ Edit Data Armada: ${editingBike.namaUnit}` : '➕ Tambah Unit Armada Baru'}
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-700 text-rose-300 text-xs font-medium">
                    ⚠️ {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nama Unit Armada *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BEAT 7 / FAZIO M 4"
                      value={namaUnit}
                      onChange={e => setNamaUnit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-white outline-none font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Plat Nomor (Nopol) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. N 4512 ABC"
                      value={nopol}
                      onChange={e => setNopol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-cyan-300 outline-none font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Tipe Motor *
                    </label>
                    <select
                      value={isCustomTipe ? 'Lainnya' : tipeMotor}
                      onChange={e => {
                        if (e.target.value === 'Lainnya') {
                          setIsCustomTipe(true);
                        } else {
                          setIsCustomTipe(false);
                          setTipeMotor(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-white outline-none"
                    >
                      {STANDARD_BIKE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
                    </select>

                    {isCustomTipe && (
                      <input
                        type="text"
                        required
                        placeholder="Ketik tipe motor (e.g. Yamaha Lexi)"
                        value={customTipeText}
                        onChange={e => setCustomTipeText(e.target.value)}
                        className="mt-2 w-full bg-slate-900 border border-cyan-500 rounded-lg px-3 py-1.5 text-white outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Status Ketersediaan *
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as BikeStatus)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-white outline-none"
                    >
                      <option value="Tersedia">Tersedia (Siap Sewa)</option>
                      <option value="Disewa">Disewa (Sedang Jalan)</option>
                      <option value="Booking">Booking (Sudah Dipesan)</option>
                      <option value="Overdue">Overdue (Terlambat Kembali)</option>
                      <option value="Perawatan">Perawatan (Di Bengkel / Servis)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Tahun Motor
                    </label>
                    <input
                      type="number"
                      min={2010}
                      max={2030}
                      value={tahun}
                      onChange={e => setTahun(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Warna Unit
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hitam Doff / Tosca"
                      value={warna}
                      onChange={e => setWarna(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Kilometer (KM)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={kilometer}
                      onChange={e => setKilometer(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (initialEditBike || initialView === 'form') {
                        onClose();
                      } else {
                        setActiveMode('list');
                        resetForm();
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-colors shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingBike ? 'Simpan Perubahan Unit' : 'Tambahkan ke Armada'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Perubahan data armada otomatis tersimpan dan terintegrasi ke seluruh form &amp; laporan.</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white underline text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
