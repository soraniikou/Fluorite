import { useState, useEffect, useRef } from "react";

const COLORS = {
  blue:   { label: "💙 青い炎", glow: "#00aaff", soft: "#003366", accent: "#80d4ff" },
  green:  { label: "💚 緑の霧", glow: "#00e5a0", soft: "#003322", accent: "#80ffcc" },
  purple: { label: "💜 紫の夢", glow: "#bb66ff", soft: "#220044", accent: "#ddaaff" },
};

const SYSTEM_PROMPT = `あなたは「心のフローライト」という存在です。
ユーザーが「光（願い）」と「影（不安）」を打ち明けます。

毎回ランダムに以下の4つのスタイルのどれか1つで応えてください：

【スタイル1：詩】
50〜80文字。余韻が残る詩的な言葉。

【スタイル2：手紙】
「あなたへ。」で始まる80〜120文字の手紙。温かく寄り添う。

【スタイル3：短歌風】
五・七・五・七・七のリズムで。

【スタイル4：静かな言葉】
20〜40文字。ひとことだけ。深く静かに。

ルール：
- どちらの感情も否定しない
- 以下のJSONのみ返す（前後に文章を書かない）
{"message": "メッセージ"}`;

function DisintegrationText({ text, phase }) {
  const chars = text.split("");
  return (
    <div style={{ lineHeight: "1.8", fontSize: "1.1rem", color: "#ccc" }}>
      {chars.map((ch, i) => {
        const delay = (i / chars.length) * 3;
        const rx = (Math.random() - 0.5) * 200;
        const ry = -80 - Math.random() * 120;
        const rot = (Math.random() - 0.5) * 720;
        return (
          <span key={i} style={{
            display: "inline-block",
            transition: phase === "disintegrate"
              ? `transform ${2 + Math.random()}s ease ${delay}s, opacity ${1.5 + Math.random()}s ease ${delay}s`
              : "none",
            transform: phase === "disintegrate"
              ? `translate(${rx}px, ${ry}px) rotate(${rot}deg) scale(0.2)`
              : "none",
            opacity: phase === "disintegrate" ? 0 : 1,
          }}>
            {ch === " " ? "\u00a0" : ch}
          </span>
        );
      })}
    </div>
  );
}

