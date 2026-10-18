// Part 1: React component for API Time Machine
import { useState } from "react";
import "./App.css";

const DEFAULT_URL = "https://jsonplaceholder.typicode.com/users/1";

function App() {
  // Stores the HTTP method selected by the user.
  const [method, setMethod] = useState("GET");

  // Stores the target API URL.
  const [url, setUrl] = useState(DEFAULT_URL);

  // Stores whether a request is currently running.
  const [loading, setLoading] = useState(false);

  // Stores the response details after a request finishes.
  const [result, setResult] = useState(null);

  // Stores a readable error message.
  const [error, setError] = useState("");

  async function sendRequest() {
    // Reset the previous result before sending a new request.
    setLoading(true);
    setResult(null);
    setError("");

    const startedAt = performance.now();

    try {
      // For now, send the request through our backend.
      // We'll implement this endpoint in FastAPI in Part B.
      const response = await fetch("http://localhost:8000/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
          url,
        }),
      });

      const data = await response.json();
      const clientDuration = performance.now() - startedAt;

      if (!response.ok) {
        throw new Error(data.detail || "The backend request failed.");
      }

      setResult({
        ...data,
        clientDuration: clientDuration.toFixed(2),
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect. Check that the FastAPI backend is running."
      );
    } finally {
      // Runs whether the request succeeds or fails.
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">AT</div>
          <div>
            <h1>API Time Machine</h1>
            <p>Inspect. Measure. Replay.</p>
          </div>
        </div>

        <span className="version">DEVELOPER TOOL</span>
      </header>

      <section className="intro">
        <p className="eyebrow">HTTP WORKSPACE</p>
        <h2>Understand every request.</h2>
        <p>
          Send an API request and inspect its response, status, and timing.
        </p>
      </section>

      <section className="panel request-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">01 / REQUEST</p>
            <h3>Request builder</h3>
          </div>
          <span className="method-label">{method}</span>
        </div>

        <div className="request-controls">
          <select
            aria-label="HTTP method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            aria-label="Target API URL"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.example.com/resource"
          />

          <button
            className="send-button"
            onClick={sendRequest}
            disabled={loading || !url.trim()}
          >
            {loading ? "Sending..." : "Send request"}
            {!loading && <span aria-hidden="true"> ↗</span>}
          </button>
        </div>

        <p className="helper-text">
          Requests are sent through the local FastAPI backend.
        </p>
      </section>

      <section className="response-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / RESPONSE</p>
            <h3>Response inspector</h3>
          </div>
          {result && (
            <span
              className={`status ${
                result.status >= 200 && result.status < 300
                  ? "status-success"
                  : "status-error"
              }`}
            >
              HTTP {result.status}
            </span>
          )}
        </div>

        {loading && (
          <div className="empty-state">
            <div className="loader" />
            <p>Waiting for the target API...</p>
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>Request failed</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="empty-state">
            <span className="empty-symbol">↗</span>
            <h3>No response yet</h3>
            <p>Send a request to see its response and timing measurements.</p>
          </div>
        )}

        {result && (
          <>
            <div className="metrics-grid">
              <div className="metric">
                <span>Target duration</span>
                <strong>{result.targetDurationMs} ms</strong>
                <small>Measured by FastAPI</small>
              </div>

              <div className="metric">
                <span>Client duration</span>
                <strong>{result.clientDuration} ms</strong>
                <small>Browser round trip to backend</small>
              </div>

              <div className="metric">
                <span>Response size</span>
                <strong>{result.responseSizeBytes} B</strong>
                <small>Response body size</small>
              </div>
            </div>

            <div className="panel response-panel">
              <div className="response-toolbar">
                <h3>Response body</h3>
                <span>JSON / TEXT</span>
              </div>

              <pre className="response-body">
                {JSON.stringify(result.body, null, 2)}
              </pre>
            </div>

            <details className="panel headers-panel">
              <summary>Response headers</summary>
              <pre className="response-body">
                {JSON.stringify(result.headers, null, 2)}
              </pre>
            </details>
          </>
        )}
      </section>

      <footer>
        API Time Machine <span>·</span> Built to understand HTTP, not hide it.
      </footer>
    </main>
  );
}

export default App;