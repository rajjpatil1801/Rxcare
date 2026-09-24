import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertTriangle, User, Check, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MessageItem, User as UserType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export const MessagesPage: React.FC = () => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // If Doctor, partner is Rahul Mehta (patient ID 2). If Patient, partner is Dr. Rahul Mehta (ID 1).
  const partnerId = role === 'PATIENT' ? 1 : 2;
  const partnerName = role === 'PATIENT' ? 'Dr. Rahul Mehta (Cardiologist)' : 'Rahul Mehta (Patient)';

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(partnerId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [user, partnerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const sent = await api.sendMessage(partnerId, newMessage.trim());
      setMessages([...messages, sent]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Messaging</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Asynchronous, non-emergency communication between patient and primary care team.
        </p>
      </div>

      {/* Mandatory Emergency Disclaimer Banner */}
      <Alert type="warning" title="Emergency Safety Notice">
        Do not use messaging for urgent or emergency medical conditions. In case of acute chest pain, shortness of breath, or emergency symptoms, call 112 / 911 immediately or go to the nearest emergency department.
      </Alert>

      {/* Chat Container */}
      <Card className="p-0 overflow-hidden flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
              {partnerName[0]}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{partnerName}</h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Verified RxCare Provider
              </p>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
          {loading ? (
            <p className="text-center text-xs text-slate-400 py-10">Loading conversation history...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10">
              No messages exchanged yet. Send a non-emergency query or clinical update.
            </p>
          ) : (
            messages.map((m) => {
              const isMine = m.sender === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-subtle ${
                      isMine
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                    <div
                      className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                        isMine ? 'text-brand-100' : 'text-slate-400'
                      }`}
                    >
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your clinical message (non-emergency)..."
            className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={sending}
            disabled={!newMessage.trim()}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};
