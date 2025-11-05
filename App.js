import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Vote from "./Vote";
import Results from "./Results";  // ✅ Import Results page

function App() {
  return (
    <Router>
      <div>
        {/* ✅ Simple Navigation Bar */}
        <nav style={{ marginBottom: "20px", textAlign: "center" }}>
          <Link to="/" style={{ margin: "10px" }}>Register</Link>
          <Link to="/login" style={{ margin: "10px" }}>Login</Link>
          <Link to="/vote" style={{ margin: "10px" }}>Vote</Link>
          <Link to="/results" style={{ margin: "10px" }}>Results</Link>
        </nav>

        {/* ✅ Define Routes */}
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/results" element={<Results />} /> {/* ✅ New Results Route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;



