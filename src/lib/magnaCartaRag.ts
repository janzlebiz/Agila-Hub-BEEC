import magnaCartaData from "./magnaCartaData.json";

export interface MagnaArticle {
  id: string;
  number: string;
  title: string;
  pages: number[];
  page_range: string;
  summary: string;
  keywords: string[];
  content: string;
}

export interface RagCitation {
  article_number: string;
  article_title: string;
  page_range: string;
  excerpt: string;
  source_url: string;
  document_id: string;
  document_version: string;
}

export interface RagResponse {
  query: string;
  answer: string;
  directQuotation?: string;
  citations: RagCitation[];
  suggestedQueries: string[];
  confidence: "High" | "Medium" | "Verified" | "Insufficient Evidence";
  isWeakMatch?: boolean;
  isAbstained?: boolean;
  abstainReason?: string;
  disclaimer: string;
}

const articles: MagnaArticle[] = magnaCartaData.articles as MagnaArticle[];
const qaPresets = magnaCartaData.qa_presets;
const BASE_SOURCE_URL = magnaCartaData.source_url;

const LEGAL_DISCLAIMER =
  "Constitutional Search Assistance Notice: This search tool retrieves relevant excerpts and page citations from the 2024 Philippine Eagles Magna Carta (e-constitution.tfoe-peinc.com) for study and informational guidance. It does not constitute formal legal advice, judicial counsel, or binding administrative rulings by the National Directorate.";

/**
 * Normalizes text for keyword token matching
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !["the", "and", "for", "with", "this", "that", "from", "are", "what", "how", "can", "our"].includes(w)
    );
}

/**
 * Search across Magna Carta Articles with relevance scoring
 */
