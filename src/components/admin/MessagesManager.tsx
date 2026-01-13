import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { MessageSquare, User, Send, Bell, ChevronRight, Bot, UserCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

interface ChatMessage {
  id: string;
  user_id: string | null;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  user_id: string;
  messages: ChatMessage[];
  lastMessage: ChatMessage;
  unreadCount: number;
  userName?: string;
}

const MessagesManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiReply, setIsAiReply] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const { toast } = useToast();

  const fetchMessages = async () => {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Fetch user profiles
    const userIds = [...new Set(messages?.filter(m => m.user_id).map(m => m.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    // Group messages by user
    const conversationMap = new Map<string, ChatMessage[]>();
    
    messages?.forEach(msg => {
      if (msg.user_id) {
        const existing = conversationMap.get(msg.user_id) || [];
        existing.push(msg);
        conversationMap.set(msg.user_id, existing);
      }
    });

    // Convert to conversation objects
    const convos: Conversation[] = [];
    conversationMap.forEach((msgs, userId) => {
      const lastMessage = msgs[msgs.length - 1];
      const unreadCount = msgs.filter(m => m.sender_type === 'customer' && !m.is_read).length;
      const profile = profiles?.find(p => p.user_id === userId);
      
      convos.push({
        user_id: userId,
        messages: msgs,
        lastMessage,
        unreadCount,
        userName: profile?.full_name || 'Customer',
      });
    });

    // Sort by last message date (newest first)
    convos.sort((a, b) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );

    setConversations(convos);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        
        if (newMsg.sender_type === 'customer') {
          sonnerToast.info('New Message!', {
            description: newMsg.message.substring(0, 50) + (newMsg.message.length > 50 ? '...' : ''),
            icon: <Bell className="w-4 h-4" />,
            duration: 8000,
          });
        }

        // Refresh messages
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (userId: string) => {
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_type', 'customer')
      .eq('is_read', false);

    setConversations(prev => 
      prev.map(c => c.user_id === userId ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedConversation(userId);
    markAsRead(userId);
  };

  const generateAiReply = async (customerMessage: string) => {
    setIsAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-reply', {
        body: { message: customerMessage },
      });

      if (error) throw error;
      
      if (data?.reply) {
        setReplyMessage(data.reply);
      } else {
        toast({
          title: 'AI Response',
          description: 'Could not generate a response for this query.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('AI reply error:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate AI reply',
        variant: 'destructive',
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    setIsSending(true);

    const { error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: selectedConversation,
        sender_type: 'admin',
        message: replyMessage.trim(),
        is_read: false,
      }]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive',
      });
    } else {
      setReplyMessage('');
      toast({
        title: 'Sent',
        description: 'Reply sent successfully',
      });
    }

    setIsSending(false);
  };

  // Auto-generate AI reply when AI mode is on and new message is selected
  useEffect(() => {
    if (isAiReply && selectedConvo) {
      const lastCustomerMsg = [...selectedConvo.messages]
        .reverse()
        .find(m => m.sender_type === 'customer');
      
      if (lastCustomerMsg && !replyMessage) {
        generateAiReply(lastCustomerMsg.message);
      }
    }
  }, [isAiReply, selectedConversation]);

  const selectedConvo = conversations.find(c => c.user_id === selectedConversation);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="glass-card lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversations ({conversations.length})
          </CardTitle>
          {/* AI Reply Toggle */}
          <div className="flex items-center justify-between mt-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {isAiReply ? (
                <Bot className="w-4 h-4 text-primary" />
              ) : (
                <UserCircle className="w-4 h-4 text-muted-foreground" />
              )}
              <Label htmlFor="ai-reply" className="text-sm font-medium">
                {isAiReply ? 'AI Reply' : 'Admin Reply'}
              </Label>
            </div>
            <Switch
              id="ai-reply"
              checked={isAiReply}
              onCheckedChange={setIsAiReply}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {conversations.map(convo => (
                  <button
                    key={convo.user_id}
                    onClick={() => handleSelectConversation(convo.user_id)}
                    className={`w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                      selectedConversation === convo.user_id ? 'bg-muted/70' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {convo.userName}
                        </span>
                        {convo.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {convo.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {convo.lastMessage.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {format(new Date(convo.lastMessage.created_at), 'PP')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat View */}
      <Card className="glass-card lg:col-span-2">
        {selectedConvo ? (
          <>
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedConvo.userName}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[520px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {selectedConvo.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          msg.sender_type === 'admin'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_type === 'admin' 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.created_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              <div className="p-3 border-t border-border/50">
                {isAiGenerating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating AI response...
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder={isAiReply ? "AI will generate a response..." : "Type your reply..."}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    {isAiReply && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const lastMsg = selectedConvo?.messages
                            .filter(m => m.sender_type === 'customer')
                            .pop();
                          if (lastMsg) generateAiReply(lastMsg.message);
                        }}
                        disabled={isAiGenerating}
                      >
                        <Bot className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      onClick={sendReply} 
                      disabled={!replyMessage.trim() || isSending}
                      className="self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAiReply ? 'AI mode: Responses are auto-generated for business queries' : 'Press Enter to send, Shift+Enter for new line'}
                </p>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default MessagesManager;
