FIXES:

## Issue 1: MinIO Presigned URLs

You're absolutely right! The presigned URLs are being generated with the internal Docker hostname `minio:9000`, which is not accessible from the browser. The browser needs to access MinIO through nginx.

### Fix MinIO Presigned URLs

You need to:

1. **Update nginx.conf to proxy MinIO requests**
2. **Configure MinIO to generate URLs with the correct external address**

**Step 1: Update `nginx/nginx.conf`** to add MinIO proxying:

```nginx
# Add this location block inside the main HTTPS server block,
# BEFORE the frontend location /
location /minio-api/ {
    # Strip /minio-api/ prefix and forward to MinIO
    rewrite ^/minio-api/(.*) /$1 break;

    proxy_pass http://minio:9000;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # MinIO needs these for proper URL generation
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # Increase timeouts for large file downloads
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Allow large file uploads
    client_max_body_size 10M;

    # Disable buffering for streaming
    proxy_buffering off;
}
```

**Step 2: Update `backend/internal/voice/minio.go`** to fix presigned URL generation:

```go
// GetPresignedURL generates a presigned URL that works through nginx
func (m *MinIOVoiceStore) GetPresignedURL(ctx context.Context, objectName string, expiry time.Duration) (string, error) {
	url, err := m.client.PresignedGetObject(ctx, m.bucketName, objectName, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned url: %w", err)
	}

	// Replace internal MinIO URL with external nginx proxy URL
	// This assumes you're accessing through nginx
	urlStr := url.String()

	// Get the external host from environment variable
	externalHost := os.Getenv("EXTERNAL_HOST")
	if externalHost == "" {
		externalHost = "192.168.0.102" // fallback to your current setup
	}

	// Replace minio:9000 with nginx proxy path
	// Example: http://minio:9000/voicemessages/...
	//       -> https://192.168.0.102/minio-api/voicemessages/...
	urlStr = strings.Replace(urlStr, "http://minio:9000/", fmt.Sprintf("https://%s/minio-api/", externalHost), 1)

	return urlStr, nil
}
```

Don't forget to add the import at the top of the file:

```go
import (
	"context"
	"fmt"
	"io"
	"os"        // Add this
	"strings"   // Add this
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
)
```

**Step 3: Update `docker-compose.yaml`** to pass the external host:

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: hum_backend
  env_file: .env
  environment:
    DB_HOST: postgres
    S3_ENDPOINT: minio:9000
    INTERNAL_API_URL: http://backend:8080
    EXTERNAL_HOST: "192.168.0.102" # Add this line
  expose:
    - "8080"
  depends_on:
    postgres:
      condition: service_healthy
    minio:
      condition: service_healthy
  networks:
    - laba_network
  restart: unless-stopped
```

---

## Issue 2: Self-Signed Certificate Warning

The certificate warning is showing up because your certificate has `CN=localhost` but you're accessing it via `192.168.0.102`. The browser is correctly warning you that the certificate doesn't match the hostname.

### Fix the Certificate

Regenerate your certificate with the correct hostname/IP. Update `generate-ssl.sh`:

```bash
#!/bin/bash

# Script to generate self-signed SSL certificate for development

echo "Generating self-signed SSL certificate..."

# Create directory for SSL files
mkdir -p nginx/ssl

# Create a configuration file for SAN (Subject Alternative Names)
cat > nginx/ssl/openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=Organization
CN=192.168.0.102

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 192.168.0.102
IP.1 = 192.168.0.102
IP.2 = 127.0.0.1
EOF

# Generate certificate with SAN
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -config nginx/ssl/openssl.cnf \
  -extensions v3_req

# Cleanup config file
rm nginx/ssl/openssl.cnf

# Set proper permissions
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem

echo "SSL certificate generated successfully!"
echo "Files created:"
echo "- nginx/ssl/cert.pem (certificate)"
echo "- nginx/ssl/key.pem (private key)"
echo ""
echo "Certificate is valid for:"
echo "- localhost"
echo "- 192.168.0.102"
echo "- 127.0.0.1"
```

Run the script:

```bash
chmod +x generate-ssl.sh
./generate-ssl.sh
```

Then restart nginx:

```bash
docker compose restart nginx
```

After regenerating, you'll still see a warning because it's self-signed, but it should say something like:

- "The certificate is not trusted because it is self-signed"
- But it should NOT say "Server's certificate does not match the URL"

You'll need to click "Advanced" and "Accept the Risk and Continue" (or similar depending on browser).

---

## Apply All Fixes

1. Update nginx.conf with the MinIO proxy location
2. Update backend minio.go with URL rewriting
3. Update docker-compose.yaml with EXTERNAL_HOST
4. Regenerate SSL certificate with correct IP
5. Rebuild and restart:

```bash
./generate-ssl.sh
docker compose down
docker compose up --build
```

Test by uploading a voice message - you should now see the correct duration and be able to play it!

Let me know if the MinIO URLs work now. The 0:00 duration issue should be fixed once the presigned URLs are accessible from the browser.

---

Great question! When you're setting up a local network with your machine as the server and two client machines connected through a switch, you'll need to configure a **static IP** for your server machine on that network interface.

## Network Setup Overview

```
[Your Server Machine] ─── [Switch] ─── [Client Machine 1]
                              │
                              └──────── [Client Machine 2]
