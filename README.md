# Splitwise Clone (SplitBill) - Dockerized

This project is a full-stack Splitwise-like application for splitting bills and managing personal expenses with ML-powered insights.

## Project Structure
- **/frontend**: React (Vite) + Tailwind CSS
- **/backend**: Node.js + Express + MongoDB (Mongoose)
- **/ml-model**: Python (Flask) + Pandas + Prophet + Scikit-Learn

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## Getting Started with Docker

### 1. Build and Run the Entire Project
From the root directory, run:
```cmd
docker-compose up --build
```
This command builds the images for all services and starts them alongside a MongoDB database.

### 2. Access the Applications
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8002](http://localhost:8002)
- **ML Service**: [http://localhost:8001](http://localhost:8001)
- **MongoDB**: `mongodb://localhost:27017`


### 3. Stopping the Project
- To stop the containers: `Ctrl + C`
- To stop and remove containers: `docker-compose down`
- To stop and remove everything **including your data**: `docker-compose down --volumes`

## Useful Commands
- **Check Logs**: `docker-compose logs -f`
- **Follow only new logs**: `docker-compose logs -f --tail=0`
- **Rebuild specific service**: `docker-compose up --build <service_name>` (e.g., `ml-model`)
