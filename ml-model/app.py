from flask import Flask, request, jsonify
import joblib
from prophet import Prophet
import pandas as pd
from datetime import datetime, timedelta
from flask_cors import CORS # Import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes and origins by default


# Load the Prophet model when the Flask application starts
try:
    forecasting_model = joblib.load('prophet_expense_forecaster.pkl')
    print("Prophet forecasting model loaded successfully.")
    category_model = joblib.load("expense_categorizer.pkl")
    print("Model 'expense_categorizer.pkl' loaded successfully.")
except FileNotFoundError:
    print("Error: 'prophet_expense_forecaster.pkl' not found. Please train and save the model first.")
    forecasting_model = None
    print("Error: 'expense_categorizer.pkl' not found. Please ensure the model file is in the same directory.")
    category_model = None
except Exception as e:
    print(f"Error loading forecasting model: {e}")
    forecasting_model = None
    print(f"Error loading category_model: {e}")
    category_model = None


@app.route('/forecast_expenses', methods=['GET'])
def forecast_expenses():
    """
    API endpoint to get the next week's and next month's expense forecasts.
    """
    if forecasting_model is None:
        return jsonify({"error": "Forecasting model not loaded. Cannot process request."}), 500

    try:
        future = forecasting_model.make_future_dataframe(periods=60, freq='D')
        forecast = forecasting_model.predict(future)

        today = pd.to_datetime(datetime.today().date())

        last_training_date = forecasting_model.history['ds'].max()
        start_date_next_week = last_training_date + timedelta(days=1)
        end_date_next_week = start_date_next_week + timedelta(days=6) # 7 days inclusive

        next_week_forecast_df = forecast[(forecast['ds'] >= start_date_next_week) & (forecast['ds'] <= end_date_next_week)]
        next_week_sum = next_week_forecast_df['yhat'].sum()

        end_date_next_month = start_date_next_week + timedelta(days=29) # 30 days inclusive
        next_month_forecast_df = forecast[(forecast['ds'] >= start_date_next_week) & (forecast['ds'] <= end_date_next_month)]
        next_month_sum = next_month_forecast_df['yhat'].sum()


        # Format the output
        response = {
            "status": "success",
            "forecast": {
                "next_week_forecast_amount": float(f"{next_week_sum:.2f}"),
                "next_month_forecast_amount": float(f"{next_month_sum:.2f}")
            },
            "currency": "₹"
        }
        return jsonify(response)

    except Exception as e:
        print(f"Error during forecasting: {e}")
        return jsonify({"error": f"An error occurred during forecasting: {str(e)}"}), 500
    

@app.route('/predict_category', methods=['POST'])
def predict_category():
    """
    API endpoint to predict the category of an expense title.
    Expects a JSON payload with an 'expense_title' key.
    """
    if category_model is None:
        return jsonify({"error": "category_model not loaded. Cannot process request."}), 500

    data = request.get_json()

    if not data or 'expense_title' not in data:
        return jsonify({"error": "Invalid request. Please provide 'expense_title' in JSON format."}), 400

    expense_title = data['expense_title']
    print("Expense_title: ",expense_title)

    # Your model expects a list of titles, so wrap the single title in a list
    predicted_categories = category_model.predict([expense_title])

    # The prediction result is typically an array, take the first (and only) element
    category = predicted_categories[0]
    print("Category:      ", category)
    return jsonify({"expense_title": expense_title, "predicted_category": category})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)