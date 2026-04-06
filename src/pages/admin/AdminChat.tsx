import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  is_active: boolean;
  has_unread: boolean;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

const AdminChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (data) setConversations(data);
    };
    load();

    // Realtime for new conversations & updates
    const channel = supabase
      .channel("admin-chat-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedId) return;
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);

      // Mark as read
      await supabase.from("chat_conversations").update({ has_unread: false }).eq("id", selectedId);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, has_unread: false } : c))
      );
    };
    load();

    const channel = supabase
      .channel(`admin-chat-msgs-${selectedId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${selectedId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedId || sending) return;
    setSending(true);
    const msg = newMessage.trim();
    setNewMessage("");
    await supabase.from("chat_messages").insert({
      conversation_id: selectedId,
      message: msg,
      sender_type: "admin",
    });
    setSending(false);
  }, [newMessage, selectedId, sending]);

  const selected = conversations.find((c) => c.id === selectedId);
  const unreadCount = conversations.filter((c) => c.has_unread).length;

  return (
    <div className="h-[calc(100vh-6rem)] flex rounded-xl border bg-card overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            চ্যাট
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
            )}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">কোনো চ্যাট নেই</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "w-full text-left p-3 border-b hover:bg-secondary/50 transition-colors",
                  selectedId === conv.id && "bg-secondary",
                  conv.has_unread && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{conv.customer_name}</span>
                  {conv.has_unread && (
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {conv.customer_phone}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(conv.created_at), "dd MMM, hh:mm a")}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">একটি চ্যাট সিলেক্ট করুন</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{selected?.customer_name}</h3>
                <a href={`tel:${selected?.customer_phone}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {selected?.customer_phone}
                </a>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                      msg.sender_type === "admin"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-secondary-foreground rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_type === "admin" ? "opacity-70" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "hh:mm a")}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                placeholder="উত্তর লিখুন..."
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
    </div>
  );
};

export default AdminChat;
