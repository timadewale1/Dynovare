import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dynovare policy intelligence platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top left, rgba(143,211,255,0.42), transparent 34%), radial-gradient(circle at top right, rgba(86,199,163,0.22), transparent 28%), linear-gradient(180deg, #f5fbff 0%, #fbfdff 26%, #ffffff 100%)",
          fontFamily: "sans-serif",
          color: "#0d1d2d",
          padding: "52px 56px",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-80px",
            top: "72px",
            width: "280px",
            height: "280px",
            borderRadius: "999px",
            background: "rgba(139, 215, 199, 0.24)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-60px",
            top: "60px",
            width: "320px",
            height: "320px",
            borderRadius: "999px",
            background: "rgba(143, 199, 255, 0.24)",
            filter: "blur(20px)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: "68%", zIndex: 2 }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "22px" }}>
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(11,60,93,0.08)",
                fontSize: "22px",
                fontWeight: 700,
                color: "#0b3c5d",
              }}
            >
              Grant-ready policy intelligence
            </div>
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(11,60,93,0.08)",
                fontSize: "22px",
                fontWeight: 700,
                color: "#0b3c5d",
              }}
            >
              Nigeria-first energy workflows
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" }}>
            <div
              style={{
                display: "flex",
                width: "72px",
                height: "72px",
                borderRadius: "22px",
                background: "linear-gradient(135deg,#091a28 0%,#0d4760 46%,#178e83 100%)",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "32px",
                fontWeight: 900,
              }}
            >
              D
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "40px", fontWeight: 900, color: "#0b3c5d" }}>Dynovare</div>
              <div style={{ fontSize: "22px", color: "#61758a" }}>Policy intelligence for drafting, critique, simulation, and export</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "62px",
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#0b3c5d",
              maxWidth: "760px",
            }}
          >
            Build sharper energy policy with evidence, critique, simulation, and export-ready design.
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "24px",
              fontSize: "28px",
              lineHeight: 1.35,
              color: "#61758a",
              maxWidth: "770px",
            }}
          >
            Explore public policy signals across Nigeria, compare state performance, draft stronger interventions, and export polished policy documents your team can actually use.
          </div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            width: "32%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "34px",
              background: "linear-gradient(135deg,#091a28 0%,#0d4760 46%,#178e83 100%)",
              color: "white",
              padding: "28px",
              boxShadow: "0 24px 60px rgba(8,31,48,0.18)",
            }}
          >
            <div style={{ fontSize: "18px", textTransform: "uppercase", letterSpacing: "0.18em", opacity: 0.7 }}>
              Your workflow
            </div>
            <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                "Discover public policy signals",
                "Draft inside Policy Studio",
                "Stress-test with AI critique and simulation",
                "Export styled policy documents",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    borderRadius: "22px",
                    background: "rgba(255,255,255,0.1)",
                    padding: "14px 16px",
                    fontSize: "22px",
                    lineHeight: 1.25,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              marginTop: "18px",
            }}
          >
            {["Repository", "Rankings", "Policy Studio"].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  padding: "12px 18px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(11,60,93,0.08)",
                  color: "#0b3c5d",
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
