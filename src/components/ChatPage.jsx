/**
 * ChatPage.jsx  (v3)
 * frontend/src/pages/ChatPage.jsx
 *
 * FIXES:
 *   - Greeting + first question shown as ONE message (no double render)
 *
 * NEW:
 *   - Live profile card fills in as user answers
 *   - Quick-reply chips (yes/no for required, options for follow-up)
 *   - Skip button on follow-up questions
 *   - Maandhan contribution calculator
 *   - Urgency banners (deadline/age warnings)
 *   - Checkable personal action plan
 *   - Expandable scheme cards
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./ChatPage.css";

const SESSION_ID = "session_" + Math.random().toString(36).slice(2);
const API        = "http://localhost:5000";
const SpeechRec  = window.SpeechRecognition || window.webkitSpeechRecognition;

const YES_NO = ["हाँ (Yes)", "नहीं (No)"];
const REQUIRED_CHIPS = {
  isFarmer:       YES_NO,
  ownsLand:       YES_NO,
  growsCrops:     YES_NO,
  hasBankAccount: YES_NO,
  age:            ["18–25", "26–35", "36–45", "46–60", "60+"],
};
const STEP_KEY_FARMER     = [null, "isFarmer", "age", "ownsLand", "growsCrops", "hasBankAccount"];
const STEP_KEY_NON_FARMER = [null, "isFarmer", "age", "hasBankAccount"];
const CAT_ACCENT = {
  income_support: "#2e7d32", crop_insurance: "#1565c0",
  accident_insurance: "#e65100", pension: "#6a1b9a",
};

/* ── Sub-components ────────────────────────────────────────────────────── */

function ProfileCard({ facts }) {
  if (!facts?.length) return null;
  return (
    <div className="profile-card">
      <div className="profile-title">Your Profile So Far</div>
      <div className="profile-facts">
        {facts.map((f, i) => <span key={i} className="profile-fact">{f}</span>)}
      </div>
    </div>
  );
}

function UrgencyBanner({ notices }) {
  if (!notices?.length) return null;
  return (
    <div className="urgency-wrap">
      {notices.map((n, i) => (
        <div key={i} className={`urgency-notice urgency-${n.level}`}>{n.message}</div>
      ))}
    </div>
  );
}

function MaandhanCalc({ calc }) {
  if (!calc) return null;
  return (
    <div className="maandhan-calc">
      <div className="calc-title">📊 Your PM Maandhan Numbers</div>
      <div className="calc-grid">
        <div className="calc-cell">
          <span className="calc-num">₹{calc.monthly}/mo</span>
          <span className="calc-lbl">You pay</span>
        </div>
        <div className="calc-cell">
          <span className="calc-num">₹{calc.monthly}/mo</span>
          <span className="calc-lbl">Govt matches</span>
        </div>
        <div className="calc-cell">
          <span className="calc-num">{calc.yearsLeft} yrs</span>
          <span className="calc-lbl">Until age 60</span>
        </div>
        <div className="calc-cell calc-highlight">
          <span className="calc-num">₹3,000/mo</span>
          <span className="calc-lbl">Pension at 60</span>
        </div>
      </div>
      <p className="calc-note">
        Total you pay: ₹{calc.totalPaid.toLocaleString("en-IN")} over {calc.yearsLeft} years.
        After just {calc.breakEvenMonths} months of pension, you recover everything.
      </p>
    </div>
  );
}

function ActionPlan({ steps }) {
  const [done, setDone] = useState([]);
  if (!steps?.length) return null;
  const toggle = (i) =>
    setDone((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]);
  return (
    <div className="action-plan">
      <div className="action-title">✅ Your Personal Action Plan</div>
      <p className="action-sub">Tap to tick off steps as you do them:</p>
      {steps.map((s, i) => (
        <div key={i} className={`action-step ${done.includes(i) ? "step-done" : ""}`} onClick={() => toggle(i)}>
          <span className="step-check">{done.includes(i) ? "☑" : "☐"}</span>
          <span>{s}</span>
        </div>
      ))}
    </div>
  );
}

