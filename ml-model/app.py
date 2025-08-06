from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import pandas as pd
import pytz
from prophet import Prophet
from datetime import datetime, timedelta
from anomaly_detector import detect_anomalies_for_user
from sklearn.pipeline import make_pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB setup
client = MongoClient("mongodb://127.0.0.1:27017")  # Adjust if needed
db = client["splitwise"]
collection = db["personalexpenses"]

# Timezone
IST = pytz.timezone('Asia/Kolkata')

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Test database connection
        db.list_collection_names()
        return jsonify({
            "status": "healthy",
            "message": "ML service is running",
            "database": "connected"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Database connection failed",
            "error": str(e)
        }), 500


@app.route('/predict/<user_id>', methods=['GET'])
def predict_expense(user_id):
    try:
        # Get user expenses from MongoDB
        expenses = list(collection.find({"userId": ObjectId(user_id)}))

        if not expenses:
            return jsonify({"error": "No expenses found for this user."}), 404

        # Create DataFrame
        df = pd.DataFrame(expenses)

        # Convert date & amount
        df['date'] = pd.to_datetime(df['date'])
        df = df[['date', 'amount']].rename(columns={'date': 'ds', 'amount': 'y'})

        # Drop NaN, infinite, and non-positive values
        df = df.dropna()
        df = df[df['y'].apply(lambda x: pd.notna(x) and pd.api.types.is_number(x))]
        df = df[df['y'] > 0]

        # Ensure there's enough data
        if len(df) < 10:
            return jsonify({"error": "Not enough data for prediction."}), 400

        # Train Prophet model
        model = Prophet()
        model.fit(df)

        # Create future dataframe for next 30 days
        future = model.make_future_dataframe(periods=30)

        # Predict
        forecast = model.predict(future)

        # Convert forecast dates to IST
        forecast['ds'] = forecast['ds'].dt.tz_localize('UTC').dt.tz_convert(IST)

        # Get today in IST
        today = datetime.now(IST)
        next_week = today + timedelta(days=7)
        next_month = today + timedelta(days=30)

        # Filter predictions
        week_mask = (forecast['ds'] > today) & (forecast['ds'] <= next_week)
        month_mask = (forecast['ds'] > today) & (forecast['ds'] <= next_month)

        week_total = forecast.loc[week_mask, 'yhat'].sum()
        month_total = forecast.loc[month_mask, 'yhat'].sum()

        # Round the values
        week_total = round(week_total, 2)
        month_total = round(month_total, 2)

        # Return prediction
        return jsonify({
            "userId": user_id,
            "prediction": {
                "next_week_total_expense": week_total,
                "next_month_total_expense": month_total
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/budget/<user_id>', methods=['GET'])
def budget_recommendation(user_id):
    try:
        # Fetch user expenses
        expenses = list(collection.find({"userId": ObjectId(user_id)}))

        if not expenses:
            return jsonify({"error": "No expenses found for this user."}), 404

        df = pd.DataFrame(expenses)

        # Ensure required fields
        if 'date' not in df.columns or 'amount' not in df.columns or 'category' not in df.columns:
            return jsonify({"error": "Missing required fields in data."}), 400

        # Convert and localize date
        df['date'] = pd.to_datetime(df['date'])
        df['date'] = df['date'].dt.tz_localize('UTC').dt.tz_convert('Asia/Kolkata')

        # Remove invalid amounts
        df = df.dropna(subset=['amount', 'category'])
        df = df[df['amount'] > 0]

        if df.empty:
            return jsonify({"error": "Not enough valid data for recommendation."}), 400

        # Tag months
        df['month'] = df['date'].dt.to_period('M')

        # Calculate per-month totals per category
        grouped = df.groupby(['category', 'month'])['amount'].sum().reset_index()

        # Calculate monthly average per category
        monthly_avg = grouped.groupby('category')['amount'].mean()

        # Round for output
        budget_recommendation = {cat: round(amt, 2) for cat, amt in monthly_avg.items()}

        response = {
            "userId": user_id,
            "expense_recommendation": budget_recommendation
        }

        # Optional: include a message if data is < 3 months
        unique_months = df['month'].nunique()
        if unique_months < 3:
            response["note"] = f"Only {unique_months} month(s) of data available. Estimates may be less accurate."

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/anomaly/<user_id>', methods=['GET'])
def anomaly(user_id):
    try:
        result = detect_anomalies_for_user(user_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def train_model_from_mongodb():
    # """
    # Train the category prediction model using MongoDB data.
    # """
    # # Connect to MongoDB
    # client = MongoClient("mongodb://localhost:27017/")
    # db = client["your_database_name"]
    # collection = db["your_collection_name"]

    # Fetch records with 'description' and 'category'
    records = list(collection.find({
        "description": {"$exists": True},
        "category": {"$exists": True}
    }))

    if len(records) < 10:
        return None, "Not enough data to train the model."

    # Load into DataFrame
    df = pd.DataFrame(records)
    df['description'] = df['description'].astype(str)
    df['category'] = df['category'].astype(str)

    # Prepare X and y
    X = df['description']
    y = df['category']

    # Train the pipeline
    model = make_pipeline(TfidfVectorizer(), MultinomialNB())
    model.fit(X, y)

    return model, None

@app.route('/predict_category', methods=['POST'])
def predict_category():
    """
    API endpoint to predict the category of an expense title.
    """
    data = request.get_json()

    if not data or 'expense_title' not in data:
        return jsonify({"error": "Invalid request. Please provide 'expense_title' in JSON format."}), 400

    expense_title = data['expense_title']

    # Train model from MongoDB data
    category_model, error = train_model_from_mongodb()
    if error:
        return jsonify({"error": error}), 500

    # Predict
    predicted_category = category_model.predict([expense_title])[0]

    return jsonify({
        "expense_title": expense_title,
        "predicted_category": predicted_category
    })


if __name__ == '__main__':
    app.run(port=5001, debug=True)