from flask import Flask, request, jsonify, session, make_response
from flask_pymongo import PyMongo
from bson import ObjectId
from bson.errors import InvalidId
import face_recognition
import numpy as np
import bcrypt
from flask_cors import CORS
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random
import string
import io
import os
import re  # ✅ For email validation

# -------------------------
# Setup Flask + MongoDB
# -------------------------
app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/smartVoting"
app.secret_key = "your_secret_key_here"
mongo = PyMongo(app)

# Enable CORS
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# -------------------------
# Collections
# -------------------------
voters = mongo.db.voters
candidates = mongo.db.candidates
votes = mongo.db.votes
election = mongo.db.election

# -------------------------
# Helper Functions
# -------------------------
def to_json(data):
    if isinstance(data, list):
        return [to_json(item) for item in data]
    elif isinstance(data, dict):
        return {k: str(v) if isinstance(v, ObjectId) else v for k, v in data.items()}
    return data

def decode_base64_image(image_base64):
    if not image_base64:
        raise ValueError("Empty image string")
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    return Image.open(BytesIO(base64.b64decode(image_base64)))

def is_valid_email(email):
    """✅ Validate email format"""
    email_regex = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    return re.match(email_regex, email)

# -------------------------
# CAPTCHA Generator
# -------------------------
def generate_captcha_text(length=5):
    letters = string.ascii_uppercase + string.digits
    captcha_text = ''.join(random.choice(letters) for _ in range(length))
    session['captcha_text'] = captcha_text
    session.modified = True
    return captcha_text

def generate_captcha_image(captcha_text):
    width, height = 300, 100
    image = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)

    font_path = os.path.join("fonts", "arialbd.ttf")
    try:
        font = ImageFont.truetype(font_path, 60)
    except:
        font = ImageFont.load_default()

    for y in range(height):
        r = 255 - int(y * 0.8)
        g = 200 - int(y * 1.2)
        b = 255 - int(y * 0.5)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    x_offset = 20
    for char in captcha_text:
        color = (
            random.randint(0, 150),
            random.randint(0, 150),
            random.randint(0, 150),
        )
        char_img = Image.new("RGBA", (80, 80), (255, 255, 255, 0))
        char_draw = ImageDraw.Draw(char_img)
        char_draw.text((10, 5), char, font=font, fill=color)
        rotated = char_img.rotate(random.uniform(-20, 20), expand=1)
        image.paste(rotated, (x_offset, 10), rotated)
        x_offset += 50

    image = image.filter(ImageFilter.GaussianBlur(0.6))
    buf = io.BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    return buf

@app.route("/captcha", methods=["GET"])
def serve_captcha():
    try:
        captcha_text = generate_captcha_text()
        buf = generate_captcha_image(captcha_text)
        response = make_response(buf.getvalue())
        response.headers['Content-Type'] = 'image/png'
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Routes
# -------------------------
@app.route("/")
def home():
    return "✅ Smart Voting Backend Running"

@app.route("/testdb")
def testdb():
    return jsonify(to_json(list(voters.find())))

