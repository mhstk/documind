import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, MessageSquare, Send, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/api/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'searchPageState';

export default function SearchPage() {
  const [isFocused, setIsFocused] = useState(false);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [displayMessages, setDisplayMessages] = useState([]); // Messages shown in UI
  const [messages, setMessages] = useState([]); // Messages sent to API for history
  const [chatSummary, setChatSummary] = useState(null); // Conversation summary when limit reached
  const [isAsking, setIsAsking] = useState(false);
  const [qaSources, setQaSources] = useState([]); // Sources from last Q&A

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isInitialized = useRef(false);

  // Load state from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDisplayMessages(parsed.displayMessages || []);
        setMessages(parsed.messages || []);
        setChatSummary(parsed.chatSummary || null);
        setQaSources(parsed.qaSources || []);
      } catch (e) {
        console.error('Failed to load search state:', e);
      }
    }
    isInitialized.current = true;
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (!isInitialized.current) return;

    const state = {
      displayMessages,
      messages,
      chatSummary,
      qaSources,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [displayMessages, messages, chatSummary, qaSources]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const handleClear = useCallback(() => {
    setDisplayMessages([]);
    setMessages([]);
    setChatSummary(null);
    setQaSources([]);
    setQuestion('');
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!question.trim() || isAsking) return;

    const currentQuestion = question;
    setQuestion('');
    setIsAsking(true);

    // Add question to display
    setDisplayMessages(prev => [
      ...prev,
      { type: 'question', content: currentQuestion }
    ]);

    try {
      // Send question with conversation history
      const data = await api.askQuestion(currentQuestion, messages, chatSummary);
      const sources = data.sources || [];

      // Add answer with sources to display
      setDisplayMessages(prev => [
        ...prev,
        {
          type: 'answer',
          content: data.answer,
          sources: sources
        }
      ]);

      // Update sources for Document Results section
      setQaSources(sources);

      // Create message objects for history
      const newUserMsg = { role: 'user', content: currentQuestion };
      const newAssistantMsg = { role: 'assistant', content: data.answer };

      // Handle conversation summarization
      if (data.needs_summary && data.summary) {
        // Backend summarized - store summary and reset messages
        setChatSummary(data.summary);
        setMessages([]);
      } else {
        // Add to messages for history
        setMessages(prev => [...prev, newUserMsg, newAssistantMsg]);
      }
    } catch (err) {
      console.error('Q&A failed:', err);
      setDisplayMessages(prev => [
        ...prev,
        { type: 'answer', content: 'Sorry, I encountered an error. Please try again.', sources: [] }
      ]);
      setQaSources([]);
    } finally {
      setIsAsking(false);
    }
  };

  const hasConversation = displayMessages.length > 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-[var(--mint-cream)] mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Ask Your Documents
          </motion.h1>
          <motion.p
            className="text-[var(--taupe-grey)] max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Get AI-powered answers from all your uploaded documents
          </motion.p>
        </motion.div>

        {/* Main Input Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <form onSubmit={handleAskQuestion}>
            <motion.div
              className={cn(
                "relative rounded-2xl transition-all duration-300",
                isFocused && "shadow-[0_0_40px_rgba(153,225,217,0.3)]"
              )}
              animate={{
                scale: isFocused ? 1.02 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Animated border glow */}
              <motion.div
                className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[var(--pearl-aqua)] via-[var(--tropical-teal)] to-[var(--pearl-aqua)] opacity-0"
                animate={{
                  opacity: isFocused ? 0.5 : 0,
                  backgroundPosition: isFocused ? ['0% 50%', '100% 50%', '0% 50%'] : '0% 50%',
                }}
                transition={{
                  opacity: { duration: 0.2 },
                  backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
                }}
                style={{ backgroundSize: '200% 200%' }}
              />

              <Card className="relative overflow-hidden">
                <div className="flex items-center p-2">
                  <div className="flex items-center justify-center w-12 h-12">
                    <motion.div
                      animate={{
                        rotate: isAsking ? 360 : 0,
                      }}
                      transition={{
                        duration: 1,
                        repeat: isAsking ? Infinity : 0,
                        ease: 'linear',
                      }}
                    >
                      <Sparkles className={cn(
                        "w-5 h-5 transition-colors duration-200",
                        isFocused ? "text-[var(--pearl-aqua)]" : "text-[var(--taupe-grey)]"
                      )} />
                    </motion.div>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Ask a question about your documents..."
                    disabled={isAsking}
                    className="flex-1 bg-transparent text-[var(--mint-cream)] placeholder:text-[var(--taupe-grey)] text-lg !outline-none disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    disabled={!question.trim() || isAsking}
                    className="mr-2"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isAsking ? 'Thinking...' : 'Ask'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </form>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mt-12">
          {/* Chat History Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[var(--mint-cream)]">
                    <MessageSquare className="w-5 h-5 text-[var(--pearl-aqua)]" />
                    Conversation
                  </CardTitle>
                  {hasConversation && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="text-[var(--taupe-grey)] hover:text-[var(--coral-red)] hover:bg-[var(--coral-red)]/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto space-y-4 pr-2">
                  {displayMessages.length === 0 && !isAsking ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto text-[var(--taupe-grey)]/50 mb-3" />
                      <p className="text-[var(--taupe-grey)] text-sm">
                        Ask a question above to get AI-powered answers from your documents
                      </p>
                    </div>
                  ) : (
                    <>
                      {displayMessages.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-3 rounded-xl",
                            item.type === 'question'
                              ? "bg-[var(--pearl-aqua)]/10 border border-[var(--pearl-aqua)]/20 ml-8"
                              : "bg-white/5 border border-white/10 mr-8"
                          )}
                        >
                          {item.type === 'question' ? (
                            <p className="text-sm text-[var(--pearl-aqua)]">
                              {item.content}
                            </p>
                          ) : (
                            <div className="text-sm text-[var(--mint-cream)]/80 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                              <ReactMarkdown>{item.content}</ReactMarkdown>
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {/* Loading indicator */}
                      {isAsking && (
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
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sources Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[var(--mint-cream)]">
                  <FileText className="w-5 h-5 text-[var(--pearl-aqua)]" />
                  Referenced Documents
                  {qaSources.length > 0 && (
                    <Badge variant="default" className="ml-2">
                      {qaSources.length} sources
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {qaSources.length > 0 ? (
                    <motion.div
                      key="qa-sources"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full overflow-y-auto space-y-3 pr-2"
                    >
                      <p className="text-xs text-[var(--taupe-grey)] mb-2">
                        Documents used to answer your question:
                      </p>
                      {qaSources.map((source, index) => (
                        <motion.div
                          key={source.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--pearl-aqua)]/30 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/documents/${source.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--pearl-aqua)]/15 flex items-center justify-center text-xs font-bold text-[var(--pearl-aqua)]">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-[var(--mint-cream)] truncate block">
                                {source.filename}
                              </span>
                              <span className="text-xs text-[var(--taupe-grey)]">
                                {index === 0 ? 'Most relevant' : `Relevance #${index + 1}`}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <FileText className="w-12 h-12 mx-auto text-[var(--taupe-grey)]/50 mb-3" />
                      <p className="text-[var(--taupe-grey)] text-sm">
                        Ask a question to see which documents are referenced
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
