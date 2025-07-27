from flask import Flask, request, jsonify
import joblib
from flask_cors import CORS # Import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes and origins by default

# Load the saved model when the Flask application starts
try:
    category_model = joblib.load("expense_categorizer.pkl")
    print("Model 'expense_categorizer.pkl' loaded successfully.")
except FileNotFoundError:
    print("Error: 'expense_categorizer.pkl' not found. Please ensure the model file is in the same directory.")
    category_model = None
except Exception as e:
    print(f"Error loading category_model: {e}")
    category_model = None

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
    app.run(debug=True, host='0.0.0.0', port=5001)