import React, { useEffect, useState } from "react";

function Results() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Step 1: Check election status first
    fetch("http://localhost:5000/election_status")
      .then((res) => res.json())
      .then((data) => {
        if (data.election_status === "open") {
          setStatus("open");
          setError("⚠️ Election is still open. Results will be available once it is closed.");
          setLoading(false);
        } else if (data.election_status === "closed") {
          setStatus("closed");
          // Step 2: Fetch results if closed
          fetch("http://localhost:5000/results")
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) {
                setResults(data);
              } else {
                setError(data.error || "No results available");
              }
              setLoading(false);
            })
            .catch((err) => {
              setError(err.message);
              setLoading(false);
            });
        }
      })
      .catch((err) => {
        setError("Error checking election status: " + err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>🗳️ Election Results</h2>

      {loading && <p>Loading...</p>}

      {!loading && error && (
        <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
      )}

      {!loading && status === "closed" && results.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {results.map((r) => (
            <li
              key={r.candidate_id}
              style={{
                background: "#f4f4f4",
                margin: "10px 0",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              <strong>{r.candidate_name}</strong> — {r.votes} votes
            </li>
          ))}
        </ul>
      )}

      {!loading && status === "closed" && results.length === 0 && !error && (
        <p>No votes recorded yet.</p>
      )}
    </div>
  );
}

export default Results;


