import { useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, Image as ImageIcon, Video, FileSpreadsheet, File, Box } from "lucide-react";
import { cn } from "@/lib/utils";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentThumbnailProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  className?: string;
  onClick?: () => void;
}

function getFileCategory(fileType: string, fileName: string): 'pdf' | 'image' | 'video' | 'word' | 'excel' | 'powerpoint' | 'solidworks' | 'other' {
  const lowerFileName = fileName.toLowerCase();
  
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.includes('word') || fileType.includes('msword') || lowerFileName.endsWith('.doc') || lowerFileName.endsWith('.docx')) return 'word';
  if (fileType.includes('excel') || fileType.includes('spreadsheet') || lowerFileName.endsWith('.xls') || lowerFileName.endsWith('.xlsx')) return 'excel';
  if (fileType.includes('powerpoint') || fileType.includes('presentation') || lowerFileName.endsWith('.ppt') || lowerFileName.endsWith('.pptx')) return 'powerpoint';
  if (lowerFileName.endsWith('.sldprt') || lowerFileName.endsWith('.sldasm') || lowerFileName.endsWith('.slddrw')) return 'solidworks';
  
  return 'other';
}

function IconFallback({ category, className }: { category: string; className?: string }) {
  const iconProps = { className: cn("w-12 h-12", className) };
  
  switch (category) {
    case 'word':
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
          <FileText {...iconProps} className={cn(iconProps.className, "text-white")} />
          <span className="text-xs font-semibold text-white mt-1">DOCX</span>
        </div>
      );
    case 'excel':
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-green-600 to-green-700 rounded-md">
          <FileSpreadsheet {...iconProps} className={cn(iconProps.className, "text-white")} />
          <span className="text-xs font-semibold text-white mt-1">XLSX</span>
        </div>
      );
    case 'powerpoint':
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-orange-500 to-orange-600 rounded-md">
          <FileText {...iconProps} className={cn(iconProps.className, "text-white")} />
          <span className="text-xs font-semibold text-white mt-1">PPTX</span>
        </div>
      );
    case 'solidworks':
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-red-600 to-red-700 rounded-md">
          <Box {...iconProps} className={cn(iconProps.className, "text-white")} />
          <span className="text-xs font-semibold text-white mt-1">CAD</span>
        </div>
      );
    case 'video':
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-500 to-purple-600 rounded-md">
          <Video {...iconProps} className={cn(iconProps.className, "text-white")} />
          <span className="text-xs font-semibold text-white mt-1">VIDEO</span>
        </div>
      );
    case 'pdf':
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-red-500 to-red-600 rounded-md">
          <FileText {...iconProps} className={cn(iconProps.className, "text-white")} />
          <span className="text-xs font-semibold text-white mt-1">PDF</span>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-500 to-gray-600 rounded-md">
          <File {...iconProps} className={cn(iconProps.className, "text-white")} />
        </div>
      );
  }
}

export function DocumentThumbnail({ fileUrl, fileName, fileType, className, onClick }: DocumentThumbnailProps) {
  const [pdfError, setPdfError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const category = getFileCategory(fileType, fileName);

  return (
    <div 
      className={cn(
        "relative w-full h-32 bg-muted rounded-md overflow-hidden border cursor-pointer hover-elevate active-elevate-2 transition-all",
        className
      )}
      onClick={onClick}
      data-testid={`thumbnail-${fileName}`}
    >
      {category === 'pdf' && !pdfError ? (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <Document
            file={fileUrl}
            onLoadError={() => setPdfError(true)}
            className="flex items-center justify-center"
          >
            <Page 
              pageNumber={1}
              width={150}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      ) : category === 'image' && !imageError ? (
        <img
          src={fileUrl}
          alt={fileName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <IconFallback category={category} />
      )}
      
      {/* Overlay with file name on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate opacity-0 hover:opacity-100 transition-opacity">
        {fileName}
      </div>
    </div>
  );
}