export function searchMagnaCarta(query: string): { article: MagnaArticle; score: number }[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const results: { article: MagnaArticle; score: number }[] = [];

  for (const art of articles) {
    let score = 0;
    const titleLower = art.title.toLowerCase();
    const numLower = art.number.toLowerCase();
    const keywordsLower = art.keywords.map((k) => k.toLowerCase()).join(" ");
    const contentLower = art.content.toLowerCase();

    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 15;
      if (numLower.includes(token)) score += 20;
      if (keywordsLower.includes(token)) score += 10;

      // Count occurrences in content (capped at 10)
      const count = (contentLower.match(new RegExp(token, "g")) || []).length;
      score += Math.min(count, 10) * 1.5;
    }

    if (score > 0) {
      results.push({ article: art, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Constitutional Search & Reference Assistant
 * Formulates search guidance with exact article and page citations
 */
export function askMagnaCartaCounsel(query: string): RagResponse {
  const cleanQuery = query.trim().toLowerCase();

  // 1. Security Safeguard: Prompt Injection & Adversarial Jailbreak Defense
  const injectionPatterns = [
    "ignore previous instructions",
    "disregard previous",
    "system prompt",
    "jailbreak",
    "act as a",
    "pretend you are",
    "simulate",
    "you are now evil",
    "override rules",
    "dan mode",
  ];
  if (injectionPatterns.some((pattern) => cleanQuery.includes(pattern))) {
    return {
      query,
      answer:
        "Adversarial prompt instruction detected and rejected. The Constitutional AI Counsel operates strictly within the boundaries of the ratified 2024 Philippine Eagles Magna Carta and cannot be reprogrammed or overridden by user prompts.",
      citations: [],
      suggestedQueries: [
        "What are the qualifications and rights of an Eagle Member?",
        "What is the quorum requirement for chapter and assembly meetings?",
        "How are national dues and club contributions allocated and audited?",
      ],
      confidence: "Insufficient Evidence",
      isAbstained: true,
      abstainReason: "Adversarial prompt injection attempt detected.",
      disclaimer: LEGAL_DISCLAIMER,
    };
  }

  // 2. Direct match with verified QA presets
  for (const preset of qaPresets) {
    const presetTokens = tokenize(preset.query);
    const queryTokens = tokenize(cleanQuery);
    const overlap = queryTokens.filter((t) => presetTokens.includes(t)).length;

    if (overlap >= 2 || cleanQuery.includes(preset.query.toLowerCase().slice(0, 15))) {
      return {
        query,
        answer: preset.answer,
        directQuotation: preset.citation,
        citations: [
          {
            article_number: preset.article.split(" - ")[0] || "MAGNA CARTA",
            article_title: preset.article,
            page_range: preset.page,
            excerpt: preset.citation,
            source_url: BASE_SOURCE_URL,
            document_id: "doc-tfoe-constitution-2024",
            document_version: "2024 Ratified Edition",
          },
        ],
        suggestedQueries: [
          "What are the qualifications and rights of an Eagle Member?",
          "What is the quorum requirement for chapter and assembly meetings?",
          "How are national dues and club contributions allocated and audited?",
          "What are the grounds and procedures for member suspension or expulsion?",
        ].filter((q) => q.toLowerCase() !== preset.query.toLowerCase()),
        confidence: "Verified",
        isAbstained: false,
        disclaimer: LEGAL_DISCLAIMER,
      };
    }
  }

  // 3. Dynamic Retrieval across 21 articles
  const searchResults = searchMagnaCarta(query);

  // If no match or weak match (< 25 relevance score), return explicit abstention with insufficient evidence
  if (searchResults.length === 0 || searchResults[0].score < 25) {
    return {
      query,
      answer:
        "Insufficient direct match found in the ratified 2024 Magna Carta database for this query. The submitted terms could not be conclusively paired with ratified constitutional provisions. To preserve legal accuracy, the system abstains from inventing article numbers or unratified interpretations.",
      citations: [
        {
          article_number: "MAGNA CARTA 2024",
          article_title: "The Philippine Eagles Constitution of 2024",
          page_range: "Pages 1–326",
          excerpt:
            "Official verbatim e-Constitution publication available at e-constitution.tfoe-peinc.com. Consult your Chapter Secretariat or National Legal Directorate for formal rulings.",
          source_url: BASE_SOURCE_URL,
          document_id: "doc-tfoe-constitution-2024",
          document_version: "2024 Ratified Edition",
        },
      ],
      suggestedQueries: [
        "What are the qualifications and rights of an Eagle Member?",
        "What is the quorum requirement for chapter and assembly meetings?",
        "How are national dues and club contributions allocated and audited?",
        "What are the rules governing election of chapter officers?",
      ],
      confidence: "Insufficient Evidence",
      isWeakMatch: true,
      isAbstained: true,
      abstainReason: "Query terms did not meet relevance threshold in the approved 2024 constitutional corpus.",
      disclaimer: LEGAL_DISCLAIMER,
    };
  }

  const topMatch = searchResults[0].article;
  const secondaryMatch = searchResults[1]?.article;

  // Extract verbatim relevant excerpt from topMatch content
  const paragraphs = topMatch.content.split("\n\n").filter((p) => p.trim().length > 30);
  const queryTokens = tokenize(query);

  let bestParagraph = paragraphs[0] || topMatch.summary;
  let highestPScore = -1;

  for (const para of paragraphs) {
    let pScore = 0;
    const pLower = para.toLowerCase();
    for (const token of queryTokens) {
      if (pLower.includes(token)) pScore += 1;
    }
    if (pScore > highestPScore) {
      highestPScore = pScore;
      bestParagraph = para;
    }
  }

  // Clean verbatim excerpt
  const cleanExcerpt = bestParagraph
    .replace(/--- Page \d+ ---/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);

  const answer = `Based on constitutional indexing for **${topMatch.number} (${topMatch.title})**: ${topMatch.summary} The official provisions below are retrieved directly from the ratified 2024 Philippine Eagles Constitution.`;

  const citations: RagCitation[] = [
    {
      article_number: topMatch.number,
      article_title: topMatch.title,
      page_range: topMatch.page_range,
      excerpt: cleanExcerpt + "...",
      source_url: BASE_SOURCE_URL,
      document_id: "doc-tfoe-constitution-2024",
      document_version: "2024 Ratified Edition",
    },
  ];

  if (secondaryMatch && searchResults[1].score >= 10) {
    citations.push({
      article_number: secondaryMatch.number,
      article_title: secondaryMatch.title,
      page_range: secondaryMatch.page_range,
      excerpt: secondaryMatch.summary.slice(0, 240) + "...",
      source_url: BASE_SOURCE_URL,
      document_id: "doc-tfoe-constitution-2024",
      document_version: "2024 Ratified Edition",
    });
  }

  return {
    query,
    answer,
    directQuotation: cleanExcerpt,
    citations,
    suggestedQueries: [
      "What are the rights and obligations of an Eagle member?",
      "How are dues remitted and audited in the chapter?",
      "What are the rules governing the national assembly and elections?",
    ],
    confidence: "High",
    isWeakMatch: false,
    isAbstained: false,
    disclaimer: LEGAL_DISCLAIMER,
  };
}

export { articles, BASE_SOURCE_URL, LEGAL_DISCLAIMER };
