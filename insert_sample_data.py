from pymongo import MongoClient
from bson import ObjectId

# Connect to MongoDB (make sure mongod service is running)
client = MongoClient("mongodb://localhost:27017/")

# Create/use database
db = client["smartVoting"]

# Collections
voters = db["voters"]
candidates = db["candidates"]
votes = db["votes"]

# Insert one voter
voter_id = voters.insert_one({
    "name": "Alice",
    "email": "alice@example.com",
    "password_hash": "hashed_password_here",
    "face_encoding": [0.1, 0.23, 0.45, 0.67]  # dummy numbers
}).inserted_id

print(f"Inserted voter with _id: {voter_id}")

# Insert one candidate
candidate_id = candidates.insert_one({
    "name": "John Doe",
    "bio": "Candidate for City Mayor"
}).inserted_id

print(f"Inserted candidate with _id: {candidate_id}")

# Insert a vote linking voter → candidate
vote_id = votes.insert_one({
    "voter_id": voter_id,
    "candidate_id": candidate_id
}).inserted_id

print(f"Inserted vote with _id: {vote_id}")

