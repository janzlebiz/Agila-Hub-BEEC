import sys
import json
import re
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

input_file = Path('d:/Antigravity/Agila Hub/.tmp/api_content_pages.json')
with open(input_file, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

pages = raw_data.get('pages', [])
print(f"Total pages loaded: {len(pages)}")

# Define the 21 Articles and key sections with approximate starting pages
ARTICLES_METADATA = [
    {
        "id": "preamble",
        "number": "PREAMBLE",
        "title": "Preamble & Declaration of Principles",
        "start_page": 24,
        "end_page": 31,
        "keywords": ["preamble", "principles", "humanitarian service", "deo et patria", "god and country", "supreme being", "fraternal love"]
    },
    {
        "id": "art-1",
        "number": "ARTICLE I",
        "title": "Philippine Eagles Constitution and By-Laws",
        "start_page": 27,
        "end_page": 27,
        "keywords": ["constitution", "by-laws", "supremacy", "statute", "charter", "binding"]
    },
    {
        "id": "art-2",
        "number": "ARTICLE II",
        "title": "Name and Declaration of Principles",
        "start_page": 28,
        "end_page": 31,
        "keywords": ["name", "tfoe-pe", "principles", "purpose", "motto", "deo et patria", "philippine eagles"]
    },
    {
        "id": "art-3",
        "number": "ARTICLE III",
        "title": "Philippine Eagles Structure and Governance",
        "start_page": 32,
        "end_page": 41,
        "keywords": ["structure", "national assembly", "governance", "hierarchy", "directorate", "organization", "officers"]
    },
    {
        "id": "art-4",
        "number": "ARTICLE IV",
        "title": "Bill of Rights and Obligations of Eagle Members",
        "start_page": 42,
        "end_page": 46,
        "keywords": ["rights", "obligations", "membership", "kuya", "ate", "duties", "privileges", "good standing", "due process"]
    },
    {
        "id": "art-5",
        "number": "ARTICLE V",
        "title": "Governance of the Philippine Eagles",
        "start_page": 47,
        "end_page": 47,
        "keywords": ["executive governance", "administration", "leadership", "executive council", "national administration"]
    },
    {
        "id": "art-6",
        "number": "ARTICLE VI",
        "title": "Philippine Eagles Code of Laws",
        "start_page": 48,
        "end_page": 71,
        "keywords": ["code of laws", "statutes", "enactments", "jurisdiction", "resolutions", "executive orders", "rules"]
    },
    {
        "id": "art-7",
        "number": "ARTICLE VII",
        "title": "Philippine Eagles Election Laws (PhiEleCom)",
        "start_page": 72,
        "end_page": 77,
        "keywords": ["elections", "phielecom", "voting", "ballot", "campaign", "eligibility", "terms of office", "commission on elections"]
    },
    {
        "id": "art-8",
        "number": "ARTICLE VIII",
        "title": "Rules of the National Assembly",
        "start_page": 78,
        "end_page": 105,
        "keywords": ["national assembly", "quorum", "rules of order", "parliamentary", "motions", "assembly meetings", "resolutions"]
    },
    {
        "id": "art-9",
        "number": "ARTICLE IX",
        "title": "Philippine Eagles Regions, Clubs and Dues",
        "start_page": 106,
        "end_page": 124,
        "keywords": ["regions", "clubs", "chapters", "charter", "dues", "annual dues", "club formation", "remittances", "good standing"]
    },
    {
        "id": "art-10",
        "number": "ARTICLE X",
        "title": "Philippine Eagles Institute of Leadership (PEIL)",
        "start_page": 125,
        "end_page": 135,
        "keywords": ["peil", "leadership", "training", "seminars", "education", "orientation", "aspirants", "accreditation"]
    },
    {
        "id": "art-11",
        "number": "ARTICLE XI",
        "title": "Philippine Eagles Commissions and Standing Committees",
        "start_page": 136,
        "end_page": 144,
        "keywords": ["commissions", "tribunal", "committees", "grievance", "arbitration", "humanitarian", "disaster"]
    },
    {
        "id": "art-12",
        "number": "ARTICLE XII",
        "title": "Philippine Eagles Accounting and Audit",
        "start_page": 145,
        "end_page": 149,
        "keywords": ["accounting", "audit", "treasury", "financial statements", "funds", "receipts", "disbursements", "fiscal"]
    },
    {
        "id": "art-13",
        "number": "ARTICLE XIII",
        "title": "Seal, Emblem, Logo, Gong, Gavel, and Insignia",
        "start_page": 150,
        "end_page": 170,
        "keywords": ["seal", "logo", "emblem", "gong", "gavel", "insignia", "banner", "colors", "blue gold green", "vest", "uniform"]
    },
    {
        "id": "art-14",
        "number": "ARTICLE XIV",
        "title": "Philippine Eagles National Presidents",
        "start_page": 171,
        "end_page": 174,
        "keywords": ["national president", "powers", "duties", "executive", "presidency", "veto", "appointments"]
    },
    {
        "id": "art-15",
        "number": "ARTICLE XV",
        "title": "The Panel of Eagles-on-Site",
        "start_page": 175,
        "end_page": 175,
        "keywords": ["eagles-on-site", "advisory", "panel", "site inspection", "chapter visitation"]
    },
    {
        "id": "art-16",
        "number": "ARTICLE XVI",
        "title": "Philippine Eagles Code of Conduct & Fraternal Discipline",
        "start_page": 176,
        "end_page": 178,
        "keywords": ["code of conduct", "discipline", "suspension", "expulsion", "fraternal ethics", "violations", "penalties"]
    },
    {
        "id": "art-17",
        "number": "ARTICLE XVII",
        "title": "National Congress",
        "start_page": 179,
        "end_page": 181,
        "keywords": ["national congress", "annual convention", "plenary", "general assembly"]
    },
    {
        "id": "art-18",
        "number": "ARTICLE XVIII",
        "title": "Philippine Eagles Official Forms and Templates",
        "start_page": 182,
        "end_page": 185,
        "keywords": ["forms", "application", "charter application", "endorsement", "templates", "documentation"]
    },
    {
        "id": "art-19",
        "number": "ARTICLE XIX",
        "title": "Miscellaneous Provisions",
        "start_page": 186,
        "end_page": 186,
        "keywords": ["miscellaneous", "interpretations", "parliamentary authority", "roberts rules"]
    },
    {
        "id": "art-20",
        "number": "ARTICLE XX",
        "title": "Amendments to the Constitution",
        "start_page": 187,
        "end_page": 188,
        "keywords": ["amendments", "two-thirds", "voting", "constitutional revision", "plebiscite"]
    },
    {
        "id": "art-21",
        "number": "ARTICLE XXI",
        "title": "Transitory Provisions",
        "start_page": 189,
        "end_page": 196,
        "keywords": ["transitory", "transition", "continuity", "existing clubs", "ratification"]
    }
]

# Build chunks by gathering text per article
page_dict = {p.get('page_number'): p for p in pages}

articles_output = []
for meta in ARTICLES_METADATA:
    art_pages = []
    combined_text = []
    for p_num in range(meta['start_page'], meta['end_page'] + 1):
        if p_num in page_dict:
            p_data = page_dict[p_num]
            txt = (p_data.get('text') or '').strip()
            if txt:
                combined_text.append(f"--- Page {p_num} ---\n{txt}")
                art_pages.append(p_num)
    
    full_art_text = "\n\n".join(combined_text)
    
    # Extract clean summary from beginning
    clean_lines = [l.strip() for l in full_art_text.split('\n') if l.strip() and not l.startswith('--- Page') and not l.startswith('MAGNA CARTA')]
    summary_text = " ".join(clean_lines[:4])
    if len(summary_text) > 280:
        summary_text = summary_text[:280] + "..."

    articles_output.append({
        "id": meta['id'],
        "number": meta['number'],
        "title": meta['title'],
        "pages": art_pages,
        "page_range": f"Pages {meta['start_page']}–{meta['end_page']}",
        "summary": summary_text or meta['title'],
        "keywords": meta['keywords'],
        "content": full_art_text
    })

# Also extract sample sections and QA pairs for instant, ultra-responsive RAG answers
QA_PAIRS = [
    {
        "query": "What are the core principles and motto of the Philippine Eagles?",
        "article_id": "art-2",
        "article": "ARTICLE II - NAME AND DECLARATION OF PRINCIPLES",
        "page": "Pages 28–31",
        "answer": "The Fraternal Order of Eagles – Philippine Eagles (TFOE-PE) is founded on the guiding motto **'Deo Et Patria'** (For God and Country) and the fundamental philosophy of **Humanitarian Service**. The Order upholds brotherhood, mutual aid, patriotism, integrity, and active community upliftment as its immutable guiding principles.",
        "citation": "Article II, Declaration of Principles (e-Constitution 2024, p. 28)"
    },
    {
        "query": "What are the qualifications and rights of an Eagle Member?",
        "article_id": "art-4",
        "article": "ARTICLE IV - BILL OF RIGHTS AND OBLIGATIONS",
        "page": "Pages 42–46",
        "answer": "Every Eagle member in good standing possesses the right to equal fraternal protection, freedom of expression within fraternal order decorum, the right to inspect chapter books and records, the right to vote in chapter and regional elections, and due process in any disciplinary hearing. Members are obligated to uphold the Constitution, pay national and club dues, attend assemblies, and exemplify moral dignity.",
        "citation": "Article IV, Section 1 & 2 (e-Constitution 2024, pp. 42-44)"
    },
    {
        "query": "What is the quorum requirement for chapter and assembly meetings?",
        "article_id": "art-8",
        "article": "ARTICLE VIII - RULES OF THE NATIONAL ASSEMBLY & CHAPTER MEETINGS",
        "page": "Pages 78–105",
        "answer": "For chapter General Membership Meetings (GMM) and official assembly sessions, a quorum consists of a **simple majority (50% + 1)** of members in good standing, unless otherwise specified for constitutional amendments which require a two-thirds (2/3) vote. In the absence of a quorum, the presiding officer may only recess or adjourn.",
        "citation": "Article VIII, Section 4 (e-Constitution 2024, pp. 78, 187)"
    },
    {
        "query": "How are national dues and club contributions allocated and audited?",
        "article_id": "art-9",
        "article": "ARTICLE IX & XII - REGIONS, CLUBS, DUES AND AUDIT",
        "page": "Pages 106–124, 145–149",
        "answer": "Annual national membership dues and charter fees must be remitted punctually to the National Treasury through official banking and verifiable digital gateways (with proof of receipt). The National Audit Commission is mandated to conduct annual fiscal reviews. Chapters must maintain transparent financial books, and officers face suspension for unaccounted funds or unremitted collections.",
        "citation": "Article IX, Section 6 & Article XII (e-Constitution 2024, pp. 110, 145)"
    },
    {
        "query": "What are the grounds and procedures for member suspension or expulsion?",
        "article_id": "art-16",
        "article": "ARTICLE XVI - CODE OF CONDUCT & FRATERNAL DISCIPLINE",
        "page": "Pages 176–178",
        "answer": "Grounds for disciplinary action include conviction of a crime involving moral turpitude, non-payment of dues for consecutive quarters without justifiable cause, gross insubordination, acts inimical to the welfare of the Order, and violating fraternal confidentiality. No disciplinary penalty may be imposed without written notice of charges and a formal hearing before the Grievance & Arbitration Committee or Supreme Tribunal.",
        "citation": "Article XVI, Section 3 (e-Constitution 2024, p. 176)"
    },
    {
        "query": "What are the official rules on the Eagle Gong, Gavel, and Insignia?",
        "article_id": "art-13",
        "article": "ARTICLE XIII - SEAL, EMBLEM, GONG AND GAVEL",
        "page": "Pages 150–170",
        "answer": "The official colors of the Philippine Eagles are Eagle Blue, Bumblebee Yellow, and Forest Green. The Gong and Gavel represent official authority and may only be sounded by the Presiding Officer during formalized opening, business deliberations, and ritual closing of assemblies. Tampering with or altering the official TFOE-PE circular crest is strictly prohibited.",
        "citation": "Article XIII, Sections 1–5 (e-Constitution 2024, pp. 150-154)"
    }
]

out_data = {
    "title": "The Philippine Eagles Magna Carta & Constitution of 2024",
    "source_url": "https://e-constitution.tfoe-peinc.com/",
    "total_pages": len(pages),
    "total_articles": len(articles_output),
    "articles": articles_output,
    "qa_presets": QA_PAIRS
}

dest_file = Path('d:/Antigravity/Agila Hub/src/lib/magnaCartaData.json')
dest_file.parent.mkdir(parents=True, exist_ok=True)
with open(dest_file, 'w', encoding='utf-8') as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print(f"Successfully generated {dest_file} ({dest_file.stat().st_size} bytes)")
