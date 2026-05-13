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
  const blobUrl = useMemo(() => (url.startsWith('data:') ? toBlobUrl(url) : url), [url]);

  // Cleanup blob URL on unmount
  React.useEffect(() => {
    return () => { if (blobUrl && blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  if (!blobUrl) {
    return <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm font-medium">Preview unavailable</div>;
  }

  return (
    <div className={`w-full h-full overflow-hidden bg-slate-200 ${blindMode ? 'blur-2xl' : ''}`}>
      <iframe
        src={blobUrl}
        className="w-full h-full border-none"
        title="Resume PDF"
      />
    </div>
  );
};
