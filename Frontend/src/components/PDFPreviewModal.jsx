import { useEffect, useState } from 'react';
import { FileText, Download, X, Loader2, AlertCircle } from 'lucide-react';
import { fetchPDFPreviewHtml } from '../services/api';

function PDFPreviewModal({ isOpen, previewUrl, onDownload, onClose, title }) {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !previewUrl) {
      setHtmlContent('');
      setError(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setHtmlContent('');

    fetchPDFPreviewHtml(previewUrl)
      .then((html) => {
        if (!cancelled) {
          setHtmlContent(html);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load preview');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, previewUrl]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[85vh] w-[90vw] flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-preview-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-600" size={22} aria-hidden />
            <h2 id="pdf-preview-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || Boolean(error)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : (
                <Download size={16} aria-hidden />
              )}
              {downloading ? 'Downloading…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <X size={16} aria-hidden />
              Close
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-gray-50">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white">
              <Loader2 size={32} className="animate-spin text-indigo-600" aria-hidden />
              <p className="text-sm text-gray-500">Loading preview…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <AlertCircle size={40} className="text-red-500" aria-hidden />
              <p className="text-sm font-medium text-gray-800">Preview could not be loaded</p>
              <p className="max-w-md text-sm text-gray-500">{error}</p>
              <p className="text-xs text-gray-400">
                Ensure the backend is running on{' '}
                {previewUrl?.split('/api/')[0] || 'http://localhost:5000'}
              </p>
            </div>
          )}

          {!loading && !error && htmlContent && (
            <iframe
              title={title}
              srcDoc={htmlContent}
              sandbox="allow-same-origin allow-scripts"
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFPreviewModal;
