import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Database, 
  Trash2, 
  UploadCloud, 
  Search, 
  FileText, 
  Clock, 
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { KBDocument } from '../types';

interface KnowledgeBaseViewProps {
  documents: KBDocument[];
  fetchDocuments: () => void;
}

export default function KnowledgeBaseView({ documents, fetchDocuments }: KnowledgeBaseViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResultChunks, setTestResultChunks] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        // POST to backend
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            content: textContent,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setSuccessMsg(`Berhasil mengunggah "${file.name}" ke Knowledge Base.`);
          fetchDocuments();
        } else {
          setErrorMsg(data.error || 'Gagal menyimpan dokumen.');
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
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
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
      const response = await fetch('/api/chat/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Tester RAG',
          customerPhone: '+62899999999',
          messageText: searchQuery,
        }),
      });
      
      const data = await response.json();
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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Knowledge Base & RAG Database</h2>
          <p className="text-sm text-slate-500 mt-1">
            Unggah brosur produk, FAQ, daftar harga, atau pedoman bisnis Anda agar AI dapat menjawab pertanyaan dengan tepat.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <Database size={13} className="text-emerald-500" />
          <span>RAG Retrieval Aktif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Drag-and-drop Uploader + Search Test */}
        <div className="space-y-6">
          {/* File Upload card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
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
              <UploadCloud size={38} className={dragActive ? 'text-emerald-500 animate-bounce' : 'text-slate-400'} />
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
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
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
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
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
    </div>
  );
}
