import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { CheckCircle2, ScanLine, XCircle, FileText } from 'lucide-react';

interface ScannerProps {
  onScanChunk: (index: number, total: number, data: string) => void;
}

export function QRScanner({ onScanChunk }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Parse decoded text
        if (decodedText.startsWith('MQRE|')) {
          const parts = decodedText.split('|');
          if (parts.length >= 4) {
            const index = parseInt(parts[1], 10);
            const total = parseInt(parts[2], 10);
            const data = parts.slice(3).join('|'); // Re-join in case data has '|'
            onScanChunk(index, total, data);
          }
        }
      },
      (errorMessage) => {
        // Ignore normal scanning errors (e.g. no QR code found in frame)
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [onScanChunk]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden bg-slate-50 border border-slate-200 rounded-2xl shadow-inner relative">
      <div id="reader" className="w-full"></div>
      
      <style>{`
        #reader {
          border: none !important;
        }
        #reader img[alt="Info icon"] {
          display: none;
        }
        #reader__dashboard_section_csr span {
          color: #334155;
          font-family: inherit;
        }
        #reader__dashboard_section_swaplink {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
