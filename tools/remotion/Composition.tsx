import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

const NAVY = "#0B1530";
const NAVY7 = "#22305A";
const AMBER = "#FFC53D";
const PAPER = "#F3F5FA";

type Phase = {
  id: string;
  n: number;
  title: string;
  bloom: string;
  art: string;
  steps: string[];
  controls: [string, string][];
  points: number;
};

export const PHASES: Phase[] = [
  { id: "f1", n: 1, title: "Alfabet INTERCO", bloom: "Recordar", art: "s3-3.webp", points: 150,
    steps: ["Escolta CECOS i escriu la paraula que lletreja", "Primer amb text, després només amb la veu", "Lletreja tu per veu: si no et copia, repeteix"],
    controls: [["PARLA", "mantén premut el botó vermell"], ["CECOS", "botó verd: torna a escoltar"]] },
  { id: "f2", n: 2, title: "Famílies de codis", bloom: "Comprendre", art: "f2.webp", points: 150,
    steps: ["Escolta la frase de ràdio amb el codi", "Mira la imatge i tria la família", "Veuràs un exemple i dos codis relacionats"],
    controls: [["Clic / toc", "tria la família"], ["Tecles 1–6", "dreceres"]] },
  { id: "f3", n: 3, title: "Escenes il·lustrades", bloom: "Aplicar", art: "s3-23.webp", points: 200,
    steps: ["Mira l’escena i llegeix què passa", "Tria el codi que diries a CECOS", "Nivell 3: només el codi i 20 segons"],
    controls: [["Clic / toc", "tria una opció"], ["Tecles 1–4", "dreceres"]] },
  { id: "f4", n: 4, title: "La línia del servei", bloom: "Analitzar", art: "s3-35.webp", points: 150,
    steps: ["Ordena els codis d’un servei complet", "De 3.3 operatiu fins a 3.6 final", "Tens dos intents per servei"],
    controls: [["Arrossega", "mou la targeta"], ["Fletxes", "puja o baixa una posició"]] },
  { id: "f5", n: 5, title: "Descodifica", bloom: "Interpretar", art: "hero.webp", points: 100,
    steps: ["Escolta el missatge de ràdio", "Tria què vol dir en llenguatge planer", "Fixa’t en qui, què i on"],
    controls: [["CECOS", "botó verd: torna a escoltar"], ["Tecles 1–3", "dreceres"]] },
  { id: "f6", n: 6, title: "Simulador de ràdio", bloom: "Transferir", art: "cabina.webp", points: 250,
    steps: ["Tria què dius a CECOS", "Mantén premut PARLA mentre transmets", "No trepitgis CECOS: seria un 3.13"],
    controls: [["PARLA", "botó vermell o barra espaiadora"], ["Deixa’l anar", "per enviar el missatge"]] },
];
export const DUR: Record<string, number> = {"f1": 23.54, "f2": 18.23, "f3": 15.31, "f4": 13.66, "f5": 11.34, "f6": 15.39};

const Fonts: React.FC = () => (
  <style>{`
    @font-face{font-family:BC;font-weight:800;src:url(${staticFile("plus-jakarta-sans-latin-800-normal.woff2")}) format("woff2")}
    @font-face{font-family:B;font-weight:600;src:url(${staticFile("plus-jakarta-sans-latin-600-normal.woff2")}) format("woff2")}
    @font-face{font-family:JB;font-weight:700;src:url(${staticFile("jetbrains-mono-latin-700-normal.woff2")}) format("woff2")}
  `}</style>
);

const ease = Easing.bezier(0.22, 1, 0.36, 1);

