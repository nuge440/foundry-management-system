import { useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
  downloadUrl?: string;
}

function getFileCategory(fileType: string, fileName: string): 'pdf' | 'image' | 'video' | 'office' | 'other' {
  const lowerFileName = fileName.toLowerCase();
  
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  
  // Microsoft Office formats
  if (
    fileType.includes('word') || fileType.includes('msword') ||
    fileType.includes('excel') || fileType.includes('spreadsheet') ||
    fileType.includes('powerpoint') || fileType.includes('presentation') ||
    lowerFileName.endsWith('.doc') || lowerFileName.endsWith('.docx') ||
    lowerFileName.endsWith('.xls') || lowerFileName.endsWith('.xlsx') ||
    lowerFileName.endsWith('.ppt') || lowerFileName.endsWith('.pptx')
  ) {
    return 'office';
  }
  
  return 'other';
}

export function DocumentViewer({ isOpen, onClose, fileUrl, fileName, fileType, downloadUrl }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const category = getFileCategory(fileType, fileName);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose} data-testid="modal-document-viewer">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div 
        className="relative bg-card border rounded-md w-full max-w-6xl max-h-[90vh] flex flex-col shadow-xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-card z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{fileName}</h2>
            {category === 'pdf' && numPages > 0 && (
              <p className="text-sm text-muted-foreground">
                Page {pageNumber} of {numPages}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {downloadUrl && (
              <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download-document">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-viewer">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1 bg-muted/30">
          <div className="flex items-center justify-center min-h-full p-4">
            {category === 'pdf' && (
              <div className="bg-white rounded-md shadow-lg">
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="flex items-center justify-center"
                >
                  <Page 
                    pageNumber={pageNumber}
                    width={Math.min(window.innerWidth - 100, 800)}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              </div>
            )}

            {category === 'image' && (
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-md shadow-lg"
              />
            )}

            {category === 'video' && (
              <video
                src={fileUrl}
                controls
                className="max-w-full max-h-full rounded-md shadow-lg"
              >
                Your browser does not support the video tag.
              </video>
            )}

            {category === 'office' && (
              <div className="w-full h-full min-h-[600px]">
                <iframe
                  src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`}
                  className="w-full h-full border-0 rounded-md shadow-lg"
                  title={fileName}
                />
              </div>
            )}

            {category === 'other' && (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Preview not available for this file type.</p>
                {downloadUrl && (
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download to view
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PDF Navigation */}
        {category === 'pdf' && numPages > 1 && (
          <div className="sticky bottom-0 flex items-center justify-center gap-4 p-3 border-t bg-card">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
