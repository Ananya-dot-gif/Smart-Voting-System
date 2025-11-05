import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState("");
  const [voterName, setVoterName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch candidates from backend
  useEffect(() => {
    fetch("http://localhost:5000/candidates")
      .then((res) => res.json())
      .then((data) => setCandidates(data))
      .catch((err) => console.error("Error fetching candidates:", err));
  }, []);

  // Function to speak text using Web Speech API
  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis not supported in this browser.");
    }
  };

  const submitVote = async () => {
    if (!voterName.trim()) {
      alert("⚠️ Please enter your name before voting.");
      return;
    }
    if (!selected) {
      alert("⚠️ Please select a candidate.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voter_name: voterName.trim(),
          candidate_id: selected,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 🔊 Speak confirmation
        speakText(`Voter ${voterName.trim()}, your voting is completed.`);

        alert("✅ Your vote has been recorded!");

        // Reset state
        setSelected("");
        setVoterName("");

        // 👉 Redirect to results page
        navigate("/results");
      } else {
        alert("❌ Vote failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
      alert("⚠️ Error submitting vote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        background: "linear-gradient(to right, #74ebd5, #ACB6E5)",
        minHeight: "100vh",
        padding: "20px",
        color: "#333",
      }}
    >
      <h2 style={{ color: "#222", marginBottom: "20px" }}>🗳️ Cast Your Vote</h2>

      {/* Voter Name Input */}
      <input
        type="text"
        placeholder="Enter Your Name"
        value={voterName}
        onChange={(e) => setVoterName(e.target.value)}
        style={{
          padding: "10px",
          width: "250px",
          marginBottom: "20px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />

      {/* Candidate Cards */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        {candidates.map((c) => (
          <div
            key={c._id}
            style={{
              background: selected === c._id ? "#ffeaa7" : "#fff",
              border:
                selected === c._id ? "3px solid #ff7f50" : "2px solid #0984e3",
              borderRadius: "12px",
              padding: "15px",
              width: "200px",
              textAlign: "center",
              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onClick={() => setSelected(c._id)}
          >
            <img
              src={c.symbol || "https://via.placeholder.com/150"}
              alt={c.name}
              style={{
                width: "100%",
                height: "150px",
                objectFit: "contain",
                borderRadius: "8px",
                marginBottom: "10px",
                backgroundColor: "#f0f0f0",
              }}
            />
            <h3>{c.name}</h3>
            <input
              type="radio"
              name="candidate"
              checked={selected === c._id}
              onChange={() => setSelected(c._id)}
            />
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <button
        onClick={submitVote}
        disabled={loading}
        style={{
          marginTop: "30px",
          padding: "12px 24px",
          background: loading ? "#b2bec3" : "#0984e3",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "0.3s",
        }}
        onMouseOver={(e) =>
          !loading && (e.target.style.background = "#74b9ff")
        }
        onMouseOut={(e) =>
          !loading && (e.target.style.background = "#0984e3")
        }
      >
        {loading ? "⏳ Submitting..." : "✅ Submit Vote"}
      </button>
    </div>
  );
}

export default Vote;
