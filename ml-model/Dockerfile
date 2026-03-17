# Use Python as the base image
FROM python:3.10-slim

# Set working directory in the container
WORKDIR /app

# Install system dependencies (e.g., for Prophet/Pandas)
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the ML model files
COPY . .

# Expose the API port (flask usually runs on 5000, 
# but backend is likely on 5000 too if default, check server.js for conflict)
EXPOSE 8001

# Run the Flask server
CMD ["python", "app.py"]
