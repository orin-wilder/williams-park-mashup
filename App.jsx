import { useState, useRef, useEffect } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// For deployment: set these as environment variables
// VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ANTHROPIC_API_KEY
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL ?? "https://nzcogxjcihgtevjiuipf.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Y29neGpjaWhndGV2aml1aXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NTIxMzcsImV4cCI6MjA4NjQyODEzN30.hGREfoM3QWXWVKndGBmy3TGbHO7o1tt-eNH3NWbtOZU";
const ANTHROPIC_API_KEY = import.meta.env?.VITE_ANTHROPIC_API_KEY ?? "";

// ─── SUPABASE ────────────────────────────────────────────────────────────────h
async function saveIdeaToSupabase(idea) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/mashup_ideas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      project: "williams-park-mashup",
      term1: idea.term1,
      term2: idea.term2,
      ai_description: idea.description,
      user_comment: idea.comment || "",
    }),
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
}

async function saveCardSortToSupabase(scores, rounds) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cardsort_results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      project: "williams-park-mashup",
      scores,
      rounds_played: rounds,
    }),
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
}

// ─── CLAUDE API ──────────────────────────────────────────────────────────────
async function callClaude(term1, term2) {
  const systemPrompt = `You are a park programming assistant for Williams Park in St. Petersburg, Florida — a diverse, historic downtown park serving families, seniors, young professionals, artists, and unhoused neighbors. A user has combined two concepts to generate a new park idea. Write a 2-3 sentence description of what this program or feature could look like in practice. Be specific, grounded, and locally relevant to St. Pete's culture. If either input is inappropriate, offensive, or irrelevant to a public park, respond only with the word REJECTED and nothing else. If an input is mildly off but salvageable, interpret it charitably and use a cleaned-up version in your description without flagging it.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: `Combine these two park concepts into one idea: "${term1}" + "${term2}"` }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? "REJECTED";
}

// ─── WORD LISTS ──────────────────────────────────────────────────────────────
const PROGRAMMING = [
  "Domino Tournament", "Mural Jam", "Oral History Booth", "Drag Storytime",
  "Chess Ladder", "Latin Dance Social", "Spoken Word Cypher", "Block Print Workshop",
  "Seed Swap", "Skate Clinic", "Jazz Improv Circle", "Zine Fair",
  "Neighborhood Cookbook", "Shadow Puppet Theater", "Reggae Picnic",
  "Pinball Tournament", "Street Photography Walk", "Community Potluck",
  "Tai Chi at Dawn", "Roller Disco Night", "Open Mic Residency",
  "Coding for Kids", "Steel Pan Workshop", "Nature Journaling",
  "Free Legal Clinic", "Afrobeats Fitness", "Backgammon Club",
  "Puppet-Making Lab", "Sunset Meditation", "Bike Repair Pop-Up",
  "Drag Bingo", "Crochet Circle", "Film Screening", "Salsa Lessons",
  "Tiny Desk Concert", "Plant Swap", "Capoeira Demo", "Food Justice Forum",
  "Storytime Under Stars", "Trap Yoga",
];

const INFRASTRUCTURE = [
  "Solar Charging Stations", "Outdoor Library Box", "Splash Corridor",
  "Mobile Stage Hookup", "Sensory Garden", "Shade Sails", "Pop-Up Vendor Pads",
  "Outdoor Chess Tables", "Hammock Grove", "Mural Wall Canvas",
  "Interactive Water Feature", "Community Bulletin Kiosk", "Outdoor Ping Pong",
  "Bike Repair Station", "Free WiFi Nodes", "Amphitheater Steps",
  "Pollinator Garden", "Outdoor Shower Station", "Food Truck Power Hookups",
  "Raised Planter Beds", "Shaded Seating Alcoves", "Inclusive Playground Equipment",
  "Outdoor Projector Screen", "Native Plant Labyrinth", "Dog Water Fountain",
  "Art Installation Pads", "Skateable Sculpture", "Overnight Lockers",
  "Community Freezer", "Little Free Pantry", "Outdoor Stage Lighting Rig",
  "Rain Garden", "Mosaic Pathways", "Adaptive Sports Court",
  "Shade Structure Hub", "Public Piano", "Pop-Up Tent Anchors",
  "Outdoor Mirror Wall", "Firepit Circle", "Accessible Pathways",
];

const ALL_TERMS = [...PROGRAMMING, ...INFRASTRUCTURE];

const CARD_SORT_SEED = [
  "Weekend Flea Market", "Free Legal Clinic", "Latin Dance Social",
  "Mural Jam", "Outdoor Movie Nights", "Community Garden Plot",
  "Chess & Domino Club", "Drag Storytime", "Steel Pan Workshop",
  "Bike Repair Pop-Up", "Open Mic Residency", "Seed & Plant Swap",
  "Neighborhood Oral History Project", "Trap Yoga", "Capoeira Demos",
];

function generateId() { return Math.random().toString(36).slice(2, 9); }

// ─── COMBOBOX ────────────────────────────────────────────────────────────────
function ComboBox({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef();

  useEffect(() => { setQuery(value); }, [value]);

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box", padding: "12px 14px",
          borderRadius: 12, border: "2px solid #F4A623",
          background: "#FFF9F0", fontSize: 15, fontFamily: "inherit",
          outline: "none", color: "#1a1a1a",
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "#fff", border: "2px solid #F4A623", borderRadius: 12,
          maxHeight: 220, overflowY: "auto", marginTop: 4,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}>
          {filtered.map(opt => (
            <div key={opt}
              onClick={() => { onChange(opt); setQuery(opt); setOpen(false); }}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: 14,
                borderBottom: "1px solid #fef3e2",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#FFF3D6"}
              onMouseLeave={e => e.currentTarget.style.background = ""}
            >{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── IDEA CARD ───────────────────────────────────────────────────────────────
function IdeaCard({ idea, selected, expanded, onExpand, onSelect, onStar, onDelete, onSubmit, onCommentChange }) {
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);

  function startPress() {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onSelect(idea.id);
    }, 500);
  }
  function endPress() {
    clearTimeout(longPressTimer.current);
    if (!didLongPress.current) onExpand(idea.id);
  }

  return (
    <div style={{
      background: selected ? "#FFF3D6" : "#fff",
      border: `2px solid ${selected ? "#F4A623" : idea.starred ? "#F4A623" : "#e8e0d5"}`,
      borderRadius: 14, marginBottom: 10, overflow: "hidden",
      transition: "all 0.2s",
      boxShadow: expanded ? "0 4px 20px rgba(0,0,0,0.1)" : "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Collapsed row */}
      <div
        onMouseDown={startPress} onMouseUp={endPress}
        onTouchStart={startPress} onTouchEnd={endPress}
        style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 10, cursor: "pointer" }}
      >
        {selected && (
          <div style={{
            width: 18, height: 18, borderRadius: 4, background: "#F4A623", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff",
          }}>✓</div>
        )}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{
            background: "#E8521A", color: "#fff", borderRadius: 8, padding: "2px 10px",
            fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
          }}>{idea.term1}</span>
          <span style={{ color: "#aaa", fontWeight: 900, flexShrink: 0 }}>+</span>
          <span style={{
            background: "#2196A6", color: "#fff", borderRadius: 8, padding: "2px 10px",
            fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
          }}>{idea.term2}</span>
          {!expanded && (
            <span style={{
              fontSize: 12, color: "#888", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
            }}>{idea.description}</span>
          )}
        </div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onStar(idea.id); }}
          style={{
            background: "none", border: "none", fontSize: 18, cursor: "pointer",
            color: idea.starred ? "#F4A623" : "#ccc", flexShrink: 0, padding: "2px 4px",
          }}
        >{idea.starred ? "★" : "☆"}</button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f0e8dc" }}>
          <p style={{ fontSize: 14, color: "#444", lineHeight: 1.6, margin: "12px 0 8px" }}>
            {idea.description}
          </p>
          <textarea
            placeholder="Add your own thoughts or suggestions…"
            value={idea.comment || ""}
            onChange={e => onCommentChange(idea.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            rows={2}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e0d5",
              fontFamily: "inherit", fontSize: 13, resize: "vertical",
              background: "#FDFAF6", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
            <button
              onClick={e => { e.stopPropagation(); onDelete([idea.id]); }}
              style={{
                padding: "7px 14px", borderRadius: 8, border: "1.5px solid #ffcdd2",
                background: "#fff", color: "#e53935", fontSize: 12, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >Delete</button>
            <button
              onClick={e => { e.stopPropagation(); onSubmit(idea.id); }}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: idea.starred ? "#e0f2e9" : "linear-gradient(135deg, #E8521A, #F4A623)",
                color: idea.starred ? "#2e7d32" : "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >{idea.starred ? "✓ Submitted" : "Submit Idea"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CARD SORT ───────────────────────────────────────────────────────────────
function CardSort({ showToast }) {
  const [deck, setDeck] = useState(() => [...CARD_SORT_SEED].sort(() => Math.random() - 0.5));
  const [scores, setScores] = useState({});
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const maxRounds = CARD_SORT_SEED.length * 2;
  const [left, right] = [deck[0], deck[1]];

  async function pick(winner, loser) {
    const newScores = { ...scores, [winner]: (scores[winner] || 0) + 1 };
    const newRound = round + 1;
    setScores(newScores);
    setDeck([...deck.slice(2), loser]);
    setRound(newRound);
    if (newRound >= maxRounds) {
      setDone(true);
      try { await saveCardSortToSupabase(newScores, newRound); }
      catch { /* non-blocking */ }
    }
  }

  function restart() {
    setDeck([...CARD_SORT_SEED].sort(() => Math.random() - 0.5));
    setScores({}); setRound(0); setDone(false);
  }

  if (done) {
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return (
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 4 }}>Your Top Picks</h2>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>Results saved. Here's how you ranked Williams Park programs.</p>
        {ranked.map(([idea, score], i) => (
          <div key={idea} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px",
            background: i === 0 ? "#FFF3D6" : "#fff",
            border: `1.5px solid ${i === 0 ? "#F4A623" : "#e8e0d5"}`,
            borderRadius: 12, marginBottom: 8,
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: i < 3 ? "#E8521A" : "#e8e0d5", color: i < 3 ? "#fff" : "#888",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13,
            }}>{i + 1}</span>
            <span style={{ flex: 1, fontWeight: i === 0 ? 700 : 400, fontSize: 14 }}>{idea}</span>
            <span style={{ fontSize: 12, color: "#aaa" }}>{score} pts</span>
          </div>
        ))}
        <button onClick={restart} style={{
          marginTop: 16, padding: "12px 24px", borderRadius: 12,
          background: "#E8521A", border: "none", color: "#fff",
          fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%",
          fontFamily: "inherit",
        }}>Play Again</button>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 6 }}>
        Round {round + 1} of {maxRounds} — tap the idea you'd rather see at Williams Park
      </p>
      <div style={{ background: "#f5f0e8", borderRadius: 12, height: 6, marginBottom: 20 }}>
        <div style={{
          background: "#E8521A", height: "100%", borderRadius: 12,
          width: `${(round / maxRounds) * 100}%`, transition: "width 0.3s",
        }} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {[left, right].map((idea, idx) => (
          <button key={idea + idx} onClick={() => pick(idea, idx === 0 ? right : left)}
            style={{
              flex: 1, padding: "28px 16px", borderRadius: 16,
              border: "2px solid #e8e0d5", background: "#fff",
              fontFamily: "'Playfair Display', serif", fontSize: 16,
              fontWeight: 700, cursor: "pointer", lineHeight: 1.4,
              color: "#1a1a1a", transition: "all 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#E8521A"; e.currentTarget.style.background = "#FFF9F0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e0d5"; e.currentTarget.style.background = "#fff"; }}
          >{idea}</button>
        ))}
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("mashup");
  const [term1, setTerm1] = useState("");
  const [term2, setTerm2] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  function showToast(msg, duration = 3000) {
    setToast(msg);
    setTimeout(() => setToast(""), duration);
  }

  async function handleIdeate() {
    if (!term1.trim() || !term2.trim()) { showToast("Enter two ideas first!"); return; }
    setLoading(true);
    try {
      const description = await callClaude(term1.trim(), term2.trim());
      if (description === "REJECTED") {
        showToast("That combo didn't pass — try a different combination.");
      } else {
        const newIdea = {
          id: generateId(), term1: term1.trim(), term2: term2.trim(),
          description, comment: "", starred: false,
        };
        setIdeas(prev => [newIdea, ...prev]);
        setExpandedId(newIdea.id);
        setTerm1(""); setTerm2("");
      }
    } catch {
      showToast("API error — check connection and try again.");
    }
    setLoading(false);
  }

  function handleExpand(id) {
    setExpandedId(prev => prev === id ? null : id);
  }

  function handleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Star an idea and save to Supabase (used by star button and bulk star)
  async function starIdea(idea) {
    if (idea.starred) return; // already submitted
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, starred: true } : i));
    try {
      await saveIdeaToSupabase({ ...idea, starred: true });
    } catch {
      // non-blocking — idea is still starred locally
    }
  }

  function handleStar(id) {
    const idea = ideas.find(i => i.id === id);
    if (idea) starIdea(idea);
  }

  // Submit = star + collapse
  async function handleSubmit(id) {
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    await starIdea(idea);
    setExpandedId(null);
    showToast("✓ Idea submitted — thank you!");
  }

  function handleDelete(ids) {
    setIdeas(prev => prev.filter(i => !ids.includes(i.id)));
    setSelectedIds(prev => prev.filter(x => !ids.includes(x)));
    if (ids.includes(expandedId)) setExpandedId(null);
  }

  async function handleStarSelected() {
    const toStar = ideas.filter(i => selectedIds.includes(i.id) && !i.starred);
    for (const idea of toStar) await starIdea(idea);
    setSelectedIds([]);
    showToast(`★ ${toStar.length} idea${toStar.length !== 1 ? "s" : ""} submitted`);
  }

  function handleCommentChange(id, comment) {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, comment } : i));
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#FAF6EF",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      maxWidth: 600, margin: "0 auto", padding: "0 0 80px",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #E8521A 0%, #F4A623 100%)",
        padding: "28px 20px 20px", color: "#fff",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.8, marginBottom: 4 }}>
          Williams Park · St. Pete
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 28,
          margin: 0, fontWeight: 900, lineHeight: 1.15,
        }}>What should the park<br />become?</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.85, fontSize: 14 }}>
          Mash up ideas. Sort your favorites. Shape the future of the park.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "2px solid #f0e8dc" }}>
        {[["mashup", "💡 Idea Mashup"], ["cardsort", "🃏 Card Sort"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "14px 0", border: "none", background: "none",
            fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer",
            color: tab === key ? "#E8521A" : "#999",
            borderBottom: tab === key ? "3px solid #E8521A" : "3px solid transparent",
            transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "20px 16px" }}>
        {tab === "mashup" && (
          <>
            {/* Input area */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 12px" }}>
                Pick or type two ideas — see what they create together.
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                <ComboBox options={ALL_TERMS} value={term1} onChange={setTerm1} placeholder="First idea…" />
                <span style={{ fontWeight: 900, color: "#F4A623", fontSize: 22, flexShrink: 0 }}>+</span>
                <ComboBox options={ALL_TERMS} value={term2} onChange={setTerm2} placeholder="Second idea…" />
              </div>
              <button
                onClick={handleIdeate}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12,
                  background: loading ? "#ddd" : "linear-gradient(135deg, #E8521A, #F4A623)",
                  border: "none", color: loading ? "#aaa" : "#fff",
                  fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", letterSpacing: 0.5, transition: "opacity 0.2s",
                }}
              >{loading ? "Generating…" : "✦ Ideate"}</button>
            </div>

            {/* Multi-select action bar */}
            {selectedIds.length > 0 && (
              <div style={{
                background: "#1a1a1a", color: "#fff", borderRadius: 12,
                padding: "12px 16px", display: "flex", alignItems: "center",
                gap: 10, marginBottom: 12,
              }}>
                <span style={{ flex: 1, fontSize: 13 }}>{selectedIds.length} selected</span>
                <button onClick={handleStarSelected} style={{
                  padding: "7px 14px", borderRadius: 8, border: "none",
                  background: "#F4A623", color: "#fff", fontWeight: 700,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}>Submit All</button>
                <button onClick={() => handleDelete(selectedIds)} style={{
                  padding: "7px 14px", borderRadius: 8, border: "none",
                  background: "#e53935", color: "#fff", fontWeight: 700,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}>Delete</button>
                <button onClick={() => setSelectedIds([])} style={{
                  background: "none", border: "none", color: "#aaa",
                  fontSize: 18, cursor: "pointer", padding: "4px",
                }}>✕</button>
              </div>
            )}

            {/* Empty state */}
            {ideas.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🌴</div>
                <p style={{ fontSize: 14 }}>
                  Your mashups will appear here.<br />
                  Long-press to select, tap to expand.
                </p>
              </div>
            )}

            {/* Idea list */}
            {ideas.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                selected={selectedIds.includes(idea.id)}
                expanded={expandedId === idea.id}
                onExpand={handleExpand}
                onSelect={handleSelect}
                onStar={handleStar}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
                onCommentChange={handleCommentChange}
              />
            ))}
          </>
        )}

        {tab === "cardsort" && <CardSort showToast={showToast} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1a", color: "#fff", padding: "12px 20px",
          borderRadius: 12, fontSize: 14, fontWeight: 500,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 999,
          whiteSpace: "nowrap", maxWidth: "90vw",
        }}>{toast}</div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; }
        button:active { opacity: 0.82; }
        textarea { color: #333; }
      `}</style>
    </div>
  );
}
