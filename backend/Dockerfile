# Use an offical Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /app/

# Expose port (optional, but fine)
EXPOSE 8000

# Run server on Render's assigned port
CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:${PORT}"]
