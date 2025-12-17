import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Receipt, BarChart3, Newspaper, ClipboardList, Mail, FileSignature, StickyNote, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const typeIcons = {
  receipt: Receipt,
  report: BarChart3,
  article: Newspaper,
  assignment: ClipboardList,
  email: Mail,
  contract: FileSignature,
  notes: StickyNote,
  other: FileText,
};

export default function DocumentCard({ document, index = 0 }) {
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const docType = document.doc_type || 'other';
  const Icon = typeIcons[docType] || typeIcons.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/documents/${document.id}`}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-5 cursor-pointer group relative overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.3),0_0_30px_rgba(153,225,217,0.2)] transition-all duration-300 hover:-translate-y-1">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--pearl-aqua)]/40" />

            <CardContent className="p-0 pt-2">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Icon container - NOT a badge */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--pearl-aqua)]/15 border border-[var(--pearl-aqua)]/30">
                    <Icon className="w-5 h-5 text-[var(--pearl-aqua)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--mint-cream)] truncate group-hover:text-[var(--pearl-aqua)] transition-colors">
                      {document.original_filename}
                    </h3>
                    <p className="text-xs text-[var(--taupe-grey)] uppercase tracking-wide">
                      {document.file_type} • {formatFileSize(document.file_size)}
                    </p>
                  </div>
                </div>
                {/* Badge - actual label use case */}
                {document.doc_type && (
                  <Badge variant="default">
                    {document.doc_type}
                  </Badge>
                )}
              </div>

              {document.summary && (
                <p className="text-sm text-[var(--mint-cream)]/70 line-clamp-2 mb-4 leading-relaxed">
                  {document.summary}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[var(--mint-cream)]/5">
                <span className="text-xs text-[var(--taupe-grey)]">{formatDate(document.created_at)}</span>
                <div className="flex items-center gap-1 text-xs text-[var(--pearl-aqua)] opacity-0 group-hover:opacity-100 transition-opacity">
                  View details <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  );
}
