from pymongo import MongoClient
from dotenv import dotenv_values
import pandas as pd

config = dotenv_values(".env")

mongodb_client = MongoClient(config["ATLAS_URI"])

def startup_db_client():
    try:
        print("Connecting to MongoDB...")
        database = mongodb_client[config["DB_NAME"]]
        print("Connected to the MongoDB database!")

        personal_expenses_collection = database['personalexpenses']
        all_documents = list(personal_expenses_collection.find({}))
        print(all_documents)
        for expense in all_documents:
            print([expense[k] for k in ['userId', 'category']])
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        mongodb_client.close()


