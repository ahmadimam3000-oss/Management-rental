import React, { useState } from 'react';
import { TARIF_STANDAR } from '../data/initialFleetData';
import { 
  formatRupiah, 
  getCustomerWhatsAppChatUrl, 
  calculateHourlyOvertimeFee,
  RENTAL_CS_DISPLAY,
  PAYMENT_BRI_ACCOUNT,
  PAYMENT_BRI_HOLDER,
  PAYMENT_QRIS_IMAGE,
  PAYMENT_QRIS_MERCHANT,
  PAYMENT_QRIS_NMID
} from '../utils/formatters';
import { Calculator, ArrowRight, ShieldCheck, Phone, Clock, Zap, Copy, Check, QrCode, Building2, Banknote, Maximize2, X } from 'lucide-react';

interface TarifReferenceTableProps {
  onApplyTarifToNewRental: (tipe: string, kategori: string, hargaHari: number, lamaHari: number) => void;
}

export const TarifReferenceTable: React.FC<TarifReferenceTableProps> = ({
  onApplyTarifToNewRental
}) => {
  // Calculator state
  const [selectedTipe, setSelectedTipe] = useState('Honda Beat');
  const [selectedKategori, setSelectedKategori] = useState('Mhs Malang');
  const [lamaHariInput, setLamaHariInput] = useState<string>('1');
  const [simPaketKhusus, setSimPaketKhusus] = useState<'Harian' | 'Paket 12 Jam' | 'Per Jam'>('Harian');
  const [simHargaPaket12JamInput, setSimHargaPaket12JamInput] = useState<string>('');
  const [simDurasiJam, setSimDurasiJam] = useState<number>(1);
  const [simTambahanJam, setSimTambahanJam] = useState<number>(0);
  const [copiedBri, setCopiedBri] = useState(false);
  const [showQrisZoom, setShowQrisZoom] = useState(false);

  const lamaHari = lamaHariInput.trim() === ''
    ? 0
    : Math.max(0, parseInt(lamaHariInput, 10) || 0);

  const simHargaPaket12Jam = simHargaPaket12JamInput.trim() === ''
    ? 0
    : Math.max(0, parseInt(simHargaPaket12JamInput, 10) || 0);

  const currentTarif = TARIF_STANDAR.find(t => t.tipeMotor === selectedTipe) || TARIF_STANDAR[1];

  let dailyRate = currentTarif.mhsMalang24Jam;
  if (selectedKategori === 'Luar Malang / Wisatawan') {
    dailyRate = currentTarif.luarMalang24Jam;
  }

  const ratePerJam = calculateHourlyOvertimeFee(simDurasiJam);
  const feeTambahanJam = simPaketKhusus !== 'Per Jam' ? calculateHourlyOvertimeFee(simTambahanJam) : 0;
  const baseCost = simPaketKhusus === 'Per Jam'
    ? ratePerJam
    : simPaketKhusus === 'Paket 12 Jam'
    ? (dailyRate * lamaHari) + simHargaPaket12Jam
    : (dailyRate * lamaHari);
  const estimatedTotal = baseCost + feeTambahanJam;

  return (
    <div className="space-y-6">
      
      {/* Title & Introduction */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
            Standar Tarif &amp; Kebijakan Harga · Ai Rent
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Tabel Acuan Tarif Sewa Standar Ai Rent
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Pedoman tarif resmi Ai Rent untuk Sewa Per Jam (di bawah 12 jam), Paket Sewa 12 Jam (harga opsional), serta sewa harian (24 Jam) bagi Mahasiswa Malang (dengan KTM aktif) dan wisatawan/tamu luar kota.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Reference Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">
              💵 Matriks Tarif Berdasarkan Tipe Motor
            </h3>
            <span className="text-xs text-slate-400">Harga nett per unit</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
                  <th className="py-3 px-4">Tipe Motor</th>
                  <th className="py-3 px-4 text-right">Mhs Malang / 24 Jam</th>
                  <th className="py-3 px-4 text-right">Luar Malang / Wisatawan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {TARIF_STANDAR.map((item) => (
                  <tr 
                    key={item.tipeMotor}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {item.tipeMotor}
                      <div className="text-[11px] text-slate-400 font-normal">
                        Matic irit &amp; terawat
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-400 tabular-nums">
                      {formatRupiah(item.mhsMalang24Jam)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-cyan-400 tabular-nums">
                      {formatRupiah(item.luarMalang24Jam)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Specific Hourly Rate Tables */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Sewa Per Jam (Di Bawah 12 Jam) */}
              <div className="bg-slate-900 border border-emerald-800/60 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                    <span>Sewa Per Jam (Di Bawah 12 Jam)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                    Start Min. 1 Jam
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">1 Jam</div>
                    <div className="font-bold text-emerald-300">Rp 10.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">2 Jam</div>
                    <div className="font-bold text-emerald-300">Rp 15.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">3 Jam</div>
                    <div className="font-bold text-emerald-300">Rp 20.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">4 Jam</div>
                    <div className="font-bold text-emerald-300">Rp 25.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">5 Jam</div>
                    <div className="font-bold text-emerald-300">Rp 30.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">6 Jam</div>
                    <div className="font-bold text-emerald-300">Rp 35.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center col-span-2 sm:col-span-2">
                    <div className="text-slate-400 text-[10px]">7 Jam</div>
                    <div className="font-bold text-emerald-300">Rp 40.000</div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Sewa singkat di bawah 12 jam, start minimal 1 jam Rp 10.000, kelipatan +Rp 5.000/jam.
                </p>
              </div>

              {/* Card 2: Tambahan Sewa Per Jam */}
              <div className="bg-slate-900 border border-cyan-800/60 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Tambahan Lama Sewa Per Jam (Overtime)</span>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
                    +Rp 5.000/Jam
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">1 Jam</div>
                    <div className="font-bold text-cyan-300">Rp 10.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">2 Jam</div>
                    <div className="font-bold text-cyan-300">Rp 15.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">3 Jam</div>
                    <div className="font-bold text-cyan-300">Rp 20.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">4 Jam</div>
                    <div className="font-bold text-cyan-300">Rp 25.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">5 Jam</div>
                    <div className="font-bold text-cyan-300">Rp 30.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-400 text-[10px]">6 Jam</div>
                    <div className="font-bold text-cyan-300">Rp 35.000</div>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center col-span-2 sm:col-span-2">
                    <div className="text-slate-400 text-[10px]">7 Jam</div>
                    <div className="font-bold text-cyan-300">Rp 40.000</div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Aturan resmi: 1 jam Rp 10.000, di atas 1 jam kelipatan Rp 5.000 per jam.
                </p>
              </div>

            </div>

            {/* Core Inclusions Cards */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Fasilitas &amp; Inklusi Resmi Ai Rent:</span>
              </div>
              <a
                href={getCustomerWhatsAppChatUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat WhatsApp Pelanggan</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                <div className="font-bold text-cyan-400 flex items-center gap-1">
                  <span>🪖</span>
                  <span>0 / 1 / 2 Helm SNI</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-tight">
                  Pilihan 0 (bawa sendiri), 1, atau 2 helm SNI bersih, wangi &amp; kaca bening sesuai kebutuhan pengendara.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                <div className="font-bold text-cyan-400 flex items-center gap-1">
                  <span>⛽</span>
                  <span>Bensin 1 - 5 / Full Kotak</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-tight">
                  Indikator bensin dicatat saat serah terima unit (1/2/3/4/5/Full Kotak) &amp; dikembalikan pada posisi yang sama.
                </p>
              </div>
            </div>

            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
              <li>Jaminan wajib: KTP Asli + identitas pendukung (KTM / SIM C / BPJS / KK).</li>
              <li>Hitungan sewa harian 24 Jam sejak unit diterima/check-in, Paket 12 Jam (harga opsional), atau sewa per jam di bawah 12 jam.</li>
              <li>Free delivery / antar-jemput area kampus UB, UM, UIN, Dinoyo, Suhat (S&amp;K berlaku).</li>
            </ul>
          </div>
        </div>

        {/* Interactive Pricing Simulator (1 col) */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-white text-sm">
                Kalkulator Estimasi Sewa
              </h3>
            </div>

            {/* Pilihan Paket: Per Jam vs Paket 12 Jam vs Harian */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setSimPaketKhusus('Per Jam')}
                className={`py-1 px-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  simPaketKhusus === 'Per Jam'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⏱️ Per Jam
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimPaketKhusus('Paket 12 Jam');
                  if (lamaHari === 1) setLamaHariInput('0');
                }}
                className={`py-1 px-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  simPaketKhusus === 'Paket 12 Jam'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌗 12 Jam
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimPaketKhusus('Harian');
                  if (lamaHari === 0) setLamaHariInput('1');
                }}
                className={`py-1 px-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  simPaketKhusus === 'Harian'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📅 Harian
              </button>
            </div>

            {/* Select Motor */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pilih Tipe Motor:
              </label>
              <select
                value={selectedTipe}
                onChange={e => setSelectedTipe(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              >
                {TARIF_STANDAR.map(t => (
                  <option key={t.tipeMotor} value={t.tipeMotor}>
                    {t.tipeMotor}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Category (if Harian / Paket 12 Jam) */}
            {simPaketKhusus !== 'Per Jam' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kategori Pelanggan:
                </label>
                <select
                  value={selectedKategori}
                  onChange={e => setSelectedKategori(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                >
                  <option value="Mhs Malang">Mhs Malang (Mahasiswa)</option>
                  <option value="Luar Malang / Wisatawan">Luar Malang / Wisatawan</option>
                </select>
              </div>
            )}

            {/* Duration Input */}
            {simPaketKhusus !== 'Per Jam' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Lama Sewa (Hari):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLamaHariInput('0')}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 cursor-pointer"
                    >
                      0 Hari
                    </button>
                    <span className="font-mono font-bold text-cyan-400">{lamaHari} Hari</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    placeholder="0"
                    value={lamaHariInput}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') setLamaHariInput('');
                      else {
                        const p = parseInt(raw, 10);
                        setLamaHariInput(isNaN(p) ? '' : String(Math.max(0, p)));
                      }
                    }}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-cyan-500"
                  />
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={lamaHari}
                    onChange={e => setLamaHariInput(e.target.value)}
                    className="flex-1 accent-cyan-400 bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>
                {simPaketKhusus === 'Paket 12 Jam' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-medium text-amber-300 mb-1">
                      🌗 Harga Paket 12 Jam (Rp) — Opsional:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      placeholder="Opsional (Misal: 35000 / 40000 atau kosongkan)"
                      value={simHargaPaket12JamInput}
                      onChange={e => setSimHargaPaket12JamInput(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-700/60 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>⏱️ Durasi Jam (Min. 1 Jam):</span>
                  <span className="font-mono font-bold text-emerald-400">{formatRupiah(ratePerJam)}</span>
                </div>
                <select
                  value={simDurasiJam}
                  onChange={e => setSimDurasiJam(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value={1}>1 Jam — Rp 10.000</option>
                  <option value={2}>2 Jam — Rp 15.000</option>
                  <option value={3}>3 Jam — Rp 20.000</option>
                  <option value={4}>4 Jam — Rp 25.000</option>
                  <option value={5}>5 Jam — Rp 30.000</option>
                  <option value={6}>6 Jam — Rp 35.000</option>
                  <option value={7}>7 Jam — Rp 40.000</option>
                  <option value={8}>8 Jam — Rp 45.000</option>
                  <option value={9}>9 Jam — Rp 50.000</option>
                  <option value={10}>10 Jam — Rp 55.000</option>
                  <option value={11}>11 Jam — Rp 60.000</option>
                </select>
              </div>
            )}

            {/* Tambahan Jam Per Jam (if Harian / Paket 12 Jam) */}
            {simPaketKhusus !== 'Per Jam' && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>⏱️ Tambahan Jam:</span>
                  {simTambahanJam > 0 && (
                    <span className="font-mono font-bold text-cyan-400">+{formatRupiah(feeTambahanJam)}</span>
                  )}
                </div>
                <select
                  value={simTambahanJam}
                  onChange={e => setSimTambahanJam(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                >
                  <option value={0}>0 Jam (Rp 0)</option>
                  <option value={1}>1 Jam (+Rp 10.000)</option>
                  <option value={2}>2 Jam (+Rp 15.000)</option>
                  <option value={3}>3 Jam (+Rp 20.000)</option>
                  <option value={4}>4 Jam (+Rp 25.000)</option>
                  <option value={5}>5 Jam (+Rp 30.000)</option>
                  <option value={6}>6 Jam (+Rp 35.000)</option>
                  <option value={7}>7 Jam (+Rp 40.000)</option>
                </select>
              </div>
            )}

            {/* Result Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>
                  Biaya Pokok ({simPaketKhusus === 'Per Jam' ? `${simDurasiJam} Jam` : simPaketKhusus === 'Paket 12 Jam' ? `${lamaHari} Hari + 12 Jam` : `${lamaHari} Hari`}):
                </span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {formatRupiah(baseCost)}
                </span>
              </div>
              {simPaketKhusus !== 'Per Jam' && simTambahanJam > 0 && (
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tambahan {simTambahanJam} Jam:</span>
                  <span className="font-mono text-cyan-300 tabular-nums">
                    +{formatRupiah(feeTambahanJam)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                <span className="font-bold text-white">Total Estimasi:</span>
                <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                  {formatRupiah(estimatedTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Action button to apply to new transaction */}
          <button
            onClick={() => onApplyTarifToNewRental(
              selectedTipe, 
              selectedKategori, 
              simPaketKhusus === 'Per Jam' ? ratePerJam : dailyRate, 
              simPaketKhusus === 'Per Jam' ? 1 : lamaHari
            )}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <span>Gunakan Estimasi Ini di Form Sewa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Official 3 Payment Methods Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">
              3 Opsi Pembayaran Resmi · Ai Rent
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Metode Pembayaran Resmi (Tunai, Transfer BRI &amp; QRIS)
            </h3>
          </div>
          <a
            href={getCustomerWhatsAppChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>CS Hotline WA: {RENTAL_CS_DISPLAY}</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Tunai */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold">
                <Banknote className="w-4 h-4" />
                <span>1. Tunai (Cash)</span>
              </div>
              <div className="text-sm font-bold text-white">
                Bayar Langsung di Kasir
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pembayaran uang tunai langsung saat pengambilan kunci &amp; serah terima unit motor di lokasi Ai Rent.
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-slate-800/80">
              ✓ Tanpa biaya admin tambahan
            </div>
          </div>

          {/* 2. Transfer BRI */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-bold">
                <Building2 className="w-4 h-4" />
                <span>2. Transfer Bank BRI</span>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Nomor Rekening BRI:</div>
                <div className="text-lg font-mono font-black text-cyan-300 tracking-wide mt-0.5">
                  {PAYMENT_BRI_ACCOUNT}
                </div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  An ({PAYMENT_BRI_HOLDER}) BRI
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(PAYMENT_BRI_ACCOUNT);
                setCopiedBri(true);
                setTimeout(() => setCopiedBri(false), 2000);
              }}
              className="w-full py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedBri ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBri ? 'Nomor Rekening BRI Tersalin!' : 'Salin No. Rek BRI'}</span>
            </button>
          </div>

          {/* 3. QRIS */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-800/60 flex flex-col justify-between space-y-3">
            <div className="flex items-start gap-3">
              <div 
                onClick={() => setShowQrisZoom(true)}
                className="bg-white p-1.5 rounded-xl border-2 border-amber-400 shrink-0 cursor-pointer shadow-md"
                title="Klik untuk memperbesar QRIS"
              >
                <img
                  src={PAYMENT_QRIS_IMAGE}
                  alt="QRIS AI RENT FOOD GROUP"
                  className="w-24 h-32 object-contain rounded"
                />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950 text-amber-400 border border-amber-800 text-xs font-bold">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>3. QRIS Resmi</span>
                </div>
                <div className="text-xs font-black text-white">
                  {PAYMENT_QRIS_MERCHANT}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  NMID: {PAYMENT_QRIS_NMID}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Scan dari semua M-Banking &amp; E-Wallet (GoPay, OVO, DANA, ShopeePay).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQrisZoom(true)}
              className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Perbesar Gambar QRIS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen QRIS Zoom Modal */}
      {showQrisZoom && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setShowQrisZoom(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white rounded-2xl p-4 shadow-2xl text-center space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-left">
                <div className="text-xs font-black text-slate-900">{PAYMENT_QRIS_MERCHANT}</div>
                <div className="text-[10px] font-mono text-slate-500">NMID: {PAYMENT_QRIS_NMID}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrisZoom(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={PAYMENT_QRIS_IMAGE}
              alt="QRIS AI RENT FOOD GROUP"
              className="w-full max-h-[75vh] object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}

    </div>
  );
};
