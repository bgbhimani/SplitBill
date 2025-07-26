# ML Server with CORS enabled for React frontend
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)  # This enables CORS for all domains

# Enable logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/predict_category', methods=['POST'])
def predict_category():
    try:
        # Log the incoming request
        app.logger.info(f"Received request: {request.get_json()}")
        
        data = request.get_json()
        expense_title = data.get('expense_title', '').lower()
        
        # Simple rule-based prediction (replace this with your actual ML model)
        predictions = {
            'food': 'Food',
            'pizza': 'Food',
            'restaurant': 'Food', 
            'dinner': 'Food',
            'lunch': 'Food',
            'breakfast': 'Food',
            'grocery': 'Groceries',
            'groceries': 'Groceries',
            'vegetables': 'Vegetable',
            'vegetable': 'Vegetable',
            'taxi': 'Taxi',
            'uber': 'Taxi',
            'ola': 'Taxi',
            'fuel': 'Fuel',
            'petrol': 'Fuel',
            'gas': 'Fuel',
            'rent': 'Rent',
            'electricity': 'Electricity',
            'electric': 'Electricity',
            'water': 'Water',
            'internet': 'Internet',
            'wifi': 'Internet'
        }
        
        predicted_category = 'Other'  # Default category
        
        # Check if any keyword matches
        for keyword, category in predictions.items():
            if keyword in expense_title:
                predicted_category = category
                break
        
        response = {'predicted_category': predicted_category}
        app.logger.info(f"Sending response: {response}")
        
        return jsonify(response)
        
    except Exception as e:
        app.logger.error(f"Error in prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'ML API is running'})

if __name__ == '__main__':
    print("Starting ML API server with CORS enabled...")
    print("Test URL: http://localhost:5001/predict_category")
    print("Health check: http://localhost:5001/health")
    app.run(host='0.0.0.0', port=5001, debug=True)
