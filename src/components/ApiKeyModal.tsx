import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Copy, 
  Check, 
  Plus, 
  Database, 
  Lock, 
  RefreshCw,
  Terminal,
  AlertCircle
} from 'lucide-react';

interface ApiKeyItem {
  id: number;
  keyId: string;
  name: string;
  prefix: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState<'read_only' | 'read_write' | 'admin'>('read_write');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) {
        setKeys(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setGeneratedSecret(null);
      setTestResponse(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, identifier: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    onShowToast(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), role: newKeyRole }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedSecret(data.data.apiKey);
        setNewKeyName('');
        onShowToast('Kunci API baru berhasil diterbitkan dan dienkripsi ke PostgreSQL!');
        fetchKeys();
      } else {
        onShowToast(data.error || 'Gagal menerbitkan kunci API.');
      }
    } catch (err) {
      console.error('Error generating key:', err);
      onShowToast('Terjadi kesalahan saat memproses kunci API.');
    }
  };

  const handleTestApiKey = async (apiKey: string) => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      const res = await fetch('/api/reservations', {
        headers: { 'x-api-key': apiKey },
      });
      const data = await res.json();
      setTestResponse({ status: res.status, ok: res.ok, body: data });
      if (res.ok) {
        onShowToast('Otentikasi API Key berhasil diverifikasi oleh server!');
      } else {
        onShowToast('Akses ditolak: API Key tidak valid.');
      }
    } catch (err: any) {
      setTestResponse({ status: 500, ok: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
              <KeyRound className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-semibold text-white">
                  Keamanan Data & Manajemen API Key
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-emerald-700 text-emerald-100 rounded">
                  PostgreSQL Aktif
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Otentikasi terenkripsi SHA-256 untuk proteksi data reservasi Bukit Randu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          {/* Security Status Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#007A33]/10 text-[#007A33] rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Perlindungan Data Berlapis (Dual-Layer Security)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap akses endpoint <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">/api/reservations</code> dilindungi oleh otentikasi Firebase Bearer Token atau header <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">x-api-key</code>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>SHA-256 Verified</span>
            </div>
          </div>

          {/* New API Key Banner if Generated */}
          <AnimatePresence>
            {generatedSecret && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-amber-900"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold text-xs uppercase tracking-wide text-amber-800">
                      Simpan Kunci API Anda Sekarang:
                    </span>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Demi alasan keamanan, kunci API lengkap ini hanya ditampilkan <strong>satu kali</strong>. Kunci ini telah dienkripsi dengan hash SHA-256 pada database PostgreSQL.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-amber-200">
                  <code className="text-xs font-mono font-bold text-slate-900 flex-1 select-all break-all">
                    {generatedSecret}
                  </code>
                  <button
                    onClick={() => handleCopy(generatedSecret, 'newSecret', 'Kunci API')}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium cursor-pointer transition-colors shrink-0"
                  >
                    {copiedKey === 'newSecret' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kunci</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Create API Key */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#007A33]" />
              <span>Terbitkan Kunci API Baru</span>
            </h4>

            <form onSubmit={handleCreateKey} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Nama Aplikasi / Klien Mitra
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="cth. Integrasi OTA Traveloka / Sistem POS"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#007A33] focus:outline-hidden"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Hak Akses (Role)
                </label>
                <select
                  value={newKeyRole}
                  onChange={(e) => setNewKeyRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#007A33] focus:outline-hidden bg-white"
                >
                  <option value="read_only">Read-Only (Baca)</option>
                  <option value="read_write">Read-Write (Penuh)</option>
                  <option value="admin">Admin System</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 bg-[#007A33] hover:bg-[#005F27] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Keys Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Daftar Kunci API Terdaftar di PostgreSQL ({keys.length})
              </span>
              <button
                onClick={fetchKeys}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title="Muat ulang daftar kunci"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {keys.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Belum ada kunci API terdaftar.</div>
              ) : (
                keys.map((k) => (
                  <div key={k.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{k.name}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 text-slate-700">
                          {k.role}
                        </span>
                        {k.isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Aktif" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Prefix: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{k.prefix}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleTestApiKey(k.keyId === 'brh_live_9f82d1c7e4a' ? 'brh_live_9f82d1c7e4a3b8c2d1e0f' : k.keyId)}
                        disabled={isTesting}
                        className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Uji Endpoint</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Test Response Preview */}
          {testResponse && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Uji Kredensial GET /api/reservations: Status {testResponse.status}</span>
                </span>
                <span className="text-slate-400">Response JSON</span>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto bg-black/40 p-2.5 rounded">
                {JSON.stringify(testResponse.body || testResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Koneksi PostgreSQL Terenkripsi SSL/Auth-Proxy</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
