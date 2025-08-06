import pandas as pd
from pymongo import MongoClient
from bson.objectid import ObjectId
import datetime

# --- Configuration ---
MONGO_URI = "mongodb://localhost:27017/" # Your MongoDB connection URI
DATABASE_NAME = "splitwise"     # Name of your database
COLLECTION_NAME = "personalexpenses"             # Name of your collection
CSV_FILE_PATH = "Notebook/expense3.csv"      # Path to your CSV file
# Replace with an actual user ID from your system, or generate a placeholder
# If you have a 'users' collection, you'd fetch an ID from there.
# For a simple import, you might use a fixed placeholder ID.
PLACEHOLDER_USER_ID = ObjectId("687bfd482915b868e67d3c96")

# --- Connect to MongoDB ---
try:
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    print(f"Connected to MongoDB database: '{DATABASE_NAME}'")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    exit()

# --- Load CSV Data ---
try:
    df = pd.read_csv(CSV_FILE_PATH)
    print(f"Loaded {len(df)} rows from '{CSV_FILE_PATH}'")
except FileNotFoundError:
    print(f"Error: CSV file not found at '{CSV_FILE_PATH}'")
    exit()
except Exception as e:
    print(f"Error reading CSV: {e}")
    exit()

# --- Prepare Data for MongoDB ---
mongo_documents = []
for index, row in df.iterrows():
    try:
        # Parse date from DD-MM-YYYY string to datetime object
        # Ensure 'Date' column is treated as string to avoid issues with pd.to_datetime
        date_str = str(row['Date'])
        parsed_date = datetime.datetime.strptime(date_str, '%d-%m-%Y')

        document = {
            # '_id': ObjectId(), # MongoDB will generate this automatically
            "userId": PLACEHOLDER_USER_ID,
            "description": row['Expense'],
            "amount": float(row['Amount']), # Ensure amount is a number
            "date": parsed_date,             # Stored as datetime object
            "type" : row['Cr_Dr'].lower(),
            "notes": row['Description'],
            "category": row['Category'],
            "createdAt": datetime.datetime.utcnow(), # Current UTC time for creation
            "__v": 0 # Optional: if you need this for Mongoose compatibility
        }
        print(f"Processed row {index}: {document}")
        mongo_documents.append(document)
    except ValueError as ve:
        print(f"Error parsing date or amount for row {index}: {row.to_dict()} - {ve}")
    except KeyError as ke:
        print(f"Missing expected column for row {index}: {ke}. Row: {row.to_dict()}")
    except Exception as e:
        print(f"An unexpected error occurred processing row {index}: {e}. Row: {row.to_dict()}")

# --- Insert Data into MongoDB ---
if mongo_documents:
    try:
        result = collection.insert_many(mongo_documents)
        print(f"Successfully inserted {len(result.inserted_ids)} documents into '{COLLECTION_NAME}' collection.")
    except Exception as e:
        print(f"Error inserting documents into MongoDB: {e}")
else:
    print("No valid documents to insert.")

# --- Close Connection ---
client.close()
print("MongoDB connection closed.")