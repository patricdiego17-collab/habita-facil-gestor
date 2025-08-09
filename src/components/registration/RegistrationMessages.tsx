
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface MessageItem {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  is_internal: boolean;
  message_type: string;
}

interface RegistrationMessagesProps {
  socialRegistrationId: string;
  currentUserId: string;
}

const RegistrationMessages: React.FC<RegistrationMessagesProps> = ({
  socialRegistrationId,
  currentUserId,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    console.log('[RegistrationMessages] Loading for', socialRegistrationId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('social_registration_id', socialRegistrationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
      setLoading(false);
      return;
    }
    setMessages((data || []) as MessageItem[]);
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
    // opcional: realtime poderia ser adicionado depois
  }, [socialRegistrationId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      social_registration_id: socialRegistrationId,
      user_id: currentUserId,
      message: newMessage.trim(),
      is_internal: false,
      message_type: 'staff_message',
    });

    if (error) {
      console.error('Error sending message:', error);
      setSending(false);
      return;
    }

    setNewMessage('');
    setSending(false);
    loadMessages();
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="space-y-4">
      <div className="max-h-64 overflow-auto space-y-2 border rounded p-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</div>
        ) : (
          messages.map((m) => (
            <Card key={m.id} className="border">
              <CardContent className="py-3">
                <div className="text-sm">{m.message}</div>
                <div className="text-xs text-muted-foreground mt-1">{formatDateTime(m.created_at)}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Escreva uma mensagem para o cidadão..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button onClick={sendMessage} disabled={sending}>
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </div>
  );
};

export default RegistrationMessages;
