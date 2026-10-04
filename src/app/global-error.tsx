"use client";

/** Last-resort error boundary (replaces the root layout, so it must render <html>). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-PK">
      <body style={{ margin: 0, background: "#fbf8f3", color: "#2a2826", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
          <div>
            <p style={{ letterSpacing: "0.3em", fontSize: 28, margin: 0 }}>AURAQ</p>
            <h1 style={{ fontWeight: 400, fontSize: 32, margin: "40px 0 12px" }}>Something went wrong</h1>
            <p style={{ color: "#57524c", margin: "0 0 28px" }}>Please refresh the page or try again shortly.</p>
            <button type="button" onClick={reset} style={{ background: "#2a2826", color: "#fbf8f3", border: 0, padding: "14px 32px", letterSpacing: "0.18em", textTransform: "uppercase", fontSize: 13, cursor: "pointer" }}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
