import { useState } from 'react';
import { QrCode, FileText, ArrowRight } from 'lucide-react';

export default function App() {
  const [text, setText] = useState('');

  const handleGenerate = () => {
    // Placeholder for chunking logic
    console.log('Initiating chunking process for text of length:', text.length);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-3xl space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl mb-2 shadow-sm border border-blue-200">
            <QrCode size={36} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Multi-QR Text Encoder</h1>
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
            Paste your long instructions or internal forms below. We'll chunk it into a sequence of QR codes for easy scanning and reassembly.
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="text-input" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                Input Text
              </label>
              <span className="text-xs text-slate-400 font-mono tracking-tight bg-slate-100 px-2 py-1 rounded-md">
                {text.length} chars
              </span>
            </div>
            <textarea
              id="text-input"
              className="w-full h-72 p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y text-slate-700 placeholder:text-slate-400 shadow-inner"
              placeholder="Paste your very long text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={text.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-sm"
            >
              Generate QR Codes
              <ArrowRight size={18} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
