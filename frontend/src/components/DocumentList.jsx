import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import DocumentCard from './DocumentCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function DocumentSkeleton() {
  return (
    <Card className="p-5">
      <CardContent className="p-0">
        <div className="flex items-center space-x-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function DocumentList({ documents, loading }) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => <DocumentSkeleton key={i} />)}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--pearl-aqua)]/20 to-[var(--tropical-teal)]/20 flex items-center justify-center"
        >
          <FileText className="w-10 h-10 text-[var(--taupe-grey)]" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[var(--mint-cream)] mb-2">No documents yet</h3>
        <p className="text-[var(--taupe-grey)]">Upload your first document to get started</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {documents.map((doc, index) => (
        <DocumentCard key={doc.id} document={doc} index={index} />
      ))}
    </motion.div>
  );
}
