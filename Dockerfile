FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and building python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
COPY NutriSense/dl_service/requirements.txt dl_requirements.txt

# Merge and install requirements, replace opencv-python with headless
RUN cat dl_requirements.txt >> requirements.txt && \
    sed -i 's/opencv-python>=/opencv-python-headless>=/g' requirements.txt && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Run uvicorn on 0.0.0.0:$PORT
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