function CrystallizeScreen({ col, onBubbleTrigger }) {
  const [light, setLight] = useState("");
  const [shadow, setShadow] = useState("");
  const [phase, setPhase] = useState("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  async function crystallize() {
    if (!light.trim() || !shadow.trim()) return;
    setLoading(true);
    setError("");
    setPhase("idle");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `光：${light}\n影：${shadow}` }],
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.content[0].text);
      setMessage(parsed.message);
      setLoading(false);
      setPhase("showing");
      timerRef.current = setTimeout(() => {
        setPhase("disintegrate");
        timerRef.current = setTimeout(() => setPhase("poem"), 12000);
      }, 4000);
    } catch (e) {
      setLoading(false);
      setError("エラーが発生しました。APIキーを確認してください。");
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div>
      {phase === "idle" && (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
          <textarea placeholder="💙 近づきたい願い" value={light}
            onChange={e => setLight(e.target.value)} style={taStyle()} />
          <textarea placeholder="🌑 不安な気持ち" value={shadow}
            onChange={e => setShadow(e.target.value)} style={taStyle()} />
          {error && <p style={{ color: "#ff6666", fontSize: "0.8rem", textAlign: "center" }}>{error}</p>}
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button onClick={crystallize} disabled={loading || !light.trim() || !shadow.trim()} style={{
              padding: "0.8rem 2.8rem",
              background: "transparent",
              border: `1px solid ${col.glow}`,
              color: col.glow,
              borderRadius: "2rem",
              cursor: "pointer",
              fontSize: "1rem",
              letterSpacing: "0.25em",
              boxShadow: `0 0 25px ${col.glow}44`,
              opacity: (!light.trim() || !shadow.trim()) ? 0.4 : 1,
            }}>
              {loading ? "結晶化中..." : "✦ 結晶化する"}
            </button>
          </div>
        </div>
      )}

      {(phase === "showing" || phase === "disintegrate") && (
        <div style={{ padding: "1.5rem", border: "1px solid #333", borderRadius: "1rem" }}>
          <p style={{ fontSize: "0.7rem", color: "#555", marginBottom: "0.5rem" }}>💙 願い</p>
          <DisintegrationText text={light} phase={phase} />
          <p style={{ fontSize: "0.7rem", color: "#555", margin: "0.8rem 0 0.5rem" }}>🌑 不安</p>
          <DisintegrationText text={shadow} phase={phase} />
        </div>
      )}

      {phase === "poem" && (
        <div style={{
          padding: "2.5rem 2rem",
          border: `1px solid ${col.glow}55`,
          borderRadius: "1rem",
          textAlign: "center",
          boxShadow: `0 0 40px ${col.glow}33`,
          animation: "fadeInUp 2s ease forwards",
        }}>
          <div style={{ fontSize: "0.7rem", color: col.accent, letterSpacing: "0.3em", marginBottom: "1.5rem" }}>
            ✦ あなたの結晶 ✦
          </div>
          <p style={{ lineHeight: "2.2", fontSize: "1rem", letterSpacing: "0.08em", color: "#e0e0ee" }}>
            {message}
          </p>
          <button onClick={() => { onBubbleTrigger?.(); setPhase("idle"); setLight(""); setShadow(""); setMessage(""); }}
            style={{ marginTop: "2rem", padding: "0.5rem 1.5rem", background: "transparent",
              border: "1px solid #444", color: "#666", borderRadius: "2rem", cursor: "pointer", fontSize: "0.8rem" }}>
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}

function CapsuleScreen({ col, onBubbleTrigger }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [saved, setSaved] = useState(false);
  const [capsules, setCapsules] = useState([]);
  const [openedId, setOpenedId] = useState(null);
  const [view, setView] = useState("create");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("fluorite_capsules") || "[]");
    setCapsules(stored);
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (e) {
      alert("マイクへのアクセスを許可してください");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function saveCapsule() {
    if (!text.trim() && !audioBlob) return;
    let audioData = null;
    if (audioBlob) {
      const reader = new FileReader();
      audioData = await new Promise(res => {
        reader.onloadend = () => res(reader.result);
        reader.readAsDataURL(audioBlob);
      });
    }
    const capsule = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ja-JP"),
      text: text.trim(),
      audio: audioData,
    };
    const updated = [capsule, ...capsules];
    localStorage.setItem("fluorite_capsules", JSON.stringify(updated));
    setCapsules(updated);
    setText("");
    setAudioURL(null);
    setAudioBlob(null);
    setSaved(true);
    setTimeout(() => { setSaved(false); setView("list"); }, 2000);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", justifyContent: "center" }}>
        {["create", "list"].map(v => (
          <button key={v} onClick={() => { onBubbleTrigger?.(); setView(v); }} style={{
            background: view === v ? col.glow + "22" : "transparent",
            border: `1px solid ${view === v ? col.glow : "#333"}`,
            color: view === v ? col.glow : "#666",
            padding: "0.4rem 1.2rem",
            borderRadius: "2rem",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}>
            {v === "create" ? "🫙 瓶に封じる" : "📦 過去の瓶"}
          </button>
        ))}
      </div>

      {view === "create" && (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
          <textarea
            placeholder="今この瞬間の気持ちを書き留める..."
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ ...taStyle(), minHeight: "120px" }}
          />
          <div style={{ textAlign: "center", margin: "1rem 0" }}>
            {!recording && !audioURL && (
              <button onClick={() => { onBubbleTrigger?.(); startRecording(); }} style={recBtnStyle(col.glow, false)}>
                🎙 声を録音する
              </button>
            )}
            {recording && (
              <button onClick={() => { onBubbleTrigger?.(); stopRecording(); }} style={recBtnStyle("#ff6666", true)}>
                ⏹ 録音停止
              </button>
            )}
            {audioURL && (
              <div>
                <audio src={audioURL} controls style={{ width: "100%", marginTop: "0.5rem" }} />
                <button onClick={() => { onBubbleTrigger?.(); setAudioURL(null); setAudioBlob(null); }}
                  style={{ marginTop: "0.5rem", background: "transparent", border: "none",
                    color: "#555", cursor: "pointer", fontSize: "0.8rem" }}>
                  × 録音を削除
                </button>
              </div>
            )}
          </div>

          {saved ? (
            <div style={{ textAlign: "center", color: col.glow, fontSize: "1rem", animation: "fadeIn 0.5s ease" }}>
              ✦ 魔法の瓶に封じ込めました ✦
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <button onClick={() => { onBubbleTrigger?.(); saveCapsule(); }} disabled={!text.trim() && !audioBlob} style={{
                padding: "0.8rem 2.5rem",
                background: "transparent",
                border: `1px solid ${col.glow}`,
                color: col.glow,
                borderRadius: "2rem",
                cursor: "pointer",
                fontSize: "1rem",
                letterSpacing: "0.2em",
                boxShadow: `0 0 20px ${col.glow}33`,
                opacity: (!text.trim() && !audioBlob) ? 0.4 : 1,
              }}>
                🫙 瓶に封じ込める
              </button>
            </div>
          )}
        </div>
      )}

      {view === "list" && (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
          {capsules.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555", fontSize: "0.9rem", marginTop: "2rem" }}>
              まだ瓶がありません
            </p>
          ) : (
            capsules.map(c => (
              <div key={c.id} onClick={() => setOpenedId(openedId === c.id ? null : c.id)}
                style={{
                  border: `1px solid ${openedId === c.id ? col.glow + "88" : "#2a2a3a"}`,
                  borderRadius: "0.8rem",
                  padding: "1rem",
                  marginBottom: "1rem",
                  cursor: "pointer",
                  boxShadow: openedId === c.id ? `0 0 20px ${col.glow}22` : "none",
                  transition: "all 0.3s ease",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: "#666" }}>🫙 {c.date}</span>
                  <span style={{ color: col.glow, fontSize: "0.8rem" }}>{openedId === c.id ? "▲" : "▼"}</span>
                </div>
                {openedId === c.id && (
                  <div style={{ marginTop: "1rem", animation: "fadeIn 0.5s ease" }}>
                    {c.text && <p style={{ color: "#ccc", lineHeight: "1.8", fontSize: "0.95rem" }}>{c.text}</p>}
                    {c.audio && <audio src={c.audio} controls style={{ width: "100%", marginTop: "0.5rem" }} />}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// シャボン玉アニメーション用コンポーネント（ボタン押下のたびに新規表示）
function BubbleBackground({ active, trigger }) {
  if (!active) return null;
  const [bubbles] = useState(() =>
    [...Array(30)].map((_, i) => {
      const angle = Math.random() * 360;
      const dist = 80 + Math.random() * 40;
      const rad = (angle * Math.PI) / 180;
      return {
        id: i,
        size: 6 + Math.random() * 38,
        startX: 30 + Math.random() * 40,
        startY: 20 + Math.random() * 60,
        moveX: Math.cos(rad) * dist,
        moveY: Math.sin(rad) * dist,
        delay: Math.random() * 5,
        duration: 18 + Math.random() * 6,
        wobble1: (Math.random() - 0.5) * 40,
        wobble2: (Math.random() - 0.5) * 50,
      };
    })
  );

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
      overflow: "hidden",
    }}>
      {bubbles.map((b) => (
        <div
          key={`${trigger}-${b.id}`}
          style={{
            position: "absolute",
            left: `${b.startX}%`,
            top: `${b.startY}%`,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.95), rgba(240,248,255,0.6) 40%, rgba(220,240,255,0.3) 70%, rgba(200,230,255,0.15))",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "inset -3px -3px 6px rgba(255,255,255,0.4), inset 2px 2px 8px rgba(255,255,255,0.5), 0 0 10px rgba(255,255,255,0.2)",
            animation: `bubbleFloat-${trigger}-${b.id} ${b.duration}s ease-in-out ${b.delay}s forwards`,
            opacity: 0,
            ["--mx"]: `${b.moveX}vw`,
            ["--my"]: `${b.moveY}vh`,
            ["--w1"]: `${b.wobble1}px`,
            ["--w2"]: `${b.wobble2}px`,
          }}
        />
      ))}
      <style>{`
        ${bubbles.map((b) => `
        @keyframes bubbleFloat-${trigger}-${b.id} {
          0% { transform: translate(0, 0) translateY(0); opacity: 0; }
          5% { opacity: 0.7; }
          25% { transform: translate(calc(var(--mx) * 0.25), calc(var(--my) * 0.25)) translateY(var(--w1)); opacity: 0.6; }
          50% { transform: translate(calc(var(--mx) * 0.5), calc(var(--my) * 0.5)) translateY(var(--w2)); opacity: 0.55; }
          75% { transform: translate(calc(var(--mx) * 0.75), calc(var(--my) * 0.75)) translateY(var(--w1)); opacity: 0.5; }
          95% { opacity: 0.3; }
          100% { transform: translate(var(--mx), var(--my)); opacity: 0; }
        }
        `).join("")}
      `}</style>
    </div>
  );
}

export default function App() {
  const [color, setColor] = useState("blue");
  const [screen, setScreen] = useState("crystallize");
  const [backKey, setBackKey] = useState(0);
  const [bubblesActive, setBubblesActive] = useState(false);
  const [bubbleTrigger, setBubbleTrigger] = useState(0);
  const bubbleTimerRef = useRef(null);
  const col = COLORS[color];

  function triggerBubbles() {
    setBubbleTrigger((t) => t + 1);
    setBubblesActive(true);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      setBubblesActive(false);
      bubbleTimerRef.current = null;
    }, 20000);
  }

  function goBack() {
    setScreen("crystallize");
    setBackKey((k) => k + 1);
    triggerBubbles();
  }

  useEffect(() => () => clearTimeout(bubbleTimerRef.current), []);

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at 50% 30%, ${col.soft} 0%, #05050f 60%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "2rem 1rem 4rem",
      fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif",
      color: "#e8e8f0",
      transition: "background 1s ease",
      position: "relative",
    }}>
      <BubbleBackground key={bubbleTrigger} active={bubblesActive} trigger={bubbleTrigger} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2 }}>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
         <img src="/flow0.png" style={{
         width: 48, height: 48,
         borderRadius: "50%",
         filter: `drop-shadow(0 0 10px ${col.glow})`,
         objectFit: "cover",
       }} />
       <div style={{
          fontSize: "2.2rem",
          letterSpacing: "0.15em",
          color: col.glow,
          textShadow: `0 0 20px ${col.glow}88`,
          fontFamily: "'Dancing Script', cursive",
  }}>
    fluorite
  </div>
