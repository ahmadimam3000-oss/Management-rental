import React, { useState, useEffect } from 'react';
import { MotorMaster, PengeluaranMotor, ExpenseCategory } from '../types/rental';
import { toInputDateTimeLocal } from '../utils/formatters';
import { X, Wrench, Plus } from 'lucide-react';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newExp: PengeluaranMotor) => void;
  fleet: MotorMaster[];
  activeBookYear?: number;
  prefilledNopol?: string;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fleet,
  activeBookYear = 2026,
  prefilledNopol
}) => {
  const [tanggal, setTanggal] = useState(toInputDateTimeLocal(new Date()));
  const [nopolMotor, setNopolMotor] = useState(prefilledNopol || fleet[0]?.nopol || '');
  const [kategoriBiaya, setKategoriBiaya] = useState<ExpenseCategory>('Service Rutin & Oli');
  const [nominal, setNominal] = useState(85000);
  const [keteranganBengkel, setKeteranganBengkel] = useState('Ganti Oli Mesin + Cek Rutin');
  const [penanggungJawab, setPenanggungJawab] = useState('Staff Operasional');

  useEffect(() => {
    if (prefilledNopol) setNopolMotor(prefilledNopol);
  }, [prefilledNopol]);

  const handleApplyPreset = (kat: ExpenseCategory, nom: number, ket: string) => {
    setKategoriBiaya(kat);
    setNominal(nom);
    setKeteranganBengkel(ket);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || nominal <= 0) return alert('Silakan masukkan nominal pengeluaran.');
    if (!keteranganBengkel.trim()) return alert('Silakan isi keterangan bengkel/biaya.');

    const expDateObj = new Date(tanggal);
    const expYear = !isNaN(expDateObj.getFullYear()) ? expDateObj.getFullYear() : activeBookYear;
    const newId = `EXP-${expYear}-${Math.floor(100 + Math.random() * 900)}`;

    const newExp: PengeluaranMotor = {
      id: newId,
      tanggal: new Date(tanggal).toISOString(),
      nopolMotor,
      kategoriBiaya,
      nominal: Number(nominal),
      keteranganBengkel: keteranganBengkel.trim(),
      penanggungJawab: penanggungJawab.trim() || 'Admin'
    };

    onSave(newExp);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Catat Pengeluaran & Servis Unit</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Catatan biaya operasional dan perawatan 13 armada motor.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Quick presets */}
          <div>
            <label className="block text-slate-400 mb-1.5 text-[11px]">
              Preset Pengeluaran Cepat:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('Service Rutin & Oli', 85000, 'Ganti Oli MPX2 / Yamalube')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                Ganti Oli (Rp 85rb)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Cuci Motor', 20000, 'Cuci Motor Salju Bersih')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                Cuci Motor (Rp 20rb)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Sparepart & Ban', 220000, 'Ganti Ban Tubeless')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                Ban Baru (Rp 220rb)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Tanggal & Waktu *
              </label>
              <input
                type="datetime-local"
                required
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Unit Motor (13 Fleet) *
              </label>
              <select
                value={nopolMotor}
                onChange={e => setNopolMotor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none font-mono"
              >
                {fleet.map(b => (
                  <option key={b.nopol} value={b.nopol}>
                    {b.namaUnit} · {b.nopol} ({b.tipeMotor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Kategori Biaya *
              </label>
              <select
                value={kategoriBiaya}
                onChange={e => setKategoriBiaya(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value="Service Rutin & Oli">Service Rutin & Oli</option>
                <option value="Sparepart & Ban">Sparepart & Ban</option>
                <option value="Cuci Motor">Cuci Motor</option>
                <option value="Pajak & STNK">Pajak & STNK</option>
                <option value="Bensin Operasional">Bensin Operasional</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Nominal Biaya (Rp) *
              </label>
              <input
                type="number"
                step="5000"
                min="0"
                required
                value={nominal}
                onChange={e => setNominal(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Keterangan / Nama Bengkel *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AHASS Merjosari / Tambal Ban Dinoyo"
              value={keteranganBengkel}
              onChange={e => setKeteranganBengkel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Penanggung Jawab *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Staff Armada / Mas Bambang"
              value={penanggungJawab}
              onChange={e => setPenanggungJawab(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
            >
              Simpan Pengeluaran
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
