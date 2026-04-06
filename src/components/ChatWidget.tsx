import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const getChatSessionId = () => {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("chat_session_id", id);
  }
  return id;
};

interface Message {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = getChatSessionId();

  // Check for existing conversation
  useEffect(() => {
    const checkExisting = async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("session_id", sessionId)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setConversationId(data.id);
        setName(data.customer_name);
        setPhone(data.customer_phone);
        setStarted(true);
      }
    };
    checkExisting();
  }, [sessionId]);

  // Load messages when conversation exists
  useEffect(() => {
    if (!conversationId) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = async () => {
    if (!name.trim() || !phone.trim()) return;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ session_id: sessionId, customer_name: name.trim(), customer_phone: phone.trim() })
      .select()
      .single();
    if (data) {
      setConversationId(data.id);
      setStarted(true);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !conversationId || sending) return;
    setSending(true);
    const msg = newMessage.trim();
    setNewMessage("");
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      message: msg,
      sender_type: "customer",
    });
    // Mark as unread for admin
    await supabase.from("chat_conversations").update({ has_unread: true }).eq("id", conversationId);
    setSending(false);
  }, [newMessage, conversationId, sending]);

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
      {/* Chat bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="w-[340px] md:w-[380px] h-[480px] bg-card rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Natural Shefa</h3>
              <p className="text-xs opacity-80">আমরা আপনাকে সাহায্য করতে প্রস্তুত</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-70">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!started ? (
            /* Start form */
            <div className="flex-1 flex flex-col justify-center p-6 gap-4">
              <p className="text-sm text-muted-foreground text-center">চ্যাট শুরু করতে আপনার তথ্য দিন</p>
              <Input
                placeholder="আপনার নাম"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="ফোন নম্বর"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button onClick={startChat} disabled={!name.trim() || !phone.trim()}>
                চ্যাট শুরু করুন
              </Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-8">
                    আপনার মেসেজ পাঠান, আমরা শীঘ্রই উত্তর দেব
                  </p>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                        msg.sender_type === "customer"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-secondary-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t flex gap-2">
                <Input
                  placeholder="মেসেজ লিখুন..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