function SchemeCard({ scheme }) {
  const [open, setOpen] = useState(false);
  const accent = CAT_ACCENT[scheme.category] || "#2e7d32";
  return (
    <div className="scheme-card" style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="sc-head" onClick={() => setOpen(!open)}>
        <div>
          <span className="sc-rank" style={{ background: accent }}>#{scheme.rank}</span>
          <div className="sc-name">{scheme.name}</div>
          <div className="sc-benefit">{scheme.benefits}</div>
        </div>
        <span className="sc-toggle">{open ? "▲" : "▼"}</span>
      </div>
      {scheme.whyEligible?.length > 0 && (
        <div className="sc-chips">
          {scheme.whyEligible.map((r, i) => (
            <span key={i} className="sc-chip">✓ {r}</span>
          ))}
        </div>
      )}
      {open && (
        <div className="sc-detail">
          <div className="sc-sec-title">How to apply</div>
          <ol className="sc-steps">{scheme.applicationSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <div className="sc-row2">
            <div>
              <div className="sc-sec-title">Nearest centre</div>
              <div className="sc-text">{scheme.nearestCenter}</div>
            </div>
            <div>
              <div className="sc-sec-title">Helpline</div>
              <div className="sc-text sc-hl">{scheme.helpline}</div>
            </div>
          </div>
          <div className="sc-warning">{scheme.fraudWarning}</div>
        </div>
      )}
    </div>
  );
}

function QuickReplies({ chips, onSelect, allowSkip, onSkip }) {
  if (!chips?.length) return null;
  return (
    <div className="quick-row">
      {chips.map((c, i) => (
        <button key={i} className="quick-chip" onClick={() => onSelect(c)}>{c}</button>
      ))}
      {allowSkip && <button className="quick-chip skip-chip" onClick={onSkip}>Skip →</button>}
    </div>
  );
}

function ProgressBar({ step, total, phase }) {
  const pct = Math.min(100, Math.round((step / total) * 100));
  return (
    <div className="progress-wrap">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
      <span className="progress-lbl">
        {phase === "followup" ? "Personalizing…" : `Question ${step} of ${total}`}
      </span>
    </div>
  );
}

/* ── BotMessage dispatcher ─────────────────────────────────────────────── */
function BotMessage({ data, onQuick, onSkip, chips, currentKey }) {
  const { type, payload, meta } = data;
  const progress = meta?.progress || [];

  const wrap = (content) => (
    <div className="bot-row">
      <div className="avatar">🌿</div>
      <div className="bot-content">{content}</div>
    </div>
  );

  if (type === "greeting") {
    return wrap(
      <>
        <div className="bubble bot-bubble greeting-bub">
          {payload.lines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
        {payload.firstQuestion && (
          <div className="bubble bot-bubble question-bub" style={{ marginTop: 8 }}>
            <p className="q-text">{payload.firstQuestion.question}</p>
            {payload.firstQuestion.hint && <p className="q-hint">{payload.firstQuestion.hint}</p>}
            <QuickReplies chips={REQUIRED_CHIPS["isFarmer"]} onSelect={onQuick} />
          </div>
        )}
      </>
    );
  }

  if (type === "question") {
    return wrap(
      <div className="bubble bot-bubble question-bub">
        <p className="q-text">{payload.question}</p>
        {payload.hint && <p className="q-hint">{payload.hint}</p>}
        <QuickReplies chips={chips} onSelect={onQuick} />
      </div>
    );
  }

  if (type === "followup_question") {
    return wrap(
      <div className="bubble bot-bubble followup-bub">
        <span className="followup-badge">Optional</span>
        <p className="q-text">{payload.question}</p>
        {payload.hint && <p className="q-hint">{payload.hint}</p>}
        <QuickReplies chips={payload.options} onSelect={onQuick} allowSkip onSkip={onSkip} />
      </div>
    );
  }

  if (type === "schemes") {
    return wrap(
      <div className="schemes-wrap">
        <div className="schemes-headline">{payload.headline}</div>
        <p className="schemes-sub">{payload.subline}</p>
        <ProfileCard facts={progress} />
        <UrgencyBanner notices={payload.urgencyNotices} />
        {payload.priorityNote && <div className="priority-note">{payload.priorityNote}</div>}
        {payload.schemes.map((s, i) => <SchemeCard key={i} scheme={s} />)}
        <MaandhanCalc calc={payload.maandhanCalc} />
        <ActionPlan steps={payload.firstActionPlan} />
        <p className="schemes-footer">Tap any card to expand full steps and helpline. Type "helpline" for numbers.</p>
      </div>
    );
  }

  if (type === "no_schemes") {
    return wrap(
      <div className="bubble bot-bubble"><p>{payload.message}</p></div>
    );
  }

  if (type === "fraud_alert") {
    return (
      <div className="bot-row">
        <div className="avatar fraud-av">⚠️</div>
        <div className="fraud-card">
          <div className="fraud-title">{payload.title}</div>
          <p className="fraud-msg">{payload.message}</p>
          <ol className="fraud-steps">{payload.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <div className="fraud-helplines">
            {payload.helplines.map((h, i) => (
              <a key={i} href={`tel:${h.number.split("/")[0].trim()}`} className="fraud-chip">
                📞 {h.label}: {h.number}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "helpline") {
    return (
      <div className="bot-row">
        <div className="avatar">📞</div>
        <div className="helpline-card">
          <div className="helpline-title">{payload.title}</div>
          {payload.helplines.map((h, i) => (
            <div key={i} className="hl-row">
              <span className="hl-scheme">{h.scheme}</span>
              <a href={`tel:${h.number.split("/")[0].trim()}`} className="hl-num">{h.number}</a>
              <span className="hl-hours">{h.hours}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

/* ── MAIN ──────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [recording, setRecording] = useState(false);
  const [progStep,  setProgStep]  = useState(0);
  const [progTotal, setProgTotal] = useState(5);
  const [progPhase, setProgPhase] = useState("required");
  const [chips,     setChips]     = useState([]);
  const [currentKey,setCurrentKey]= useState(null);

  const chatBodyRef  = useRef(null);
  const recognizerRef= useRef(null);
  const greeted      = useRef(false);

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!greeted.current) { greeted.current = true; doSend("hello", true); }
  }, []); // eslint-disable-line

  const updateChips = (data) => {
    if (data.type === "question") {
      const step  = data.payload.step;
      const total = data.payload.total;
      const order = total <= 3 ? STEP_KEY_NON_FARMER : STEP_KEY_FARMER;
      const key   = order[step] || null;
      setCurrentKey(key);
      setChips(key ? (REQUIRED_CHIPS[key] || []) : []);
      if (step) { setProgStep(step); setProgTotal(total); }
    } else if (data.type === "followup_question") {
      setChips(data.payload.options || []);
      setCurrentKey(data.payload.key);
    } else {
      setChips([]);
      setCurrentKey(null);
    }
    if (data.meta?.phase) setProgPhase(data.meta.phase);
    if (data.type === "schemes" || data.type === "no_schemes") setProgStep(0);
  };

  const doSend = useCallback(async (text, hidden = false) => {
    if (!hidden) setMessages((p) => [...p, { sender: "user", text }]);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { sender: "bot", data }]);
      updateChips(data);
    } catch {
      setMessages((p) => [...p, {
        sender: "bot",
        data: { type: "question", payload: { question: "⚠️ Cannot reach server on port 5000." }, meta: {} },
      }]);
    }
    setLoading(false);
  }, []);

  const handleSend = () => { const t = input.trim(); if (t && !loading) { setInput(""); doSend(t); } };
  const handleKey  = (e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); };

  const handleMic = () => {
    if (!SpeechRec) return alert("Voice not supported — use Chrome or Edge.");
    if (recording) { recognizerRef.current?.stop(); setRecording(false); return; }
    const r = new SpeechRec();
    r.lang = "hi-IN"; r.interimResults = false;
    r.onresult = (e) => { setRecording(false); const t = e.results[0][0].transcript; if (t) doSend(t); };
    r.onerror  = (e) => { setRecording(false); if (e.error === "not-allowed") alert("Mic denied."); };
    r.onend    = () => setRecording(false);
    recognizerRef.current = r; r.start(); setRecording(true);
  };

  const handleReset = async () => {
    await fetch(`${API}/reset`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SESSION_ID }),
    }).catch(() => {});
    setMessages([]); setProgStep(0); setChips([]); setCurrentKey(null);
    greeted.current = false;
    setTimeout(() => { greeted.current = true; doSend("hello", true); }, 50);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <div className="header-title">🌿 ApnaGaon AI</div>
          <div className="header-sub">Government Scheme Advisor</div>
        </div>
        <button className="reset-btn" onClick={handleReset}>↺ Start over</button>
      </div>

      {progStep > 0 && <ProgressBar step={progStep} total={progTotal} phase={progPhase} />}

      <div className="chat-body" ref={chatBodyRef}>
        {messages.map((msg, i) =>
          msg.sender === "user"
            ? <div key={i} className="user-row"><div className="bubble user-bubble">{msg.text}</div></div>
            : <BotMessage key={i} data={msg.data} onQuick={doSend} onSkip={() => doSend("skip")}
                chips={chips} currentKey={currentKey} />
        )}
        {loading && (
          <div className="bot-row">
            <div className="avatar">🌿</div>
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <button className={`mic-btn ${recording ? "mic-on" : ""}`} onClick={handleMic}>
          {recording ? "■" : "🎤"}
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey} placeholder="Type in Hindi or English…" disabled={loading} />
        <button className="send-btn" onClick={handleSend} disabled={!input.trim() || loading}>Send</button>
      </div>
    </div>
  );
}