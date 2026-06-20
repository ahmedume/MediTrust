import { pdfDownloadUrl } from "../api";

export default function PDFDownloadButton({ reportId }: { reportId: string }) {
  return (
    <a
      href={pdfDownloadUrl(reportId)}
      download
      className="inline-flex items-center gap-2 rounded-xl glass glass-hover px-5 py-2.5 text-sm font-medium text-white"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M6 18h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Download PDF Report
    </a>
  );
}
