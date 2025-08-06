# ML Model Service for Splitwise

This directory contains machine learning models and services for the Splitwise expense management application. The ML service provides intelligent features like expense categorization and expense forecasting to enhance user experience.

## 🚀 Features

### Current Models
1. **Expense Category Prediction** - Automatically categorizes expenses based on description
2. **Expense Forecasting** - Predicts future expense amounts using time series analysis

### Upcoming Models (Roadmap)
- Fraud Detection
- Budget Optimization
- Expense Splitting Recommendations
- Receipt OCR and Verification
- User Spending Pattern Clustering

## 📁 Project Structure

```
ml-model/
├── app.py                          # Main Flask application
├── database.py                     # MongoDB connection utilities
├── csv-to-mongo.py                 # Data migration script
├── README.md                       # This file
├── modules/
│   ├── category.py                 # Standalone category prediction service
│   ├── Forecast.py                 # Standalone forecasting service
│   ├── expense_categorizer.pkl     # Trained category prediction model
│   ├── prophet_expense_forecaster.pkl # Trained forecasting model
│   └── notes.txt                   # API usage examples
└── Notebook/
    ├── Expense_Categories.ipynb    # Category model training notebook
    ├── Next Month Expense-Copy1.ipynb # Forecasting model training
    ├── expense.csv                 # Training data
    ├── expense2.csv               # Additional training data
    └── expense3.csv               # Additional training data
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- MongoDB Atlas account (for database connection)
- Required Python packages (see requirements below)

### Dependencies
```bash
pip install flask flask-cors pandas scikit-learn prophet joblib pymongo python-dotenv
```

### Environment Setup
1. Create a `.env` file in the ml-model directory:
```env
ATLAS_URI=your_mongodb_connection_string
DB_NAME=your_database_name
```

2. Ensure your trained models are present:
   - `modules/expense_categorizer.pkl`
   - `modules/prophet_expense_forecaster.pkl`

### Running the Service
```bash
python app.py
```
The service will start on `http://localhost:5001`

## 📊 API Endpoints

### 1. Expense Category Prediction
**Endpoint:** `POST /predict_category`

**Description:** Predicts the category of an expense based on its title/description.

**Request Body:**
```json
{
    "expense_title": "shampoo"
}
```

**Response:**
```json
{
    "expense_title": "shampoo",
    "predicted_category": "Groceries"
}
```

**Categories Supported:**
- Groceries
- Transportation
- Entertainment
- Food & Dining
- Shopping
- Bills & Utilities
- Healthcare
- Travel
- Education
- Other

### 2. Expense Forecasting
**Endpoint:** `GET /forecast_expenses`

**Description:** Provides expense forecasts for the next week and next month based on historical data.

**Response:**
```json
{
    "status": "success",
    "forecast": {
        "next_week_forecast_amount": 2374.9,
        "next_month_forecast_amount": 10209.54
    },
    "currency": "₹"
}
```

## 🧠 Model Details

### Expense Category Prediction Model
- **Algorithm:** Likely using scikit-learn (TF-IDF + Classification)
- **Input:** Expense description/title (text)
- **Output:** Predicted category (string)
- **Training Data:** Historical expense descriptions with manual categories
- **Model File:** `modules/expense_categorizer.pkl`

### Expense Forecasting Model
- **Algorithm:** Facebook Prophet
- **Input:** Historical expense time series data
- **Output:** Future expense predictions with confidence intervals
- **Features:** Handles seasonality, trends, and holidays
- **Model File:** `modules/prophet_expense_forecaster.pkl`
- **Prediction Horizon:** Up to 60 days

## 🔧 Development

### Training New Models

#### Category Prediction Model
1. Prepare training data with expense descriptions and categories
2. Use the Jupyter notebook: `Notebook/Expense_Categories.ipynb`
3. Save the trained model as `modules/expense_categorizer.pkl`

#### Forecasting Model
1. Prepare historical expense data with dates and amounts
2. Use the Jupyter notebook: `Notebook/Next Month Expense-Copy1.ipynb`
3. Save the trained model as `modules/prophet_expense_forecaster.pkl`

### Data Migration
Use `csv-to-mongo.py` to migrate expense data from CSV files to MongoDB for model training.

### Testing the Models
```bash
# Test category prediction
curl -X POST http://localhost:5001/predict_category \
  -H "Content-Type: application/json" \
  -d '{"expense_title": "coffee"}'

# Test expense forecasting
curl -X GET http://localhost:5001/forecast_expenses
```

## 🔄 Integration with Main Application

The ML service integrates with the main Splitwise application through HTTP API calls:

1. **Frontend Integration:** React components can call ML endpoints for real-time predictions
2. **Backend Integration:** Node.js backend can proxy ML requests or call directly
3. **CORS Enabled:** The service supports cross-origin requests from the frontend

## 📈 Performance Considerations

- **Model Loading:** Models are loaded once at startup for optimal performance
- **Error Handling:** Graceful fallbacks when models fail to load
- **Scalability:** Consider model serving frameworks (TensorFlow Serving, MLflow) for production
- **Caching:** Implement caching for frequent predictions

## 🚨 Error Handling

The service includes comprehensive error handling:
- Model loading failures
- Invalid request formats
- Database connection issues
- Prediction errors

## 🔮 Future Enhancements

### Planned Models
1. **Fraud Detection Model**
   - Detect unusual spending patterns
   - Alert on suspicious transactions

2. **Budget Optimization Model**
   - Recommend budget limits
   - Suggest cost-cutting opportunities

3. **Receipt OCR Model**
   - Extract expense details from receipt images
   - Automatic expense creation

4. **User Clustering Model**
   - Group users by spending patterns
   - Personalized recommendations

5. **Debt Optimization Model**
   - Optimize group debt settlements
   - Minimize transaction count

### Technical Improvements
- Model versioning and A/B testing
- Real-time model updates
- Performance monitoring
- Automated model retraining pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your ML model in the `modules/` directory
4. Update this README with your model documentation
5. Add API endpoints to `app.py`
6. Submit a pull request

## 📄 License

This project is part of the Splitwise application. Please refer to the main project license.

## 📞 Support

For questions or issues related to the ML models:
1. Check the `modules/notes.txt` for API examples
2. Review the Jupyter notebooks for model training details
3. Open an issue in the main repository

---

**Note:** Ensure you have sufficient training data and properly validated models before deploying to production.
