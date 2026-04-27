// Public Meta (Facebook) Catalog Product Feed
// Supports CSV (default) and XML (Google Shopping / RSS 2.0) formats
// Usage:
//   GET /meta-catalog-feed            -> CSV
//   GET /meta-catalog-feed?format=csv -> CSV
//   GET /meta-catalog-feed?format=xml -> XML

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Escape CSV field per RFC 4180
function csvField(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Escape XML special chars
function xmlEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Strip HTML tags from description
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getOrigin(req: Request): string {
  // Try to derive site origin for product link. Fallback to request origin.
  const url = new URL(req.url);
  const siteOrigin = Deno.env.get("PUBLIC_SITE_URL");
  if (siteOrigin) return siteOrigin.replace(/\/$/, "");
  return `${url.protocol}//${url.host}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Fetch site origin from settings if available
    let siteOrigin = getOrigin(req);
    try {
      const { data: siteUrlSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site_url")
        .maybeSingle();
      const u = (siteUrlSetting?.value as any)?.url;
      if (u && typeof u === "string") siteOrigin = u.replace(/\/$/, "");
    } catch (_) { /* ignore */ }

    // Fetch all active products (paginate to bypass 1000 row limit)
    const all: any[] = [];
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, description, short_description, price, original_price, images, stock, sku, badge")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    if (format === "xml") {
      const items = all.map((p) => {
        const image = (p.images && p.images[0]) || `${siteOrigin}/placeholder.svg`;
        const link = `${siteOrigin}/product/${p.slug}`;
        const desc = stripHtml(p.description) || stripHtml(p.short_description) || p.name;
        const availability = (p.stock ?? 0) > 0 ? "in stock" : "out of stock";
        const price = `${Number(p.price).toFixed(2)} BDT`;
        const salePrice = p.original_price && Number(p.original_price) > Number(p.price)
          ? `${Number(p.price).toFixed(2)} BDT`
          : "";
        const fullPrice = p.original_price && Number(p.original_price) > Number(p.price)
          ? `${Number(p.original_price).toFixed(2)} BDT`
          : price;
        return `    <item>
      <g:id>${xmlEscape(p.id)}</g:id>
      <g:title>${xmlEscape(p.name)}</g:title>
      <g:description>${xmlEscape(desc.slice(0, 9999))}</g:description>
      <g:link>${xmlEscape(link)}</g:link>
      <g:image_link>${xmlEscape(image)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${xmlEscape(fullPrice)}</g:price>${salePrice ? `\n      <g:sale_price>${xmlEscape(salePrice)}</g:sale_price>` : ""}
      <g:condition>new</g:condition>
      <g:brand>Natural Shefa</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      }).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Natural Shefa Product Feed</title>
    <link>${xmlEscape(siteOrigin)}</link>
    <description>Product catalog for Meta Commerce</description>
${items}
  </channel>
</rss>`;

      return new Response(xml, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=1800",
        },
      });
    }

    // CSV (default) — Meta Commerce required + recommended fields
    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "sale_price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "quantity_to_sell_on_facebook",
    ];

    const rows = all.map((p) => {
      const image = (p.images && p.images[0]) || `${siteOrigin}/placeholder.svg`;
      const link = `${siteOrigin}/product/${p.slug}`;
      const desc = stripHtml(p.description) || stripHtml(p.short_description) || p.name;
      const availability = (p.stock ?? 0) > 0 ? "in stock" : "out of stock";
      const hasSale = p.original_price && Number(p.original_price) > Number(p.price);
      const price = hasSale
        ? `${Number(p.original_price).toFixed(2)} BDT`
        : `${Number(p.price).toFixed(2)} BDT`;
      const salePrice = hasSale ? `${Number(p.price).toFixed(2)} BDT` : "";

      return [
        p.id,
        p.name,
        desc.slice(0, 9999),
        availability,
        "new",
        price,
        salePrice,
        link,
        image,
        "Natural Shefa",
        "Food, Beverages & Tobacco",
        Math.max(0, p.stock ?? 0),
      ].map(csvField).join(",");
    });

    // Prepend UTF-8 BOM so Excel correctly detects encoding and renders Bangla text
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=1800",
        "Content-Disposition": 'inline; filename="meta-catalog.csv"',
      },
    });
  } catch (e) {
    console.error("meta-catalog-feed error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
