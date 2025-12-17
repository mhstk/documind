import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function DocumentUpload({ onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const validExtensions = ['.pdf', '.txt'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
      toast.error('Invalid file type', {
        description: 'Please upload a PDF or TXT file',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 500);

    try {
      const result = await api.uploadDocument(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      toast.success('Document analyzed', {
        description: `${file.name} has been processed successfully`,
      });
      setTimeout(() => {
        setSuccess(false);
        setIsUploading(false);
        setUploadProgress(0);
        onUploadComplete?.(result.document);
      }, 1500);
    } catch (err) {
      clearInterval(progressInterval);
      toast.error('Upload failed', {
        description: err.message || 'Something went wrong',
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleFileSelect = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <motion.div whileHover={{ scale: isUploading ? 1 : 1.01 }}>
        <Card
          className={cn(
            "relative overflow-hidden p-8 transition-all duration-300",
            isDragging && "scale-[1.02] shadow-[0_0_40px_rgba(153,225,217,0.4),0_0_80px_rgba(112,171,175,0.2)]",
            !isDragging && "shadow-[0_0_20px_rgba(153,225,217,0.3)]",
            isUploading ? 'pointer-events-none' : 'cursor-pointer'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {/* Floating background icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-4 left-8 text-[var(--pearl-aqua)]/20"
            >
              <FileText className="w-12 h-12" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-4 right-12 text-[var(--tropical-teal)]/20"
            >
              <FileText className="w-16 h-16" />
            </motion.div>
          </div>

          <div className="relative z-10 text-center">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex flex-col items-center py-4"
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-[var(--pearl-aqua)]/20 flex items-center justify-center mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Check className="w-10 h-10 text-[var(--pearl-aqua)]" strokeWidth={3} />
                  </motion.div>
                  <p className="text-[var(--pearl-aqua)] font-medium">Analysis Complete!</p>
                </motion.div>
              ) : isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-4"
                >
                  <CircularProgress value={uploadProgress} className="mb-4" />
                  <p className="text-[var(--mint-cream)] font-medium">Analyzing with AI...</p>
                  <p className="text-sm text-[var(--taupe-grey)] mt-1">Extracting insights from your document</p>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--pearl-aqua)] to-[var(--tropical-teal)] flex items-center justify-center shadow-lg"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Upload className="w-8 h-8 text-[var(--shadow-grey)]" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-[var(--mint-cream)] mb-2">Drop your document here</h3>
                  <p className="text-[var(--taupe-grey)] mb-4">
                    or <span className="text-[var(--pearl-aqua)] hover:text-[var(--tropical-teal)] transition-colors font-medium">browse files</span>
                  </p>
                  <p className="text-sm text-[var(--taupe-grey)]/70">Supports PDF and TXT files</p>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileSelect} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
