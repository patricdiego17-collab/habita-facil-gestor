import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  user_id: string;
  message: string;
  message_type: string;
  is_internal: boolean;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

interface CommunicationPanelProps {
  socialRegistrationId: string;
  userProfile: {
    id: string;
    user_id: string;
    full_name: string | null;
    role: string | null;
  };
}

export const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  socialRegistrationId,
  userProfile
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          user_id,
          message,
          message_type,
          is_internal,
          created_at
        `)
        .eq('social_registration_id', socialRegistrationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      // Load user information for each message
      const messagesWithUsers = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('user_id', msg.user_id)
            .maybeSingle();

          return {
            ...msg,
            user_name: profile?.full_name || 'Usuário',
            user_role: profile?.role || 'citizen'
          };
        })
      );

      setMessages(messagesWithUsers);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: userProfile.user_id,
          social_registration_id: socialRegistrationId,
          message: newMessage.trim(),
          message_type: 'user_message',
          is_internal: userProfile.role === 'admin' || userProfile.role === 'social_worker'
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem.",
          variant: "destructive",
        });
        return;
      }

      setNewMessage('');
      await loadMessages(); // Reload messages
      
      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao enviar mensagem.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'social_worker':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'social_worker':
        return 'Assistente Social';
      default:
        return 'Cidadão';
    }
  };

  useEffect(() => {
    if (socialRegistrationId) {
      loadMessages();
    }
  }, [socialRegistrationId]);

  useEffect(() => {
    if (!socialRegistrationId) return;

    const channel = supabase
      .channel(`messages-realtime-${socialRegistrationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `social_registration_id=eq.${socialRegistrationId}` },
        async () => {
          await loadMessages();
          toast({
            title: 'Nova mensagem',
            description: 'Você recebeu uma nova mensagem.',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [socialRegistrationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comunicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando mensagens...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comunicação
          {messages.length > 0 && (
            <Badge variant="secondary">{messages.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Seja o primeiro a iniciar a conversa!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="border-l-2 border-muted pl-4 pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {message.user_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {message.user_name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRoleColor(message.user_role || 'citizen')}`}
                      >
                        {getRoleName(message.user_role || 'citizen')}
                      </Badge>
                      {message.is_internal && (
                        <Badge variant="secondary" className="text-xs">
                          Interno
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">
                      {message.message}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Message Input */}
        <div className="space-y-3 border-t pt-4">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                sendMessage();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Ctrl + Enter para enviar
            </p>
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};