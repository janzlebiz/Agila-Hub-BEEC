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
}

export interface RagResponse {
  query: string;
  answer: string;
  citations: RagCitation[];
  suggestedQueries: string[];
  confidence: "High" | "Medium" | "Verified";
}

const articles: MagnaArticle[] = magnaCartaData.articles as MagnaArticle[];
const qaPresets = magnaCartaData.qa_presets;
const BASE_SOURCE_URL = magnaCartaData.source_url;

/**
 * Normalizes text for keyword token matching
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "with", "this", "that", "from", "are", "what", "how"].includes(w));
}

/**
 * Semantic keyword search across Magna Carta Articles
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

      // Count occurrences in content (capped)
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
 * RAG Fraternal Counsel Engine
 * Formulates authoritative constitutional answers with exact citations
 */
export function askMagnaCartaCounsel(query: string): RagResponse {
  const cleanQuery = query.trim().toLowerCase();

  // 1. Direct match with verified QA presets
  for (const preset of qaPresets) {
    const presetTokens = tokenize(preset.query);
    const queryTokens = tokenize(cleanQuery);
    const overlap = queryTokens.filter((t) => presetTokens.includes(t)).length;

    if (overlap >= 2 || cleanQuery.includes(preset.query.toLowerCase().slice(0, 15))) {
      return {
        query,
        answer: preset.answer,
        citations: [
          {
            article_number: preset.article.split(" - ")[0] || "MAGNA CARTA",
            article_title: preset.article,
            page_range: preset.page,
            excerpt: preset.citation,
            source_url: BASE_SOURCE_URL,
          },
        ],
        suggestedQueries: [
          "What are the qualifications and rights of an Eagle Member?",
          "What is the quorum requirement for chapter and assembly meetings?",
          "How are national dues and club contributions allocated and audited?",
          "What are the grounds and procedures for member suspension or expulsion?",
        ].filter((q) => q.toLowerCase() !== preset.query.toLowerCase()),
        confidence: "Verified",
      };
    }
  }

  // 2. Dynamic Retrieval-Augmented Generation across articles
  const searchResults = searchMagnaCarta(query);

  if (searchResults.length === 0) {
    return {
      query,
      answer:
        "The query could not be directly matched to a specific constitutional article in the 2024 Magna Carta database. Please try searching for terms like 'dues', 'quorum', 'membership', 'PEIL', 'elections', or 'discipline', or consult the full e-Constitution portal.",
      citations: [
        {
          article_number: "MAGNA CARTA 2024",
          article_title: "The Philippine Eagles Constitution of 2024",
          page_range: "Pages 1–326",
          excerpt: "Official e-Constitution portal available at e-constitution.tfoe-peinc.com",
          source_url: BASE_SOURCE_URL,
        },
      ],
      suggestedQueries: [
        "What are the qualifications and rights of an Eagle Member?",
        "What is the quorum requirement for chapter and assembly meetings?",
        "How are national dues and club contributions allocated and audited?",
      ],
      confidence: "Medium",
    };
  }

  const topMatch = searchResults[0].article;
  const secondaryMatch = searchResults[1]?.article;

  // Extract relevant paragraph from topMatch content
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

  // Clean excerpt
  const cleanExcerpt = bestParagraph
    .replace(/--- Page \d+ ---/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);

  const answer = `Pursuant to **${topMatch.number} (${topMatch.title})**, ${topMatch.summary} The official provisions dictate specific constitutional compliance for all Eagle leaders, chapters, and assemblies across the National Directorate.`;

  const citations: RagCitation[] = [
    {
      article_number: topMatch.number,
      article_title: topMatch.title,
      page_range: topMatch.page_range,
      excerpt: cleanExcerpt + "...",
      source_url: BASE_SOURCE_URL,
    },
  ];

  if (secondaryMatch) {
    citations.push({
      article_number: secondaryMatch.number,
      article_title: secondaryMatch.title,
      page_range: secondaryMatch.page_range,
      excerpt: secondaryMatch.summary.slice(0, 240) + "...",
      source_url: BASE_SOURCE_URL,
    });
  }

  return {
    query,
    answer,
    citations,
    suggestedQueries: [
      "What are the rights and obligations of an Eagle member?",
      "How are dues remitted and audited in the chapter?",
      "What are the rules governing the national assembly and elections?",
    ],
    confidence: "High",
  };
}

export { articles, BASE_SOURCE_URL };
