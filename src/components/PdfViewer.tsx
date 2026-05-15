import React, { useMemo } from 'react';

interface PdfViewerProps {
  url: string;
  searchTerm?: string;
  blindMode?: boolean;
}

function toBlobUrl(dataUrl: string): string | null {
  try {
    // Convert data: URL to Blob URL to avoid Chrome download prompt
    const [meta, b64] = dataUrl.split(',');
    const mime = meta.match(/:(.*?);/)?.[1] || 'application/pdf';
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  } catch {
    return null;
  }
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, blindMode }) => {
  const isPdf = url.includes('application/pdf') || url.endsWith('.pdf');
  const blobUrl = useMemo(() => (isPdf && url.startsWith('data:') ? toBlobUrl(url) : null), [url, isPdf]);

  // Cleanup blob URL on unmount
  React.useEffect(() => {
    return () => { if (blobUrl && blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  // Only preview PDFs inline — DOCX etc would trigger browser download in iframe
  if (!blobUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
        <span className="text-sm font-medium">Preview not available</span>
        <a href={url} download className="text-xs font-medium text-st-light hover:underline">Click to download</a>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden bg-slate-200">
      <iframe
        src={blobUrl}
        className="w-full h-full border-none"
        title="Resume PDF"
      />
    </div>
  );
};
