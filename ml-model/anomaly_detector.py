import pandas as pd
from sklearn.ensemble import IsolationForest
from pymongo import MongoClient
from bson import ObjectId
import numpy as np

def detect_anomalies_for_user(user_id):
    # MongoDB connection
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client["splitwise"]
    collection = db["personalexpenses"]

    # Load user's expenses
    expenses = list(collection.find({"userId": ObjectId(user_id)}))

    if not expenses or len(expenses) < 10:
        return {
            "userId": user_id,
            "anomalies": [],
            "message": "Not enough data for anomaly detection (minimum 10 expenses required)",
            "total_expenses": len(expenses)
        }

    # Prepare DataFrame
    df = pd.DataFrame(expenses)
    
    # Ensure required columns exist
    if 'amount' not in df.columns or 'date' not in df.columns:
        return {
            "userId": user_id,
            "anomalies": [],
            "message": "Missing required fields (amount, date)",
            "total_expenses": len(expenses)
        }
    
    # Clean and preprocess data
    df['amount'] = df['amount'].astype(float)
    df['timestamp'] = pd.to_datetime(df['date'])
    df = df.dropna(subset=['amount'])
    df = df[df['amount'] > 0]  # Only positive amounts
    
    if len(df) < 10:
        return {
            "userId": user_id,
            "anomalies": [],
            "message": "Not enough valid data after cleaning",
            "total_expenses": len(df)
        }

    # Feature engineering
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['hour'] = df['timestamp'].dt.hour
    df['category_encoded'] = pd.factorize(df.get('category', ['Unknown'] * len(df)))[0]
    
    # Calculate amount percentiles
    avg_amount = df['amount'].mean()
    df['amount_ratio'] = df['amount'] / avg_amount

    # Feature set for anomaly detection
    features = df[['amount', 'day_of_week', 'hour', 'category_encoded', 'amount_ratio']]
    features = features.fillna(features.mean())  # Fill any remaining NaN values

    # Train Isolation Forest model
    model = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
    anomaly_labels = model.fit_predict(features)
    anomaly_scores = model.decision_function(features)

    # Mark anomalies (-1 = anomaly)
    df['is_anomaly'] = anomaly_labels == -1
    df['anomaly_score'] = anomaly_scores

    # Get anomalous expenses
    anomalous_expenses = df[df['is_anomaly']].copy()
    
    # Format anomalies for output
    anomalies = []
    for _, row in anomalous_expenses.iterrows():
        expense_dict = row.to_dict()
        anomalies.append({
            "expense_id": str(expense_dict.get('_id', '')),
            "amount": float(expense_dict['amount']),
            "date": expense_dict['timestamp'].isoformat() if hasattr(expense_dict['timestamp'], 'isoformat') else str(expense_dict['timestamp']),
            "description": expense_dict.get('description', 'No description'),
            "category": expense_dict.get('category', 'Uncategorized'),
            "anomaly_score": float(expense_dict['anomaly_score']),
            "reason": determine_anomaly_reason(expense_dict, avg_amount, df)
        })
    
    # Sort by anomaly score (most anomalous first)
    anomalies.sort(key=lambda x: x['anomaly_score'])

    return {
        "userId": user_id,
        "anomalies": anomalies,
        "total_expenses": len(expenses),
        "total_anomalies": len(anomalies),
        "anomaly_percentage": round((len(anomalies) / len(expenses)) * 100, 2) if len(expenses) > 0 else 0,
        "detection_method": "Isolation Forest",
        "message": f"Detected {len(anomalies)} anomalies out of {len(expenses)} expenses"
    }

def determine_anomaly_reason(expense_dict, avg_amount, df):
    """
    Determine why an expense was flagged as anomalous
    """
    reasons = []
    amount = expense_dict['amount']
    
    # Check if amount is significantly higher than average
    if amount > avg_amount * 2:
        reasons.append(f"Amount is {amount/avg_amount:.1f}x higher than average")
    
    # Check if amount is in top 10% of all expenses
    amount_percentile = (df['amount'] < amount).sum() / len(df) * 100
    if amount_percentile > 90:
        reasons.append(f"Amount is in top {100-amount_percentile:.1f}% of all expenses")
    
    # Check for unusual timing
    if 'hour' in expense_dict:
        hour = expense_dict['hour']
        if hour < 6 or hour > 23:
            reasons.append("Unusual time of transaction")
    
    return "; ".join(reasons) if reasons else "Pattern deviation detected"
