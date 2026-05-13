import React from 'react';

interface PdfViewerProps {
  url: string;
  searchTerm?: string;
  blindMode?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, blindMode }) => {
  return (
    <div className={`w-full h-full overflow-hidden bg-slate-200 st-scrollbar ${blindMode ? 'blur-2xl' : ''}`}>
      <iframe
        src={url}
        className="w-full h-full border-none"
        title="Resume PDF"
      />
    </div>
  );
};
