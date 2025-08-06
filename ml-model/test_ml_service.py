import requests
import json

# Test ML service endpoints
base_url = "http://localhost:5001"

def test_health():
    try:
        response = requests.get(f"{base_url}/health")
        print("Health Check:", response.json())
        return response.status_code == 200
    except Exception as e:
        print("Health check failed:", e)
        return False

def test_category_prediction():
    try:
        response = requests.post(f"{base_url}/predict_category", 
                               json={"expense_title": "coffee"})
        print("Category Prediction:", response.json())
        return response.status_code == 200
    except Exception as e:
        print("Category prediction failed:", e)
        return False

def test_user_endpoints(user_id):
    endpoints = [
        f"/predict/{user_id}",
        f"/budget/{user_id}",
        f"/anomaly/{user_id}"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            print(f"{endpoint}: {response.status_code} - {response.json()}")
        except Exception as e:
            print(f"{endpoint} failed: {e}")

if __name__ == "__main__":
    print("Testing ML Service...")
    
    if test_health():
        print("✅ Health check passed")
    else:
        print("❌ Health check failed")
        exit(1)
    
    if test_category_prediction():
        print("✅ Category prediction working")
    else:
        print("❌ Category prediction failed")
    
    # Test with your user ID
    user_id = "687bfd482915b868e67d3c96"
    print(f"\nTesting user endpoints for ID: {user_id}")
    test_user_endpoints(user_id)
