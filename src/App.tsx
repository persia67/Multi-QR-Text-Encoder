import { useState, useMemo } from 'react';
import { QrCode, FileText, ArrowRight, ScanLine, CheckCircle2, RotateCcw, Copy, Check, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { QRScanner } from './components/QRScanner';

const CHUNK_SIZE = 500; // characters per QR code chunk
const HEADER_PREFIX = 'MQRE'; // Multi-QR Encoder

export default function App() {
  const [text, setText] = useState('');
  const [chunks, setChunks] = useState<string[]>([]);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  // Scanner state
  const [scannedChunks, setScannedChunks] = useState<Record<number, string>>({});
  const [expectedTotal, setExpectedTotal] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reassembledText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    
    chunks.forEach((_, index) => {
      const svgElement = document.getElementById(`qr-svg-${index}`);
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        // Add XML declaration to make it a valid standalone SVG file
        const fullSvgData = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svgData}`;
        zip.file(`qr-part-${index + 1}-of-${chunks.length}.svg`, fullSvgData);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multi-qr-sequence.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = () => {
    if (!text) return;
    
    const newChunks: string[] = [];
    const totalChunks = Math.ceil(text.length / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = text.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      // Format: MQRE|index|total|payload
      // Using 1-based indexing for display purposes
      const formattedChunk = `${HEADER_PREFIX}|${i + 1}|${totalChunks}|${chunkData}`;
      newChunks.push(formattedChunk);
    }
    
    setChunks(newChunks);
  };

  const handleScanChunk = (index: number, total: number, data: string) => {
    if (expectedTotal === null) {
      setExpectedTotal(total);
    } else if (expectedTotal !== total) {
      // Mismatched sequence, you could show an error, but let's ignore for now or reset
      // For simplicity, we just accept it if they match.
    }

    setScannedChunks(prev => {
      if (prev[index]) return prev; // already scanned
      return { ...prev, [index]: data };
    });
  };

  const handleResetScanner = () => {
    setScannedChunks({});
    setExpectedTotal(null);
  };

  const isComplete = expectedTotal !== null && Object.keys(scannedChunks).length === expectedTotal;

  const reassembledText = useMemo(() => {
    if (!isComplete || expectedTotal === null) return '';
    let result = '';
    for (let i = 1; i <= expectedTotal; i++) {
      result += scannedChunks[i] || '';
    }
    return result;
  }, [scannedChunks, expectedTotal, isComplete]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm border border-blue-200">
            <QrCode size={36} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Multi-QR Text Encoder</h1>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed mt-2">
              Split long instructions or internal forms into multiple QR codes, then scan them to reassemble the complete text.
            </p>
          </div>
          
          <div className="inline-flex bg-slate-200/60 p-1 rounded-xl">
            <button 
              onClick={() => setMode('encode')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'encode' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Encode (Generate)
            </button>
            <button 
              onClick={() => setMode('decode')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'decode' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Decode (Scan)
            </button>
          </div>
        </header>

        {mode === 'encode' ? (
          <div className="space-y-6">
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
                  className="w-full h-48 p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y text-slate-700 placeholder:text-slate-400 shadow-inner"
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

            {chunks.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-semibold text-slate-800">Generated Sequence</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full font-medium">
                      {chunks.length} QR Code{chunks.length !== 1 && 's'}
                    </span>
                    <button
                      onClick={handleDownloadZip}
                      className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      <Download size={16} />
                      Download ZIP
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {chunks.map((chunk, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center space-y-4">
                      <div className="w-full flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Part</span>
                        <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                          {index + 1} / {chunks.length}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <QRCodeSVG 
                          id={`qr-svg-${index}`}
                          value={chunk} 
                          size={200}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-xs text-slate-400 font-mono text-center truncate w-full px-2" title={chunk}>
                        {chunk.substring(0, 30)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {!isComplete && (
              <main className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                    <ScanLine size={20} className="text-blue-500" />
                    Scan QR Sequence
                  </h2>
                  <button 
                    onClick={handleResetScanner}
                    disabled={Object.keys(scannedChunks).length === 0}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                </div>
                
                <QRScanner onScanChunk={handleScanChunk} />
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Progress</span>
                    <span className="text-sm font-bold text-blue-600">
                      {Object.keys(scannedChunks).length} / {expectedTotal || '?'}
                    </span>
                  </div>
                  
                  {expectedTotal && (
                    <div className="flex gap-1.5 flex-wrap">
                      {Array.from({ length: expectedTotal }).map((_, i) => {
                        const isScanned = !!scannedChunks[i + 1];
                        return (
                          <div 
                            key={i} 
                            className={`flex-1 h-2 rounded-full min-w-[20px] max-w-[40px] transition-all ${
                              isScanned ? 'bg-blue-500' : 'bg-slate-200'
                            }`}
                            title={`Part ${i + 1}`}
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  {!expectedTotal && (
                    <p className="text-xs text-slate-500 text-center">Scan the first QR code to begin.</p>
                  )}
                </div>
              </main>
            )}

            {isComplete && (
              <main className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-green-50 p-6 border-b border-green-100 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-green-800">Scan Complete</h2>
                    <p className="text-sm text-green-600/80">Successfully reassembled {expectedTotal} parts.</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="relative">
                    <textarea
                      readOnly
                      className="w-full h-64 p-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 outline-none text-slate-700 font-sans shadow-inner"
                      value={reassembledText}
                    />
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-all flex items-center justify-center"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleResetScanner}
                      className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                      Scan Another
                    </button>
                  </div>
                </div>
              </main>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
