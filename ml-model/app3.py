import os
import pandas as pd
from prophet import Prophet
import joblib
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import warnings

# Suppress Prophet's informational messages
warnings.filterwarnings('ignore', category=FutureWarning)

# --- Configuration ---
app = Flask(__name__)
MONGO_URI = "mongodb://127.0.0.1:27017/" 
DB_NAME = "splitwise" 
COLLECTION_NAME = "personalexpenses"

# Directory to save user-specific models
MODEL_DIR = "user_models"
os.makedirs(MODEL_DIR, exist_ok=True)

# --- Database Connection ---
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    print("Successfully connected to MongoDB.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    # Exit if we can't connect to the DB
    exit()


# --- API Endpoint ---
@app.route('/predict/<string:userId>', methods=['GET'])
def predict_user_expenses(userId):
    """
    Predicts future expenses for a given user ID.
    It trains a model on the user's data and caches it for future requests.
    """
    try:
        # Check if the provided userId is a valid MongoDB ObjectId
        user_object_id = ObjectId(userId)
    except Exception:
        return jsonify({"error": "Invalid userId format"}), 400

    model_path = os.path.join(MODEL_DIR, f'{userId}_model.pkl')
    model = None

    # 1. Check for a cached model for this user
    if os.path.exists(model_path):
        print(f"Loading cached model for user {userId}")
        try:
            model = joblib.load(model_path)
        except Exception as e:
            print(f"Error loading model: {e}. Retraining...")
            model = None

    # 2. If no cached model, train a new one
    if model is None:
        print(f"No cached model found. Training a new model for user {userId}")
        
        # Fetch data for the specific user from MongoDB
        cursor = collection.find({"userId": user_object_id})
        user_data = list(cursor)

        # We need at least a few data points to train a model
        if len(user_data) < 10:
            return jsonify({
                "error": "Not enough historical data to make a prediction for this user.",
                "data_points": len(user_data)
            }), 404

        # Convert to pandas DataFrame
        df = pd.DataFrame(user_data)

        # Prepare data for Prophet: it requires columns 'ds' (date) and 'y' (value)
        # Your 'date' field from mongo is already a datetime object in pymongo
        df_prophet = df[['date', 'amount']].rename(columns={'date': 'ds', 'amount': 'y'})

        # Initialize and train the Prophet model
        m = Prophet(daily_seasonality=True)
        model = m.fit(df_prophet)

        # Save the newly trained model for future use
        print(f"Saving new model for user {userId} to {model_path}")
        joblib.dump(model, model_path)

    # 3. Make future predictions
    # Create dataframes for future dates
    future_week = model.make_future_dataframe(periods=7)
    future_month = model.make_future_dataframe(periods=30)
    
    # Generate forecasts
    forecast_week = model.predict(future_week)
    forecast_month = model.predict(future_month)

    # 4. Calculate the sum of predicted expenses for the future period
    # Get today's date to filter out past predictions
    today = pd.to_datetime(datetime.now().strftime("%Y-%m-%d"))
    
    # Sum predictions for the next 7 days
    next_week_forecast = forecast_week[forecast_week['ds'] > today]
    next_week_expense_sum = next_week_forecast['yhat'].sum()

    # Sum predictions for the next 30 days
    next_month_forecast = forecast_month[forecast_month['ds'] > today]
    next_month_expense_sum = next_month_forecast['yhat'].sum()
    
    # Predictions shouldn't be negative for expenses
    next_week_expense_sum = max(0, next_week_expense_sum)
    next_month_expense_sum = max(0, next_month_expense_sum)

    # 5. Return the result
    return jsonify({
        "userId": userId,
        "prediction": {
            "next_week_total_expense": round(next_week_expense_sum, 2),
            "next_month_total_expense": round(next_month_expense_sum, 2)
        },
        "model_status": "loaded_from_cache" if os.path.exists(model_path) and model is not None else "newly_trained"
    })

# --- Main execution ---
if __name__ == '__main__':
    # Using host='0.0.0.0' makes the server accessible from your network
    app.run(host='0.0.0.0', port=5001, debug=True)