// src/pages/Register.js
import React, { useRef, useState, useEffect } from "react";

function Register() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Step state: 1 = Info, 2 = Face Capture
  const [currentStep, setCurrentStep] = useState(1);

  // User info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Camera state
  const [cameraStarted, setCameraStarted] = useState(false);

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraStarted(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("⚠️ Unable to access camera. Please check permissions.");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture photo and convert to base64
  const capturePhoto = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  // Validate phone number
  const validatePhone = (num) => /^[0-9]{10}$/.test(num);

  // Validate email format (must contain '@')
  const validateEmail = (mail) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(mail) && mail.includes("@");
  };

  // Move to next step (info → face capture)
  const handleNextStep = () => {
    if (!name || !email || !phone || !password) {
      alert("⚠️ Please fill in all fields (Name, Email, Phone, Password).");
      return;
    }

    if (!validateEmail(email)) {
      alert("⚠️ Please enter a valid email address containing '@'.");
      return;
    }

    if (!validatePhone(phone)) {
      alert("⚠️ Phone number must be exactly 10 digits.");
      return;
    }

    setCurrentStep(2);
  };

  // Handle final registration
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!cameraStarted) {
      alert("⚠️ Please start the camera before capturing your face.");
      return;
    }

    const photoBase64 = capturePhoto();
    if (!photoBase64) {
      alert("⚠️ Unable to capture photo. Try again.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          image: photoBase64,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "registered") {
        alert("✅ Registration successful!");
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setCameraStarted(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setCurrentStep(1);
      } else {
        alert("❌ Registration failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error registering:", err);
      alert("⚠️ Error during registration. Please try again.");
    }
  };

  return (
    <div className="flag">
      <div className="band saffron"></div>
      <div className="band white">
        <div className="flag-card">
          <img src="/chakra.png" alt="Ashoka Chakra" className="chakra" />
          <h2>Register</h2>

          <form onSubmit={handleRegister}>
            {/* Step 1: User Info */}
            {currentStep === 1 && (
              <>
                <input
                  className="flag-input"
                  type="text"
                  placeholder="Enter Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="flag-input"
                  type="email"
                  placeholder="Enter Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  className="flag-input"
                  type="tel"
                  placeholder="Enter 10-digit Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength="10"
                />
                <input
                  className="flag-input"
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="flag-btn"
                  onClick={handleNextStep}
                >
                  Next
                </button>
              </>
            )}

            {/* Step 2: Face Capture */}
            {currentStep === 2 && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    backgroundColor: "#000",
                  }}
                />
                <div
                  style={{ display: "flex", gap: "10px", marginBottom: "12px" }}
                >
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flag-btn"
                    disabled={cameraStarted}
                  >
                    {cameraStarted ? "Camera Started" : "Start Camera"}
                  </button>
                  <button type="submit" className="flag-btn">
                    Register
                  </button>
                  <button
                    type="button"
                    className="flag-btn"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
      <div className="band green"></div>
    </div>
  );
}

export default Register;

