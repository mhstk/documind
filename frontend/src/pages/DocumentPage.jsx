import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Trash2, Users, Building2, Calendar, DollarSign, MapPin, BookOpen, HelpCircle, Lightbulb, GitBranch, Clock, Send, MessageSquare, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/api/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSummary, setChatSummary] = useState(null);
  const [displayMessages, setDisplayMessages] = useState([]); // Messages shown in UI
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.getDocument(id)
      .then(data => setDocument(data.document))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const handleDelete = async () => {
    try {
      await api.deleteDocument(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to display
    const newUserMsg = { role: 'user', content: userMessage };
    setDisplayMessages(prev => [...prev, newUserMsg]);
    setChatLoading(true);

    try {
      // Send message with history and summary
      const result = await api.chatWithDocument(id, userMessage, messages, chatSummary);

      const newAssistantMsg = { role: 'assistant', content: result.answer };
      setDisplayMessages(prev => [...prev, newAssistantMsg]);

      // Check if backend wants us to summarize
      if (result.needs_summary && result.summary) {
        // Store the summary and reset messages for next batch
        setChatSummary(result.summary);
        setMessages([]);
      } else {
        // Add both messages to history for next request
        setMessages(prev => [...prev, newUserMsg, newAssistantMsg]);
      }
    } catch (err) {
      setDisplayMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--pearl-aqua)]/30 border-t-[var(--pearl-aqua)] animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !document) {
    return (
      <Layout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <p className="text-red-400 mb-4">{error || 'Document not found'}</p>
          <Button variant="link" asChild>
            <Link to="/">Back to Library</Link>
          </Button>
        </motion.div>
      </Layout>
    );
  }

  const doc = document;
  const entities = doc.entities || {};

  const entitySections = [
    { key: 'people', label: 'People', icon: Users, items: entities.people },
    { key: 'organizations', label: 'Organizations', icon: Building2, items: entities.organizations },
    { key: 'dates', label: 'Dates', icon: Calendar, items: entities.dates },
    { key: 'amounts', label: 'Amounts', icon: DollarSign, items: entities.amounts },
    { key: 'locations', label: 'Locations', icon: MapPin, items: entities.locations },
  ].filter(s => s.items?.length > 0);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Details - Left Side */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="h-2 bg-[var(--pearl-aqua)]/40" />
              <CardContent className="p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--mint-cream)] mb-2">{doc.original_filename}</h1>
                    <p className="text-[var(--taupe-grey)]">{doc.file_type?.toUpperCase()} • Uploaded {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.doc_type && (
                      <Badge variant="default" className="px-4 py-2">
                        {doc.doc_type}
                      </Badge>
                    )}
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Document</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete "{doc.original_filename}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDelete}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Summary */}
                {doc.summary && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--mint-cream)] mb-3 flex items-center">
                      <span className="w-1 h-6 bg-gradient-to-b from-[var(--pearl-aqua)] to-[var(--tropical-teal)] rounded-full mr-3" />
                      Summary
                    </h2>
                    <p className="text-[var(--mint-cream)]/80 leading-relaxed">{doc.summary}</p>
                  </motion.div>
                )}

                {/* Key Points */}
                {doc.key_points?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--mint-cream)] mb-3 flex items-center">
                      <span className="w-1 h-6 bg-gradient-to-b from-[var(--tropical-teal)] to-[var(--taupe-grey)] rounded-full mr-3" />
                      Key Points
                    </h2>
                    <ul className="space-y-2">
                      {doc.key_points.map((point, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          className="flex items-start text-[var(--mint-cream)]/80"
                        >
                          <span className="w-2 h-2 rounded-full bg-[var(--pearl-aqua)] mt-2 mr-3 flex-shrink-0" />
                          {point}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Sections */}
                {doc.sections?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--mint-cream)] mb-4 flex items-center">
                      <BookOpen className="w-5 h-5 mr-3 text-[var(--pearl-aqua)]" />
                      Document Sections
                    </h2>
                    <div className="space-y-3">
                      {doc.sections.map((section, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + i * 0.05 }}
                        >
                          <Card className="p-4">
                            <h3 className="font-medium text-[var(--pearl-aqua)] mb-2">{section.title}</h3>
                            <p className="text-sm text-[var(--mint-cream)]/70">{section.content}</p>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Questions Answered */}
                {doc.questions_answered?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--mint-cream)] mb-3 flex items-center">
                      <HelpCircle className="w-5 h-5 mr-3 text-[var(--pearl-aqua)]" />
                      Questions This Document Answers
                    </h2>
                    <ul className="space-y-2">
                      {doc.questions_answered.map((q, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="flex items-start text-[var(--mint-cream)]/80"
                        >
                          <span className="text-[var(--pearl-aqua)] mr-3">Q:</span>
                          {q}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Conclusions */}
                {doc.conclusions?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--mint-cream)] mb-3 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-3 text-[var(--pearl-aqua)]" />
                      Conclusions & Recommendations
                    </h2>
                    <ul className="space-y-2">
                      {doc.conclusions.map((c, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.05 }}
                          className="flex items-start text-[var(--mint-cream)]/80"
                        >
                          <span className="w-2 h-2 rounded-full bg-[var(--tropical-teal)] mt-2 mr-3 flex-shrink-0" />
                          {c}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Relationships */}
                {doc.relationships?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--mint-cream)] mb-3 flex items-center">
                      <GitBranch className="w-5 h-5 mr-3 text-[var(--pearl-aqua)]" />
                      Relationships
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {doc.relationships.map((rel, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.05 }}
                        >
                          <Badge variant="outline" className="py-2 px-3 text-sm">
                            {rel}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Timeline */}
                {doc.timeline?.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--mint-cream)] mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-3 text-[var(--pearl-aqua)]" />
                      Timeline
                    </h2>
                    <div className="relative border-l-2 border-[var(--pearl-aqua)]/30 ml-2 pl-6 space-y-4">
                      {doc.timeline.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + i * 0.05 }}
                          className="relative"
                        >
                          <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-[var(--pearl-aqua)] border-4 border-[var(--dark-purple)]" />
                          <div className="text-sm font-medium text-[var(--pearl-aqua)]">{item.date}</div>
                          <div className="text-[var(--mint-cream)]/80">{item.event}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Entities */}
                {entitySections.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--mint-cream)] mb-4 flex items-center">
                      <span className="w-1 h-6 bg-gradient-to-b from-[var(--pearl-aqua)] to-[var(--taupe-grey)] rounded-full mr-3" />
                      Entities
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {entitySections.map(({ key, label, icon: Icon, items }) => (
                        <Card key={key} className="p-4">
                          <h3 className="text-sm font-medium text-[var(--taupe-grey)] mb-2 flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {label}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item, i) => (
                              <Badge key={i} variant="secondary">{item}</Badge>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Raw Text */}
                {doc.raw_text && (
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => setShowRawText(!showRawText)}
                      className="mb-3 p-0 h-auto"
                    >
                      <motion.div animate={{ rotate: showRawText ? 90 : 0 }}>
                        <ChevronRight className="w-5 h-5 mr-2" />
                      </motion.div>
                      <span className="font-semibold">Raw Text</span>
                    </Button>
                    <AnimatePresence>
                      {showRawText && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <Card className="p-4">
                            <pre className="text-sm text-[var(--mint-cream)]/60 whitespace-pre-wrap overflow-auto max-h-96">
                              {doc.raw_text.slice(0, 5000)}
                              {doc.raw_text.length > 5000 && '\n\n... (truncated)'}
                            </pre>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Panel - Right Side */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-12rem)] flex flex-col sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[var(--mint-cream)]">
                  <Sparkles className="w-5 h-5 text-[var(--pearl-aqua)]" />
                  Ask About This Document
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {displayMessages.length === 0 && !chatLoading ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-[var(--taupe-grey)]/50 mb-3" />
                      <p className="text-[var(--taupe-grey)] text-sm">
                        Ask questions and get AI-powered answers from this document
                      </p>
                    </div>
                  ) : (
                    <>
                      {displayMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-xl ${
                            msg.role === 'user'
                              ? 'bg-[var(--pearl-aqua)]/10 border border-[var(--pearl-aqua)]/20 ml-8'
                              : 'bg-white/5 border border-white/10 mr-8'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <p className="text-sm text-[var(--pearl-aqua)]">{msg.content}</p>
                          ) : (
                            <div className="text-sm text-[var(--mint-cream)]/80 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {chatLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 mr-8"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-[var(--pearl-aqua)]/30 border-t-[var(--pearl-aqua)] animate-spin" />
                            <span className="text-sm text-[var(--taupe-grey)]">Thinking...</span>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about this document..."
                    disabled={chatLoading}
                    className="flex-1 bg-white/5 border border-[var(--glass-border)] rounded-xl px-4 py-2 text-sm text-[var(--mint-cream)] placeholder:text-[var(--taupe-grey)] !outline-none focus:border-[var(--pearl-aqua)]/50 disabled:opacity-50"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || chatLoading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
