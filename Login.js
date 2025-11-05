// src/pages/Login.js
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  // Fetch CAPTCHA with cache-busting
  const fetchCaptcha = () => {
    setCaptchaUrl(`http://localhost:5000/captcha?cb=${new Date().getTime()}`);
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("⚠️ Unable to access camera.");
    }
  };

  // Capture photo from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg");
    setCapturedImage(base64);
    return base64;
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!name || !password || !captchaInput) {
      alert("⚠️ Please fill in all fields including CAPTCHA.");
      return;
    }

    if (!cameraActive) {
      alert("⚠️ Please start the camera before logging in.");
      return;
    }

    const photoBase64 = capturePhoto();
    if (!photoBase64) {
      alert("⚠️ Failed to capture photo. Try again.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          password,
          image: photoBase64,
          captcha_input: captchaInput.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "login success") {
        alert("✅ Login successful!");
        navigate("/vote", { state: { userName: name } });
      } else {
        alert("❌ " + (data.error || "Login failed."));
        fetchCaptcha(); // reload CAPTCHA
        setCaptchaInput("");
      }
    } catch (err) {
      console.error("Error logging in:", err);
      alert("⚠️ Server error while logging in.");
    }
  };

  return (
    <div className="flag">
      <div className="band saffron"></div>
      <div className="band white">
        <div className="flag-card">
          <img src="/chakra.png" alt="Ashoka Chakra" className="chakra" />
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <input
              className="flag-input"
              type="text"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="flag-input"
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* CAPTCHA Section */}
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              {captchaUrl && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img
                    src={captchaUrl}
                    alt="CAPTCHA"
                    onClick={fetchCaptcha}
                    crossOrigin="use-credentials"
                    style={{
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      width: "320px",
                      height: "120px",
                      marginBottom: "8px",
                      cursor: "pointer",
                      objectFit: "contain", // ensures the image fits the box
                      boxShadow: "0 0 5px rgba(0,0,0,0.2)",
                    }}
                    title="Click to refresh CAPTCHA"
                  />
                  <span style={{ fontSize: "13px", color: "#555" }}>
                    🔄 Click image to refresh CAPTCHA
                  </span>
                </div>
              )}
            </div>

            <input
              className="flag-input"
              type="text"
              placeholder="Enter CAPTCHA"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
            />

            {/* Webcam Section */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", borderRadius: "8px", marginBottom: "12px" }}
            />

            <button
              type="button"
              onClick={startCamera}
              className="flag-btn"
              style={{ marginBottom: "10px" }}
            >
              Start Camera
            </button>
            <button type="submit" className="flag-btn">
              Login
            </button>
          </form>

          {capturedImage && (
            <div style={{ marginTop: "15px" }}>
              <h4 style={{ marginBottom: "6px" }}>Captured Image:</h4>
              <img
                src={capturedImage}
                alt="captured"
                style={{ width: "200px", borderRadius: "6px" }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="band green"></div>
    </div>
  );
}

export default Login;
