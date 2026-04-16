import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Code2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Snippet {
  id: string;
  name: string;
  description: string | null;
  code: string;
  language: string;
  placement: string;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

const AdminCodeSnippets = () => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSnippet, setNewSnippet] = useState({
    name: "",
    description: "",
    code: "",
    language: "javascript",
    placement: "body_end",
  });

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ["code-snippets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("code_snippets")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Snippet[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (snippet: typeof newSnippet) => {
      const { error } = await supabase.from("code_snippets").insert(snippet);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-snippets"] });
      toast.success("স্নিপেট তৈরি হয়েছে");
      setShowAdd(false);
      setNewSnippet({ name: "", description: "", code: "", language: "javascript", placement: "body_end" });
    },
    onError: () => toast.error("স্নিপেট তৈরি ব্যর্থ"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("code_snippets").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-snippets"] });
      toast.success("আপডেট হয়েছে");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("code_snippets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-snippets"] });
      toast.success("স্নিপেট ডিলিট হয়েছে");
    },
  });

  const languageLabels: Record<string, string> = {
    javascript: "JavaScript",
    html: "HTML",
    css: "CSS",
  };

  const placementLabels: Record<string, string> = {
    head: "Head (হেডে)",
    body_start: "Body Start (শুরুতে)",
    body_end: "Body End (শেষে)",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">কোড স্নিপেট</h1>
          <p className="text-sm text-muted-foreground">কাস্টম HTML, CSS, JavaScript কোড যোগ করুন — যেমন CRM ইন্টিগ্রেশন, ট্র্যাকিং কোড ইত্যাদি</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> নতুন স্নিপেট
        </Button>
      </div>

      {/* Add New */}
      {showAdd && (
        <div className="bg-card border rounded-xl p-5 mb-6 space-y-4">
          <h3 className="font-bold text-foreground">নতুন স্নিপেট তৈরি করুন</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>নাম *</Label>
              <Input placeholder="যেমন: CRM Order Tracking" value={newSnippet.name}
                onChange={(e) => setNewSnippet({ ...newSnippet, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>বর্ণনা</Label>
              <Input placeholder="কী কাজ করে..." value={newSnippet.description}
                onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>ভাষা</Label>
              <Select value={newSnippet.language} onValueChange={(v) => setNewSnippet({ ...newSnippet, language: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>পজিশন</Label>
              <Select value={newSnippet.placement} onValueChange={(v) => setNewSnippet({ ...newSnippet, placement: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="head">Head (হেডে)</SelectItem>
                  <SelectItem value="body_start">Body Start (শুরুতে)</SelectItem>
                  <SelectItem value="body_end">Body End (শেষে)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>কোড *</Label>
            <textarea
              className="w-full mt-1 min-h-[200px] bg-muted border rounded-lg p-3 font-mono text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={`// আপনার ${newSnippet.language} কোড এখানে লিখুন...\n// উদাহরণ: fetch() দিয়ে CRM API-তে ডাটা পাঠান`}
              value={newSnippet.code}
              onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate(newSnippet)} disabled={!newSnippet.name || !newSnippet.code}>
              তৈরি করুন
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>বাতিল</Button>
          </div>
        </div>
      )}

      {/* Snippet List */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>
      ) : snippets.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-xl">
          <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">এখনো কোনো স্নিপেট নেই</p>
          <p className="text-sm text-muted-foreground mt-1">উপরের "নতুন স্নিপেট" বাটনে ক্লিক করুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {snippets.map((s) => (
            <div key={s.id} className="bg-card border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30"
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Switch
                    checked={s.is_active}
                    onCheckedChange={(v) => { updateMutation.mutate({ id: s.id, is_active: v }); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{s.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {languageLabels[s.language] || s.language}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {placementLabels[s.placement] || s.placement}
                      </span>
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground truncate">{s.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={(e) => { e.stopPropagation(); if (confirm("ডিলিট করতে চান?")) deleteMutation.mutate(s.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {expandedId === s.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === s.id && (
                <SnippetEditor snippet={s} onSave={(data) => updateMutation.mutate({ id: s.id, ...data })} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SnippetEditor = ({ snippet, onSave }: { snippet: Snippet; onSave: (data: any) => void }) => {
  const [code, setCode] = useState(snippet.code);
  const [name, setName] = useState(snippet.name);
  const [language, setLanguage] = useState(snippet.language);
  const [placement, setPlacement] = useState(snippet.placement);

  return (
    <div className="border-t p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>নাম</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>ভাষা</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>পজিশন</Label>
          <Select value={placement} onValueChange={setPlacement}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="head">Head</SelectItem>
              <SelectItem value="body_start">Body Start</SelectItem>
              <SelectItem value="body_end">Body End</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>কোড</Label>
          <Button variant="ghost" size="sm" className="h-7 text-xs"
            onClick={() => { navigator.clipboard.writeText(code); toast.success("কপি হয়েছে"); }}>
            <Copy className="h-3 w-3 mr-1" /> কপি
          </Button>
        </div>
        <textarea
          className="w-full min-h-[250px] bg-muted border rounded-lg p-3 font-mono text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <Button onClick={() => onSave({ name, code, language, placement })}>
        সেভ করুন
      </Button>
    </div>
  );
};

export default AdminCodeSnippets;
