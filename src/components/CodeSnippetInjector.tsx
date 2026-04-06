import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CodeSnippetInjector = () => {
  const { data: snippets } = useQuery({
    queryKey: ["active-code-snippets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("code_snippets")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!snippets?.length) return;

    const injectedElements: HTMLElement[] = [];

    snippets.forEach((s: any) => {
      const id = `snippet-${s.id}`;
      // Remove existing
      document.getElementById(id)?.remove();

      if (s.language === "javascript") {
        const script = document.createElement("script");
        script.id = id;
        script.textContent = s.code;
        if (s.placement === "head") {
          document.head.appendChild(script);
        } else {
          document.body.appendChild(script);
        }
        injectedElements.push(script);
      } else if (s.language === "css") {
        const style = document.createElement("style");
        style.id = id;
        style.textContent = s.code;
        document.head.appendChild(style);
        injectedElements.push(style);
      } else if (s.language === "html") {
        const container = document.createElement("div");
        container.id = id;
        container.innerHTML = s.code;
        if (s.placement === "head") {
          // For HTML in head, extract scripts and styles
          const scripts = container.querySelectorAll("script");
          scripts.forEach((sc) => {
            const newScript = document.createElement("script");
            if (sc.src) newScript.src = sc.src;
            else newScript.textContent = sc.textContent;
            newScript.id = id + "-script";
            document.head.appendChild(newScript);
            injectedElements.push(newScript);
          });
          const styles = container.querySelectorAll("style, link");
          styles.forEach((st) => {
            const clone = st.cloneNode(true) as HTMLElement;
            document.head.appendChild(clone);
            injectedElements.push(clone);
          });
        } else if (s.placement === "body_start") {
          document.body.insertBefore(container, document.body.firstChild);
          injectedElements.push(container);
        } else {
          document.body.appendChild(container);
          injectedElements.push(container);
        }
      }
    });

    return () => {
      injectedElements.forEach((el) => el.remove());
    };
  }, [snippets]);

  return null;
};

export default CodeSnippetInjector;
