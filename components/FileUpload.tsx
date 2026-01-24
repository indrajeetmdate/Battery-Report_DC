import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
        <div 
          className={`relative flex flex-col items-center justify-center w-full p-10 transition-colors border-2 border-dashed rounded-lg cursor-pointer ${dragActive ? 'border-[#78AD3E] bg-[#F0F5E9]' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
            <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                onChange={handleChange}
                accept=".xlsx,.xls,.csv"
            />
            
            {isLoading ? (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-[#78AD3E] animate-spin mb-4" />
                    <p className="text-lg font-medium text-gray-600">Processing File...</p>
                </div>
            ) : (
                <>
                    <div className="p-4 bg-[#F8F9F8] rounded-full mb-4">
                        <Upload className="w-8 h-8 text-[#78AD3E]" />
                    </div>
                    <p className="mb-2 text-xl font-semibold text-[#41463F]">
                        Upload Battery Test Data
                    </p>
                    <p className="mb-6 text-sm text-gray-500">
                        Drag & drop your Excel file here, or click to browse
                    </p>
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); onButtonClick(); }}>
                        Select File
                    </Button>
                </>
            )}
        </div>
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 bg-white p-3 rounded-md border border-gray-100">
            <FileSpreadsheet className="w-5 h-5 text-[#78AD3E] mt-0.5" />
            <div>
                <p className="font-medium text-[#41463F]">Supported Formats</p>
                <p>Excel (.xlsx) containing "The test data", "Logo", and "Loop Detail" sheets.</p>
            </div>
        </div>
    </div>
  );
};
