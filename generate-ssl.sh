#!/bin/bash

# Script to generate self-signed SSL certificate for development

echo "Generating self-signed SSL certificate..."

# Create directory for SSL files
mkdir -p nginx/ssl

# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Set proper permissions
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem

echo "SSL certificate generated successfully!"
echo "Files created:"
echo "- nginx/ssl/cert.pem (certificate)"
echo "- nginx/ssl/key.pem (private key)"