const Title: React.FC<{ p: Phase }> = ({ p }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(f, [0, 100], [1.08, 1], { extrapolateRight: "clamp" });
  const s = spring({ frame: f - 8, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <Img src={staticFile(p.art)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(15,27,45,.92) 0%, rgba(15,27,45,.7) 45%, rgba(15,27,45,0) 75%)" }} />
      <div style={{ position: "absolute", left: 80, top: 210, color: "#fff", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
        <div style={{ font: "800 28px BC", color: AMBER, letterSpacing: 1 }}>FASE {p.n} DE 6 · {p.bloom.toUpperCase()}</div>
        <div style={{ font: "800 85px BC", lineHeight: 1, marginTop: 12, maxWidth: 640 }}>{p.title}</div>
        <div style={{ font: "600 28px B", color: "#D6DEEA", marginTop: 22 }}>Codi 3 · Parla com el SEM</div>
      </div>
    </AbsoluteFill>
  );
};

const Steps: React.FC<{ p: Phase }> = ({ p }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: PAPER, padding: "80px 90px", flexDirection: "row", gap: 60 }}>
      <div style={{ flex: 1.3 }}>
        <div style={{ font: "800 52px BC", color: NAVY }}>Què faràs</div>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 26 }}>
          {p.steps.map((t, i) => {
            const s = spring({ frame: f - 10 - i * 22, fps, config: { damping: 200 } });
            return (
              <div key={t} style={{ display: "flex", gap: 24, alignItems: "center", opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: NAVY, color: AMBER, font: "700 34px JB", display: "grid", placeItems: "center", flex: "none" }}>{i + 1}</div>
                <div style={{ font: "600 35px B", color: NAVY, lineHeight: 1.2 }}>{t}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex: 1, background: NAVY, borderRadius: 28, padding: 44, color: "#fff", alignSelf: "center" }}>
        <div style={{ font: "800 33px BC", color: AMBER }}>Controls</div>
        {p.controls.map(([k, v], i) => {
          const s = spring({ frame: f - 60 - i * 15, fps, config: { damping: 200 } });
          return (
            <div key={k} style={{ marginTop: 26, opacity: s }}>
              <span style={{ font: "700 28px JB", background: NAVY7, padding: "6px 14px", borderRadius: 8, border: "2px solid #3A5378" }}>{k}</span>
              <div style={{ font: "600 28px B", color: "#D6DEEA", marginTop: 12 }}>{v}</div>
            </div>
          );
        })}
        {p.id === "f6" ? <Ptt /> : null}
      </div>
    </AbsoluteFill>
  );
};

const Ptt: React.FC = () => {
  const f = useCurrentFrame();
  const down = f % 60 > 15 && f % 60 < 45 && f > 90;
  return (
    <div style={{ marginTop: 30, height: 96, borderRadius: 18, display: "grid", placeItems: "center", font: "800 36px BC", letterSpacing: 4,
      background: down ? "#B3261E" : "#22385A", border: `3px solid ${down ? "#FF5A4E" : "#3A5378"}`, transform: `scale(${down ? 0.97 : 1})` }}>
      {down ? "● TX" : "PARLA"}
    </div>
  );
};

const Score: React.FC<{ p: Phase }> = ({ p }) => {
  const f = useCurrentFrame();
  const v = Math.round(interpolate(f, [5, 45], [0, p.points], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
  const s = interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, color: "#fff", alignItems: "center", justifyContent: "center", opacity: s }}>
      <div style={{ font: "700 160px JB", color: AMBER, lineHeight: 1 }}>{v}</div>
      <div style={{ font: "800 38px BC", marginTop: 10 }}>punts en joc</div>
      <div style={{ font: "600 28px B", color: "#A9B6CC", marginTop: 26, maxWidth: 900, textAlign: "center" }}>
        Els errors i les ajudes resten punts. Al segon error veuràs la resposta correcta.
      </div>
      <div style={{ marginTop: 50, font: "800 31px BC", background: AMBER, color: NAVY, padding: "16px 34px", borderRadius: 14 }}>Prem «Comença la fase»</div>
    </AbsoluteFill>
  );
};

export const Capsule: React.FC<{ phase: string }> = ({ phase }) => {
  const p = PHASES.find((x) => x.id === phase) ?? PHASES[0];
  const { fps } = useVideoConfig();
  const total = Math.ceil((DUR[p.id] + 1.2) * fps);
  const t1 = 100, t3 = 110, t2 = total - t1 - t3;
  return (
    <AbsoluteFill>
      <Fonts />
      <Sequence from={8}><Audio src={staticFile(`nar-${p.id}.mp3`)} /></Sequence>
      <Sequence durationInFrames={t1}><Title p={p} /></Sequence>
      <Sequence from={t1} durationInFrames={t2}><Steps p={p} /></Sequence>
      <Sequence from={t1 + t2} durationInFrames={t3}><Score p={p} /></Sequence>
    </AbsoluteFill>
  );
};

export const MyComposition = () => (
  <>
    {PHASES.map((p) => (
      <Composition key={p.id} id={`capsula-${p.id}`} component={Capsule} durationInFrames={Math.ceil((DUR[p.id] + 1.2) * 30)} fps={30} width={1280} height={720} defaultProps={{ phase: p.id }} />
    ))}
  </>
);
