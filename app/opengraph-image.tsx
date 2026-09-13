import { ImageResponse } from "next/og";
import { CLUB } from "@/lib/content/club";

export const alt = "TJ Policy Debate — Thomas Jefferson High School for Science and Technology";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card shown when a link to this site is pasted into Slack, iMessage,
 * Discord, or a search result preview.
 *
 * Drawn rather than shipped as a flat file so it stays in step with the
 * palette, and so the text is real text rather than something re-exported by
 * hand whenever the wording changes.
 *
 * Deliberately no remote font fetch: ImageResponse would have to reach
 * Google Fonts at render time, and a social crawler hitting us during an
 * outage would get a broken card instead of a plain one. The constructivist
 * read here comes from flat colour blocks, the signal diagonal, and scale —
 * none of which depend on the display face.
 */
export default function OpengraphImage() {
  const navy = "#0d1735";
  const signal = "#9e1b12";
  const signalBright = "#ff6b52";
  const paper = "#f1eee4";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: navy,
          padding: 72,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Signal diagonals, cropped by the frame — the same gesture the site
            uses across its dark bands. */}
        <div
          style={{
            position: "absolute",
            top: -240,
            right: 80,
            width: 46,
            height: 1100,
            background: signal,
            transform: "rotate(-24deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -240,
            right: 8,
            width: 14,
            height: 1100,
            background: signal,
            opacity: 0.7,
            transform: "rotate(-24deg)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 56, height: 8, background: signal }} />
          <div
            style={{
              color: signalBright,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            {CLUB.schoolShort}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: paper,
              fontSize: 128,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            <span>Jefferson</span>
            <span style={{ color: signalBright }}>Policy</span>
            <span>Debate</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div
            style={{
              color: "rgba(241,238,228,0.72)",
              fontSize: 28,
              lineHeight: 1.4,
              maxWidth: 720,
            }}
          >
            Year-long research, evidence, and argument — varsity and novice squads on the local, state, and national
            circuits.
          </div>
          <div style={{ display: "flex", width: 160, height: 10, background: signal }} />
        </div>
      </div>
    ),
    size,
  );
}
