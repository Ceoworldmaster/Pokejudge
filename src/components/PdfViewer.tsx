import { useState } from 'react';
import { FileText, Download, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

export function PdfViewer({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(true);
  const [fullHeight, setFullHeight] = useState(false);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-700/80 bg-slate-900/80 px-4 py-2.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
        >
          <FileText className="h-4 w-4 text-red-400" />
          Problem Statement (PDF)
          <span className={`text-xs text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFullHeight((v) => !v)}
            title={fullHeight ? 'Fit height' : 'Expand height'}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {fullHeight ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            title="Open in new tab"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href={url}
            download
            title="Download PDF"
            className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* PDF iframe */}
      {expanded && (
        <iframe
          src={`${url}#view=FitH&toolbar=1`}
          className={`w-full rounded-b-xl border-0 bg-slate-950 ${fullHeight ? 'h-[200vh]' : 'h-[137vh] min-h-[1000px]'}`}
          title="Problem Statement PDF"
        />
      )}
    </div>
  );
}
