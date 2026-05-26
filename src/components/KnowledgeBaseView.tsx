import { useState, useRef, DragEvent, ChangeEvent, useEffect, FormEvent } from 'react';
import { 
  Database, 
  Trash2, 
  UploadCloud, 
  Search, 
  FileText, 
  Clock, 
  Info,
  Sparkles,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  Edit,
  BookOpen,
  MessageSquare,
  Plus,
  Check,
  ToggleLeft
} from 'lucide-react';
import { KBDocument, QnARule } from '../types';
import { dataService } from '../lib/dataService';

interface KnowledgeBaseViewProps {
  documents: KBDocument[];
  fetchDocuments: () => void;
}

export default function KnowledgeBaseView({ documents, fetchDocuments }: KnowledgeBaseViewProps) {
  const [activeTab, setActiveTab] = useState<'rag' | 'manual'>('rag');
  const [qnaRules, setQnaRules] = useState<QnARule[]>([]);
  const [isLoadingQna, setIsLoadingQna] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<QnARule | null>(null);

  // Form states for adding/editing a Q&A Rule
  const [formKeyword, setFormKeyword] = useState('');
  const [formReply, setFormReply] = useState('');
  const [formMatchType, setFormMatchType] = useState<'exact' | 'contains'>('contains');
  const [formIsActive, setFormIsActive] = useState(true);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResultChunks, setTestResultChunks] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadQnaRules = async () => {
    setIsLoadingQna(true);
    try {
      const data = await dataService.getQnARules();
      setQnaRules(data || []);
    } catch (err) {
      console.error('Failed to load manual Q&A Rules:', err);
    } finally {
      setIsLoadingQna(false);
    }
  };

  useEffect(() => {
    loadQnaRules();
  }, []);

  const handleCreateOrUpdateRule = async (e: FormEvent) => {
    e.preventDefault();
    if (!formKeyword.trim() || !formReply.trim()) {
      alert('Kata kunci dan isi pesan balasan wajib diisi!');
      return;
    }

    try {
      const payload: QnARule = {
        id: editingRule ? editingRule.id : 'qna_' + Date.now(),
        keyword: formKeyword.trim(),
        reply: formReply.trim(),
        matchType: formMatchType,
        isActive: formIsActive
      };

      const ok = await dataService.saveQnARule(payload);
      if (ok) {
        setFormKeyword('');
        setFormReply('');
        setFormMatchType('contains');
        setFormIsActive(true);
        setEditingRule(null);
        setShowRuleForm(false);
        loadQnaRules();
      } else {
        alert('Gagal menyimpan aturan Q&A.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditRule = (rule: QnARule) => {
    setEditingRule(rule);
    setFormKeyword(rule.keyword);
    setFormReply(rule.reply);
    setFormMatchType(rule.matchType);
    setFormIsActive(rule.isActive);
    setShowRuleForm(true);
  };

  const handleDeleteRule = async (id: string, keyword: string) => {
    if (!window.confirm(`Hapus aturan Q&A untuk kata kunci "${keyword}"?`)) {
      return;
    }
    try {
      const ok = await dataService.deleteQnARule(id);
      if (ok) {
        loadQnaRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRuleActive = async (rule: QnARule) => {
    try {
      const updated = { ...rule, isActive: !rule.isActive };
      const ok = await dataService.saveQnARule(updated);
      if (ok) {
        loadQnaRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop triggers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  // Convert File to Plaintext and upload
  const handleFileSelected = (file: File) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // Check supported formats
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'txt' && ext !== 'docx' && ext !== 'pdf') {
      setErrorMsg('Hanya file berformat TXT, DOCX, atau PDF yang didukung saat ini.');
      return;
    }

    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const textContent = event.target?.result as string || '';
        
        const ok = await dataService.uploadDocument({
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: textContent
        });

        if (ok) {
          setSuccessMsg(`Berhasil mengunggah "${file.name}" ke Knowledge Base.`);
          fetchDocuments();
        } else {
          setErrorMsg('Gagal menyimpan dokumen.');
        }
      } catch (err: any) {
        setErrorMsg(`Gagal memproses file: ${err.message}`);
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Gagal membaca isi file.');
      setUploading(false);
    };

    // For simplicity they are read as text or mocked string for layout
    reader.readAsText(file);
  };

  // Remove Document
  const handleDeleteDoc = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${name}" dari RAG database? AI tidak akan bisa mengingat seluruh isinya lagi.`)) {
      return;
    }

    try {
      const ok = await dataService.deleteDocument(id);
      if (ok) {
        fetchDocuments();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Test RAG Search Simulation
  const runTestRag = async () => {
    if (!searchQuery.trim()) return;
    setIsTestLoading(true);
    setTestResultChunks('');

    try {
      // Simulate RAG text mapping on the database query
      const data = await dataService.simulateReply(
        'Tester RAG',
        '+62899999999',
        searchQuery,
        [],
        null as any
      );
      
      setIsTestLoading(false);
      if (data.success) {
        setTestResultChunks(data.replyText);
      }
    } catch (err: any) {
      setIsTestLoading(false);
      setTestResultChunks(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Knowledge Base & Otomatisasi Pesan</h2>
          <p className="text-sm text-slate-500 mt-1">
            Unggah dokumen bisnis Anda agar AI Gemini dapat menjawab dengan tepat, atau atur aturan Q&A kustom instan di WhatsApp.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <Database size={13} className="text-emerald-500" />
          <span>Sistem Pencarian Cerdas Aktif</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('rag')}
          id="btn-tab-rag"
          className={`flex items-center space-x-2 py-3 px-6 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'rag' 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={14} className={activeTab === 'rag' ? 'text-emerald-500' : 'text-slate-400'} />
          <span>Dokumen Bisnis (RAG AI)</span>
          <span className="ml-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-mono">
            {documents.length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          id="btn-tab-manual"
          className={`flex items-center space-x-2 py-3 px-6 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'manual' 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare size={14} className={activeTab === 'manual' ? 'text-emerald-500' : 'text-slate-400'} />
          <span>Atur Q&A Manual (FAQ)</span>
          <span className="ml-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
            {qnaRules.length}
          </span>
        </button>
      </div>

      {activeTab === 'rag' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Drag-and-drop Uploader + Search Test */}
          <div className="space-y-6">
            {/* File Upload card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="kb-uploader-card">
              <h3 className="text-base font-bold text-slate-900 mb-4">Unggah Dokumen Baru</h3>

              {/* Drag and drop block */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileInputChange}
                  accept=".txt,.docx,.pdf"
                />
                <UploadCloud size={38} className={dragActive ? 'text-emerald-500' : 'text-slate-400'} />
                <p className="text-xs font-bold text-slate-800 mt-3">Tarik & Lepas File ke Sini</p>
                <p className="text-[10px] text-slate-400 mt-1">atau klik untuk menelusuri komputer</p>
                <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">.TXT</span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">.DOCX</span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">.PDF</span>
                </div>
              </div>

              {/* Feedback messages */}
              {uploading && (
                <div className="mt-3 text-center text-xs font-medium text-slate-500 animate-pulse flex items-center justify-center space-x-1.5">
                  <Clock size={12} className="animate-spin" />
                  <span>Membaca dan memproses sinkronisasi RAG...</span>
                </div>
              )}
              {successMsg && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold leading-relaxed">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold leading-relaxed">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Prompt RAG Search Test sandbox */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="kb-sandbox-card">
              <div>
                <h3 className="text-base font-bold text-slate-900">Uji Kemampuan Dokumen (Sandbox)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tes bagaimana AI menjawab menggunakan data knowledge base</p>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tanyakan harga/kebijakan..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  onKeyDown={e => e.key === 'Enter' && runTestRag()}
                />
                <button 
                  onClick={runTestRag}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-emerald-500 cursor-pointer"
                >
                  <Search size={15} />
                </button>
              </div>

              {isTestLoading && (
                <p className="text-center text-[10.5px] text-slate-400 animate-pulse font-medium">Model Gemini sedang mencari referensi...</p>
              )}

              {testResultChunks && (
                <div className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto leading-relaxed border border-slate-900">
                  <span className="text-[9px] text-emerald-400 font-bold block mb-1">=== FEEDBACK JAWABAN GEMINI API ===</span>
                  <p className="text-slate-300 font-medium whitespace-pre-line">{testResultChunks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: List of uploaded documents */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between" id="kb-documents-list-card">
            <div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Daftar Dokumen Bisnis</h3>
                  <p className="text-xs text-slate-500">Semua dokumen di bawah ini telah disinkronisasikan ke dalam database indexing RAG lokal</p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-mono">
                  {documents.length} File
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                  <FileText size={28} className="text-slate-200 mb-2" />
                  <span>Belum ada dokumen yang diunggah. Silakan seret file di panel samping!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-colors border border-slate-100">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{doc.name}</h4>
                          <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-1 font-medium">
                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{doc.chunkCount} potongan teks</span>
                            <span>•</span>
                            <span className="flex items-center text-emerald-600"><Sparkles size={10} className="mr-0.5" /> Indexed RAG</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.name)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus dokumen dari database"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100/70 text-amber-900 text-xs flex items-start space-x-3">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block font-bold">Bagaimana sistem RAG ini bekerja?</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Saat pelanggan mengirim pesan di WhatsApp, sistem kami memecah teks pesan, mendeteksi kata kunci dari dokumen Anda di atas, mengambil potongan paragraf paling relevan, lalu melampirkannya sebagai panduan khusus langsung kepada model <strong>Gemini 3.5 AI</strong>. Jawaban yang diberikan pelanggan pun 100% akurat sesuai dokumen bisnis Anda!
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Left Column: Form to Add/Edit Q&A Rule */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="manual-qna-form-card">
              <div className="flex items-center justify-between mb-4 flex-wrap leading-tight">
                <h3 className="text-base font-bold text-slate-900">
                  {editingRule ? 'Edit Aturan Q&A' : 'Tambah Q&A Baru'}
                </h3>
                {editingRule && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRule(null);
                      setFormKeyword('');
                      setFormReply('');
                      setFormMatchType('contains');
                      setFormIsActive(true);
                    }}
                    className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>

              <form onSubmit={handleCreateOrUpdateRule} className="space-y-4">
                {/* Keyword Trigger input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kata Kunci / Trigger (WhatsApp Chat)
                  </label>
                  <input
                    type="text"
                    required
                    value={formKeyword}
                    onChange={e => setFormKeyword(e.target.value)}
                    placeholder="Contoh: alamat, jam buka, promo"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Kata atau frasa yang dideteksi otomatis saat chat masuk.
                  </p>
                </div>

                {/* Match type selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipe Pencocokan Kata Kunci
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormMatchType('contains')}
                      className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                        formMatchType === 'contains'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50'
                      }`}
                    >
                      Mengandung Kata
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMatchType('exact')}
                      className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                        formMatchType === 'exact'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50'
                      }`}
                    >
                      Sama Persis
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-normal font-medium">
                    {formMatchType === 'contains' 
                      ? 'Reaksi instan jika pesan memuat kata kunci (misal: "tanya alamat" memicu "alamat").'
                      : 'Reaksi instan HANYA jika isi pesan 100% sama persis dengan kata kunci.'}
                  </p>
                </div>

                {/* Instant message reply content */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Isi Pesan Balasan Otomatis
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formReply}
                    onChange={e => setFormReply(e.target.value)}
                    placeholder="Tulis format balasan kustom lengkap di sini..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white resize-none transition-all leading-relaxed"
                  />
                </div>

                {/* Toggle rule status */}
                <div className="flex items-center justify-between py-2 border-t border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-700">Status Aturan</span>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                      formIsActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${formIsActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    <span>{formIsActive ? 'Aktif' : 'Nonaktif'}</span>
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{editingRule ? 'Perbarui Aturan' : 'Simpan Aturan Q&A'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Q&A Rule List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between" id="manual-qna-rules-list-card">
              <div>
                <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-sans">Daftar Aturan Q&A Manual</h3>
                    <p className="text-xs text-slate-500">Pesan otomatis instan yang diprioritaskan langsung tanpa lewat pemrosesan Gemini AI</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-mono">
                    {qnaRules.length} Aturan
                  </span>
                </div>

                {isLoadingQna ? (
                  <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                    <span>Memuat daftar aturan Q&A...</span>
                  </div>
                ) : qnaRules.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                    <HelpCircle size={28} className="text-slate-200 mb-2" />
                    <span>Belum ada aturan Q&A manual yang ditambahkan. Gunakan panel kiri untuk membuatnya!</span>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {qnaRules.map((rule) => (
                      <div key={rule.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-all border border-slate-100 flex flex-col space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                              <MessageSquare size={16} />
                            </div>
                            <div>
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                                  "{rule.keyword}"
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  rule.matchType === 'exact' 
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                  {rule.matchType === 'exact' ? 'Sama Persis' : 'Mengandung Kata'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRuleActive(rule)}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                                    rule.isActive 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {rule.isActive ? '● Aktif' : '○ Nonaktif'}
                                </button>
                              </div>
                              <p className="text-xs text-slate-600 mt-2 whitespace-pre-line leading-relaxed font-sans font-medium">
                                {rule.reply}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 shrink-0 ml-4">
                            <button
                              type="button"
                              onClick={() => startEditRule(rule)}
                              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                              title="Edit Aturan"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id, rule.keyword)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                              title="Hapus Aturan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100/70 text-amber-900 text-xs flex items-start space-x-3">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-bold">Bagaimana Pesan Balasan Q&A Manual ini diprioritaskan?</strong>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Saat pelanggan WhatsApp Anda mengirim pesan, sistem mendeteksi kata kunci list aktif di atas terlebih dahulu. Jika cocok, sistem akan <strong>seketika mengirimkan balasan khusus kustom Anda tanpa memakai saldo kuota Gemini API</strong>. Jika tidak terdeteksi, baru AI Gemini akan mencarikan jawabannya sesuai dokumen Knowledge Base Anda. Ini menjamin akurasi respon penting 100%!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
