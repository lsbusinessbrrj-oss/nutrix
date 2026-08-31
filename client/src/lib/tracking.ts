// Rastreamento de tráfego pago — Meta Pixel (Facebook/Instagram) + Google
// Analytics (GA4) + Google Ads. Só carrega se os IDs estiverem definidos nas
// variáveis de ambiente (VITE_*). Eventos: PageView, Lead (cadastro),
// InitiateCheckout (pagamento), Purchase (compra/assinatura).
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;                 // G-XXXXXXXX
const ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;        // AW-XXXXXXXXX
const ADS_PURCHASE_LABEL = import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL as string | undefined;
const PRECO = Number(import.meta.env.VITE_PRECO_DIETA ?? "9.99");

declare global {
  interface Window { fbq?: any; _fbq?: any; gtag?: (...args: any[]) => void; dataLayer?: any[]; }
}

let inited = false;

/** Carrega os scripts do Meta Pixel e do Google (uma única vez). */
export function initTracking() {
  if (inited || typeof window === "undefined") return;
  inited = true;

  // ── Meta Pixel ──
  if (META_PIXEL_ID) {
    /* eslint-disable */
    (function (f: any, b: any, e: string, v: string) {
      if (f.fbq) return;
      const n: any = (f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      const t = b.createElement(e); t.async = true; t.src = v;
      const s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq!("init", META_PIXEL_ID);
    window.fbq!("track", "PageView");
  }

  // ── Google (GA4 + Ads) via gtag ──
  if (GA_ID || ADS_ID) {
    const id = GA_ID || ADS_ID!;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer!.push(arguments); };
    window.gtag("js", new Date());
    if (GA_ID) window.gtag("config", GA_ID);
    if (ADS_ID) window.gtag("config", ADS_ID);
  }
}

/** Visualização de página (dispara a cada navegação). */
export function trackPageView(path?: string) {
  if (typeof window === "undefined") return;
  const p = path ?? window.location.pathname;
  if (window.fbq) window.fbq("track", "PageView");
  if (window.gtag && GA_ID) window.gtag("event", "page_view", { page_path: p, page_location: window.location.href });
}

/** Cadastro concluído (lead). */
export function trackLead() {
  if (window.fbq) window.fbq("track", "CompleteRegistration");
  if (window.gtag) window.gtag("event", "sign_up");
}

/** Visualização do produto (viu a oferta/quiz). Ajuda o connect rate/funil. */
export function trackViewContent() {
  if (window.fbq) window.fbq("track", "ViewContent", { content_name: "Plano NutriX", value: PRECO, currency: "BRL" });
  if (window.gtag) window.gtag("event", "view_item", { value: PRECO, currency: "BRL" });
}

/** Adição ao carrinho (montou a dieta / seguiu para pagar). */
export function trackAddToCart(value = PRECO) {
  if (window.fbq) window.fbq("track", "AddToCart", { content_name: "Plano NutriX", value, currency: "BRL" });
  if (window.gtag) window.gtag("event", "add_to_cart", { value, currency: "BRL" });
}

/** Início do checkout (chegou na tela de pagamento). */
export function trackInitiateCheckout(value = PRECO) {
  if (window.fbq) window.fbq("track", "InitiateCheckout", { value, currency: "BRL" });
  if (window.gtag) window.gtag("event", "begin_checkout", { value, currency: "BRL" });
}

/** Compra / assinatura concluída (conversão). */
export function trackPurchase(value = PRECO) {
  if (window.fbq) window.fbq("track", "Purchase", { value, currency: "BRL" });
  if (window.gtag) {
    window.gtag("event", "purchase", { value, currency: "BRL" });
    if (ADS_ID && ADS_PURCHASE_LABEL) {
      window.gtag("event", "conversion", { send_to: `${ADS_ID}/${ADS_PURCHASE_LABEL}`, value, currency: "BRL" });
    }
  }
}
