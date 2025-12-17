import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import Layout from '@/components/Layout';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';

export default function LibraryPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data.documents);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadComplete = (newDoc) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  return (
    <Layout>
      <DocumentUpload onUploadComplete={handleUploadComplete} />
      <DocumentList documents={documents} loading={loading} />
    </Layout>
  );
}
