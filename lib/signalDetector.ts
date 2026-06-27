// ── Signal Detector ───────────────────────────────────────────────────────────
// SNSコメントを解析し、購買意図・パートナー問い合わせを検出する

export type SignalType = "buying_intent" | "partnership_inquiry" | "general";

export interface DetectionResult {
  signalType: SignalType;
  score: number;          // 0–100
  keywordsMatched: string[];
  shouldCapture: boolean; // score >= 40
}

const BUYING_KEYWORDS = [
  // English
  "where can i buy", "where to buy", "how to buy", "how do i get",
  "where can i get", "how much", "how much does", "price", "cost",
  "available", "purchase", "order", "want one", "want this", "need one",
  "need this", "where to get", "can i buy", "buy this", "get one",
  "ship to", "shipping", "sell this", "for sale", "in stock",
  // Japanese
  "どこで買", "いくら", "購入", "欲しい", "注文", "販売", "売ってる",
  "手に入れ", "買いたい", "価格", "値段", "在庫", "取り扱い",
  "どこで購入", "買えます", "購入方法", "入手", "買えますか", "売ってます",
];

const PARTNER_KEYWORDS = [
  // English
  "distribute", "distributor", "wholesale", "wholesaler", "resell",
  "reseller", "carry your product", "carry this", "stock this",
  "partner", "partnership", "collaboration", "collab", "business",
  "interested in selling", "sell in", "represent", "exclusive",
  "import", "importer", "retail", "retailer", "store",
  "contact us", "business inquiry", "reach out",
  // Japanese
  "代理店", "卸", "販売代理", "パートナー", "輸入", "取り扱い希望",
  "ビジネス", "商談", "提携", "販売店",
];

const NOISE_KEYWORDS = [
  "spam", "fake", "scam", "bot", "follow back", "sub4sub",
];

export function detectSignal(text: string): DetectionResult {
  const lower = text.toLowerCase();

  // ノイズフィルター
  if (NOISE_KEYWORDS.some(k => lower.includes(k))) {
    return { signalType: "general", score: 0, keywordsMatched: [], shouldCapture: false };
  }

  const buyingMatched   = BUYING_KEYWORDS.filter(k => lower.includes(k.toLowerCase()));
  const partnerMatched  = PARTNER_KEYWORDS.filter(k => lower.includes(k.toLowerCase()));

  const allMatched      = [...new Set([...buyingMatched, ...partnerMatched])];

  // スコア計算
  const buyingScore   = Math.min(buyingMatched.length * 25, 80);
  const partnerScore  = Math.min(partnerMatched.length * 30, 90);

  // 疑問符ボーナス（問い合わせの可能性UP）
  const questionBonus = (text.includes("?") || text.includes("？")) ? 10 : 0;

  let signalType: SignalType = "general";
  let score = 0;

  if (partnerScore >= buyingScore && partnerScore > 0) {
    signalType = "partnership_inquiry";
    score = Math.min(partnerScore + questionBonus, 100);
  } else if (buyingScore > 0) {
    signalType = "buying_intent";
    score = Math.min(buyingScore + questionBonus, 100);
  } else if (questionBonus > 0 && text.length > 20) {
    // 短い質問文でもキャプチャ候補に
    signalType = "general";
    score = 20;
  }

  return {
    signalType,
    score,
    keywordsMatched: allMatched,
    shouldCapture: score >= 40,
  };
}
