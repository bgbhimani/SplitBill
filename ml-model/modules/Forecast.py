from flask import Flask, jsonify
import joblib
from prophet import Prophet
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)

# Load the Prophet model when the Flask application starts
try:
    forecasting_model = joblib.load('prophet_expense_forecaster.pkl')
    print("Prophet forecasting model loaded successfully.")
except FileNotFoundError:
    print("Error: 'prophet_expense_forecaster.pkl' not found. Please train and save the model first.")
    forecasting_model = None
except Exception as e:
    print(f"Error loading forecasting model: {e}")
    forecasting_model = None

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

if __name__ == '__main__':
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000) # Using a different port (e.g., 5001) to avoid conflict with the categorizer API