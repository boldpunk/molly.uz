"use client";

// Last line of defence: this replaces the whole document when the root layout
// itself fails, so it carries its own html/body and cannot rely on globals.css
// having loaded.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9e8d8",
          color: "#182b4c",
          fontFamily: "Montserrat, system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
            Сайт временно недоступен
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 15,
              lineHeight: 1.6,
              color: "rgba(24,43,76,0.7)",
            }}
          >
            Мы уже разбираемся. Попробуйте обновить страницу через минуту.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: "#182b4c",
              color: "#f9e8d8",
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: 24,
                fontSize: 11,
                fontFamily: "ui-monospace, monospace",
                color: "rgba(24,43,76,0.35)",
              }}
            >
              Код ошибки: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
