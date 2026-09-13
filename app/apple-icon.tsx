import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Home-screen icon for iOS.
 *
 * Deliberately the monogram rather than the full club seal. iOS composites a
 * transparent PNG onto black — which would fight the navy identity — and the
 * seal's fine engraving is illegible at 180px anyway. Drawing it here gives a
 * flat, opaque, on-palette mark that survives being shrunk to a home screen.
 * The seal itself still appears in the header, footer, and favicon.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1735",
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#f1eee4",
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          TJ
        </div>
        <div style={{ display: "flex", width: 76, height: 10, background: "#f0a91d", marginTop: 12 }} />
      </div>
    ),
    size,
  );
}