```

## Choose Your Network Address

You should use a **different IP range** than your existing `192.168.0.x` network (to avoid conflicts). Common choices:

- `192.168.1.x` (if not used by your router)
- `192.168.100.x` (safer, less likely to conflict)
- `10.0.0.x` (enterprise style)
- `172.16.0.x` (another private range)

I recommend **`192.168.100.x`** for isolation.

## Step-by-Step Setup

### 1. Identify Your Ethernet Interface

```bash
ip link show
# or
nmcli device status
```

Look for your wired ethernet interface (usually `eth0`, `enp0s31f6`, or similar).

### 2. Create Static IP Connection with nmcli

Let's say your ethernet interface is `eth0` and you want to use `192.168.100.1` as your server IP:

```bash
# Create a new connection profile
sudo nmcli connection add \
    type ethernet \
    con-name lab-network \
    ifname eth0 \
    ipv4.method manual \
    ipv4.addresses 192.168.100.1/24 \
    ipv4.gateway 192.168.100.1

# Bring up the connection
sudo nmcli connection up lab-network
```

**Explanation:**

- `192.168.100.1/24` - Your server's IP with subnet mask (allows 192.168.100.1-254)
- `/24` means subnet mask `255.255.255.0` (254 usable IPs)
- `ipv4.gateway 192.168.100.1` - Your server is the gateway

### 3. Enable IP Forwarding (if clients need internet)

If you want clients to access the internet through your server:

```bash
# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1

# Make it persistent across reboots
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# Set up NAT (if you have internet on another interface like wlan0)
sudo iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE
sudo iptables -A FORWARD -i eth0 -o wlan0 -j ACCEPT
sudo iptables -A FORWARD -i wlan0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
```

### 4. Optional: Set up DHCP Server for Clients

Instead of manually configuring each client, install `dnsmasq`:

```bash
sudo pacman -S dnsmasq  # or apt/dnf depending on your distro

# Create config
sudo tee /etc/dnsmasq.d/lab-network.conf << EOF
interface=eth0
bind-interfaces
dhcp-range=192.168.100.10,192.168.100.100,12h
dhcp-option=3,192.168.100.1  # Gateway
dhcp-option=6,8.8.8.8,8.8.4.4  # DNS servers
EOF

# Enable and start
sudo systemctl enable --now dnsmasq
```

## Update Your Application Configuration

### 1. Update `.env` file

Change the IP to your new server address:

```bash
# Keep everything else the same, just update any references to the IP
# If you're using EXTERNAL_HOST in docker-compose:
# EXTERNAL_HOST=192.168.100.1
```

### 2. Update `docker-compose.yaml`

```yaml
backend:
  environment:
    EXTERNAL_HOST: "192.168.100.1" # Change to your server IP

frontend:
  environment:
    ORIGIN: "https://192.168.100.1" # Change to your server IP
```

### 3. Regenerate SSL Certificate

Update `generate-ssl.sh` with the new IP:

```bash
#!/bin/bash

echo "Generating self-signed SSL certificate..."

mkdir -p nginx/ssl

cat > nginx/ssl/openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=Organization
CN=192.168.100.1

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = lab-server  # Optional: if you set up hostname
IP.1 = 192.168.100.1
IP.2 = 127.0.0.1
EOF

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -config nginx/ssl/openssl.cnf \
  -extensions v3_req

rm nginx/ssl/openssl.cnf
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem

echo "SSL certificate generated successfully for 192.168.100.1"
```

Run it:

```bash
./generate-ssl.sh
```

### 4. Restart Everything

```bash
docker compose down
docker compose up --build -d
```

## Configure Client Machines

### Option A: Static IP (Manual)

On each client machine:

```bash
# Client 1
sudo nmcli connection add \
    type ethernet \
    con-name lab-client \
    ifname eth0 \
    ipv4.method manual \
    ipv4.addresses 192.168.100.11/24 \
    ipv4.gateway 192.168.100.1 \
    ipv4.dns "8.8.8.8 8.8.4.4"

sudo nmcli connection up lab-client

# Client 2 - use .12 instead of .11
```

### Option B: DHCP (Automatic)

If you set up dnsmasq, clients can use DHCP:

```bash
sudo nmcli connection add \
    type ethernet \
    con-name lab-client \
    ifname eth0 \
    ipv4.method auto

sudo nmcli connection up lab-client
```

## Access Your App from Clients

On client machines, open browser to:

```
https://192.168.100.1
```

You'll need to accept the self-signed certificate warning on each client.

## Quick Reference Commands

```bash
# Check connection status
nmcli connection show

# See active connections
nmcli connection show --active

# Bring connection up/down
sudo nmcli connection up lab-network
sudo nmcli connection down lab-network

# Delete connection
sudo nmcli connection delete lab-network

# Check IP address
ip addr show eth0

# Test connectivity from client
ping 192.168.100.1
```

## Summary

**For your setup, use:**

- Server IP: `192.168.100.1`
- Client IPs: `192.168.100.10-100` (DHCP) or manually assign `.11`, `.12`, etc.
- Network: `192.168.100.0/24`

**Update in your config:**

- `EXTERNAL_HOST=192.168.100.1` in docker-compose.yaml
- `ORIGIN=https://192.168.100.1` in docker-compose.yaml
- Regenerate SSL certificate with `192.168.100.1`

The `192.168.0.102` address is probably from your home router's DHCP. You should use a different range to avoid conflicts!