# -------------------------
# Election Status
# -------------------------
@app.route("/election_status", methods=["POST"])
def set_election_status():
    try:
        data = request.json
        status = data.get("status", "").lower()
        if status not in ["open", "closed"]:
            return jsonify({"error": "Status must be 'open' or 'closed'"}), 400
        election.update_one({"name": "main_election"}, {"$set": {"election_status": status}}, upsert=True)
        return jsonify({"message": f"Election {status} successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/election_status", methods=["GET"])
def get_election_status():
    try:
        status_doc = election.find_one({"name": "main_election"})
        return jsonify({"election_status": status_doc.get("election_status", "open") if status_doc else "open"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Register Voter (UPDATED)
# -------------------------
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        required_fields = ["name", "email", "phone", "password", "image"]
        if not data or any(key not in data for key in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        name = data["name"].strip()
        email = data["email"].strip()
        phone = data["phone"].strip()
        password = data["password"].strip()
        img = decode_base64_image(data["image"])

        # ✅ Validate phone number
        if not phone.isdigit() or len(phone) != 10:
            return jsonify({"error": "Phone number must be exactly 10 digits"}), 400

        # ✅ Validate email format
        if not is_valid_email(email):
            return jsonify({"error": "Invalid email address. Must contain '@' and a valid domain."}), 400

        # ✅ Check duplicates
        if voters.find_one({"$or": [{"email": email}, {"phone": phone}]}):
            return jsonify({"error": "User with same email or phone already exists"}), 400

        # ✅ Face encoding
        img_np = np.array(img)
        encodings = face_recognition.face_encodings(img_np)
        if len(encodings) != 1:
            return jsonify({"error": "Image must contain exactly one face"}), 400
        new_encoding = encodings[0]

        # ✅ Face uniqueness check
        for voter in voters.find():
            stored_encoding = np.array(voter["face_encoding"])
            if face_recognition.face_distance([stored_encoding], new_encoding)[0] < 0.45:
                return jsonify({"error": "Face already registered with another user"}), 400

        # ✅ Hash password
        hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # ✅ Insert voter
        voters.insert_one({
            "name": name,
            "email": email,
            "phone": phone,
            "password_hash": hashed_pw,
            "face_encoding": new_encoding.tolist()
        })
        return jsonify({"status": "registered"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Add Candidate / Get Candidates
# -------------------------
@app.route("/add_candidate", methods=["POST"])
def add_candidate():
    try:
        data = request.json
        if not data or "name" not in data:
            return jsonify({"error": "Missing candidate name"}), 400
        candidates.insert_one({"name": data["name"].strip(), "bio": data.get("bio", "").strip()})
        return jsonify({"status": "candidate added"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/candidates", methods=["GET"])
def get_candidates():
    try:
        return jsonify(to_json(list(candidates.find())))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Login
# -------------------------
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        required_fields = ["name", "password", "image", "captcha_input"]
        if not data or any(key not in data for key in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        if data["captcha_input"].upper() != session.get("captcha_text", ""):
            return jsonify({"error": "Incorrect CAPTCHA"}), 400

        voter = voters.find_one({"name": data["name"].strip()})
        if not voter:
            return jsonify({"error": "User not found"}), 404

        if not bcrypt.checkpw(data["password"].encode("utf-8"), voter["password_hash"].encode("utf-8")):
            return jsonify({"error": "Wrong password"}), 401

        login_img = decode_base64_image(data["image"])
        encodings = face_recognition.face_encodings(np.array(login_img))
        if len(encodings) != 1:
            return jsonify({"error": "Image must contain exactly one face"}), 400

        if face_recognition.face_distance([np.array(voter["face_encoding"])], encodings[0])[0] >= 0.45:
            return jsonify({"error": "Face does not match"}), 401

        return jsonify({"status": "login success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Vote and Results
# -------------------------
@app.route("/vote", methods=["POST"])
def vote():
    try:
        status_doc = election.find_one({"name": "main_election"})
        if status_doc and status_doc.get("election_status") == "closed":
            return jsonify({"success": False, "error": "Election is closed"}), 403

        data = request.json
        if not data or "voter_name" not in data or "candidate_id" not in data:
            return jsonify({"success": False, "error": "Missing voter_name or candidate_id"}), 400

        voter = voters.find_one({"name": data["voter_name"].strip()})
        if not voter:
            return jsonify({"success": False, "error": "Voter not found"}), 404

        if votes.find_one({"voter_id": voter["_id"]}):
            return jsonify({"success": False, "error": "Already voted"}), 400

        try:
            candidate_obj_id = ObjectId(data["candidate_id"].strip())
        except InvalidId:
            return jsonify({"success": False, "error": "Invalid candidate ID"}), 400

        votes.insert_one({"voter_id": voter["_id"], "candidate_id": candidate_obj_id})
        return jsonify({"success": True, "message": "Vote recorded"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/results", methods=["GET"])
def results():
    try:
        status_doc = election.find_one({"name": "main_election"})
        if not status_doc or status_doc.get("election_status") != "closed":
            return jsonify({"error": "Election is still open or not set. Results not available."}), 400

        pipeline = [{"$group": {"_id": "$candidate_id", "total": {"$sum": 1}}}, {"$sort": {"total": -1}}]
        results_list = list(votes.aggregate(pipeline))

        final_results = []
        for r in results_list:
            cand = candidates.find_one({"_id": r["_id"]})
            final_results.append({
                "candidate_id": str(r["_id"]),
                "candidate_name": cand["name"] if cand else "Unknown",
                "votes": r["total"]
            })

        return jsonify(final_results or {"message": "No votes have been cast yet."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Run Server
# -------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)

