import { UploadCloud, FileType } from "lucide-react";
import React, { useCallback, useState } from "react";
import { cn } from "../lib/utils";

interface UploadDropzoneProps {
  onFilesSelect: (files: File[]) => void;
  isLoading: boolean;
}

export function UploadDropzone({ onFilesSelect, isLoading }: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelect(Array.from(e.dataTransfer.files));
      }
    },
    [onFilesSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelect(Array.from(e.target.files));
      }
    },
    [onFilesSelect]
  );

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out p-12",
        "flex flex-col items-center justify-center text-center gap-4 bg-[#141414]",
        isDragActive
          ? "border-blue-500 bg-blue-900/20"
          : "border-white/5 hover:border-white/20 hover:bg-[#1a1a1a]",
        isLoading && "opacity-50 pointer-events-none"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,.csv,.xlsx,.xls"
        multiple
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      
      <div className="p-4 bg-blue-900/20 text-blue-500 border border-blue-500/20 rounded-full mb-2">
        <UploadCloud className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">
          {isLoading ? "Processing..." : "Upload Bank Statements"}
        </h3>
        <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
          {isLoading
            ? "Our AI is reading and categorizing your transactions. This may take a moment."
            : "Drag and drop your PDF, Excel, or CSV statements here, or click to browse."}
        </p>
      </div>
      
      {!isLoading && (
        <div className="flex gap-4 text-xs font-medium text-gray-400">
          <span className="flex items-center gap-1"><FileType className="w-4 h-4"/> PDF</span>
          <span className="flex items-center gap-1"><FileType className="w-4 h-4"/> Excel</span>
          <span className="flex items-center gap-1"><FileType className="w-4 h-4"/> CSV</span>
        </div>
      )}
    </div>
  );
}