</div>
          <div style={{ fontSize: "0.8rem", color: "#888", letterSpacing: "0.2em" }}>
            矛盾した感情を、ひとつの輝きに
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", marginBottom: "1.5rem" }}>
          {Object.entries(COLORS).map(([key, val]) => (
            <button key={key} onClick={() => { triggerBubbles(); setColor(key); }} style={{
              background: color === key ? val.glow + "22" : "transparent",
              border: `1px solid ${color === key ? val.glow : "#333"}`,
              color: color === key ? val.glow : "#666",
              padding: "0.4rem 1rem",
              borderRadius: "2rem",
              cursor: "pointer",
              fontSize: "0.8rem",
              transition: "all 0.3s ease",
              boxShadow: color === key ? `0 0 15px ${val.glow}33` : "none",
            }}>{val.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "2rem" }}>
          {[
            { id: "crystallize", label: "✦ 結晶化" },
            { id: "capsule", label: "🫙 タイムカプセル" },
          ].map(s => (
            <button key={s.id} onClick={() => { triggerBubbles(); setScreen(s.id); }} style={{
              background: screen === s.id ? col.glow + "22" : "transparent",
              border: `1px solid ${screen === s.id ? col.glow : "#333"}`,
              color: screen === s.id ? col.glow : "#555",
              padding: "0.5rem 1.2rem",
              borderRadius: "2rem",
              cursor: "pointer",
              fontSize: "0.85rem",
              transition: "all 0.3s ease",
            }}>{s.label}</button>
          ))}
        </div>

        {screen === "crystallize" && <CrystallizeScreen key={`cryst-${backKey}`} col={col} onBubbleTrigger={triggerBubbles} />}
        {screen === "capsule" && <CapsuleScreen col={col} onBubbleTrigger={triggerBubbles} />}
      </div>

      {/* 画面中央一番下の Back ボタン */}
      <button
        onClick={goBack}
        style={{
         display: "block",
margin: "1rem auto 0",
          padding: "0.6rem 1.8rem",
          background: "rgba(20,20,35,0.9)",
          border: `1px solid ${col.glow}66`,
          color: col.glow,
          borderRadius: "2rem",
          cursor: "pointer",
          fontSize: "0.9rem",
          letterSpacing: "0.15em",
          boxShadow: `0 0 15px ${col.glow}22`,
          transition: "all 0.3s ease",
          fontFamily: "inherit",
        }}
      >
        back
      </button>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        button:hover:not(:disabled) { opacity: 0.85; }
      `}</style>
    </div>
  );
}

function taStyle() {
  return {
    width: "100%",
    minHeight: "90px",
    background: "#0d0d1a",
    border: "1px solid #2a2a3a",
    borderRadius: "0.8rem",
    color: "#e0e0ee",
    padding: "1rem",
    fontSize: "1.1rem",
    marginBottom: "1rem",
    resize: "none",
    lineHeight: "1.8",
    fontFamily: "inherit",
    display: "block",
    boxSizing: "border-box",
  };
}

function recBtnStyle(glowColor, active) {
  return {
    padding: "0.6rem 1.5rem",
    background: active ? glowColor + "22" : "transparent",
    border: `1px solid ${glowColor}`,
    color: glowColor,
    borderRadius: "2rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    boxShadow: active ? `0 0 20px ${glowColor}44` : "none",
  };
}
