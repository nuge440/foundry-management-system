# Foundry Management System — On-Premises Deployment Guide

This guide covers deploying the Foundry Management System to a self-hosted server on your local network.

---

## Server Requirements

| Component | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 20.04 / Windows Server 2019 / RHEL 8 | Ubuntu 22.04 LTS or Windows Server 2022 |
| Node.js | v18.x | v20.x LTS |
| npm | v9+ | v10+ |
| MongoDB | v6.0 | v7.0+ |
| RAM | 2 GB | 4 GB+ |
| Disk | 10 GB | 20 GB+ |
| CPU | 2 cores | 4 cores |

The system runs on a single server. MongoDB can run on the same machine or a separate database server on your network.

---

## Step 1: Install Prerequisites

### Linux (Ubuntu/Debian)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # Should show v20.x
npm --version    # Should show v10.x

# Install MongoDB 7.0
# See https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Windows Server

1. Download and install Node.js 20.x LTS from https://nodejs.org
2. Download and install MongoDB Community Server from https://www.mongodb.com/try/download/community
3. During MongoDB installation, choose "Install as a Service" so it starts automatically
4. Verify in PowerShell:
   ```powershell
   node --version
   npm --version
   mongosh --eval "db.version()"
   ```

---

## Step 2: Get the Application Code

Copy the project files to your server. You can use git, a zip file, or any file transfer method.

```bash
# Option A: If you have git access
git clone <your-repo-url> /opt/foundry-management
cd /opt/foundry-management

# Option B: Copy files manually
# Transfer the project folder to /opt/foundry-management (or your preferred location)
```

---

## Step 3: Install Dependencies

```bash
cd /opt/foundry-management
npm install
```

This installs all Node.js packages. No database migrations are needed — MongoDB creates collections automatically.

---

## Step 4: Set Up MongoDB

### Create the Database and User

```bash
mongosh
```

```javascript
use JobBoss

db.createUser({
  user: "foundry_app",
  pwd: "CHANGE_THIS_TO_A_STRONG_PASSWORD",
  roles: [{ role: "readWrite", db: "JobBoss" }]
})
```

### Enable MongoDB Authentication (Recommended)

Edit your MongoDB config file:

- Linux: `/etc/mongod.conf`
- Windows: `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`

Add or update:

```yaml
security:
  authorization: enabled
```

Restart MongoDB:

```bash
# Linux
sudo systemctl restart mongod

# Windows (PowerShell as Admin)
Restart-Service MongoDB
```

### If Using MongoDB Atlas Instead of Local

If you prefer to keep using MongoDB Atlas (cloud-hosted), just use your existing Atlas connection string. No local MongoDB installation needed.

---

## Step 5: Configure Environment Variables

Create a `.env` file or set system environment variables.

### Linux — Create a systemd environment file

```bash
sudo mkdir -p /etc/foundry
sudo nano /etc/foundry/env
```

Add these values:

```bash
# REQUIRED
SESSION_SECRET=your-long-random-secret-string-at-least-32-characters
MONGODB_URI=mongodb://foundry_app:YOUR_PASSWORD@localhost:27017/JobBoss

# If using MongoDB Atlas instead of local:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/JobBoss

# OPTIONAL
PORT=5000
BAMBOOHR_API_KEY=your-bamboohr-api-key
BAMBOOHR_COMPANY=southerncast
```

### Windows — Set System Environment Variables

Open System Properties > Environment Variables, and add:

| Variable | Value |
|---|---|
| `SESSION_SECRET` | A long random string (32+ characters) |
| `MONGODB_URI` | `mongodb://foundry_app:YOUR_PASSWORD@localhost:27017/JobBoss` |
| `PORT` | `5000` (optional) |
| `BAMBOOHR_API_KEY` | Your BambooHR API key |
| `BAMBOOHR_COMPANY` | `southerncast` |

### Generate a Secure SESSION_SECRET

```bash
# Linux/macOS
openssl rand -hex 32

# Or with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 6: Update Cookie Settings for On-Premises

The app ships with cookie settings optimized for cloud hosting (Replit). For on-premises deployment behind your own network, update `server/index.ts`:

Find this block (around line 90):

```typescript
cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
  sameSite: "none",
},
```

Change it to:

```typescript
cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: false,       // Set to true if using HTTPS
  sameSite: "lax",     // "lax" is correct for same-origin on-prem
},
```

Also remove the `proxy: true` line (line 89) unless you're running behind a reverse proxy like nginx.

**Important**: If you set up HTTPS (recommended), change `secure` back to `true`.

---

## Step 7: Build for Production

```bash
cd /opt/foundry-management
npm run build
```

This creates:
- `dist/public/` — the compiled frontend (static HTML/CSS/JS)
- `dist/index.js` — the compiled backend server

---

## Step 8: Start the Application

### Quick Test

```bash
# Load environment variables and start
export $(cat /etc/foundry/env | xargs)
npm start
```

Visit `http://YOUR_SERVER_IP:5000` in a browser. You should see the dashboard.

### First Login

On first startup with an empty database, the system auto-creates an admin account:
- **Email**: `nugent@southerncast.com`
- You'll be prompted to set a password on first login

### Run as a System Service (Linux)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/foundry.service
```

```ini
[Unit]
Description=Foundry Management System
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/foundry-management
EnvironmentFile=/etc/foundry/env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable foundry
sudo systemctl start foundry

# Check status
sudo systemctl status foundry

# View logs
sudo journalctl -u foundry -f
```

### Run as a Windows Service

Use a tool like [NSSM](https://nssm.cc/) (Non-Sucking Service Manager):

```powershell
# Download nssm from https://nssm.cc/download
nssm install FoundryManagement "C:\Program Files\nodejs\node.exe" "C:\foundry-management\dist\index.js"
nssm set FoundryManagement AppDirectory "C:\foundry-management"
nssm set FoundryManagement AppEnvironmentExtra "SESSION_SECRET=your-secret" "MONGODB_URI=mongodb://..." "PORT=5000"
nssm start FoundryManagement
```

---

## Step 9: Set Up the JobBoss Sync Script

The sync script runs on a machine that has network access to both your JobBoss SQL Server and your MongoDB instance.

### Install Python Dependencies

```bash
cd /opt/foundry-management/sync
pip install pymongo pymssql
```

### Configure Sync Environment

```bash
export JOBBOSS_SERVER=your-sql-server-hostname
export JOBBOSS_DATABASE=your-jobboss-database
export JOBBOSS_USER=your-sql-user
export JOBBOSS_PASSWORD=your-sql-password
export MONGODB_URI=mongodb://foundry_app:YOUR_PASSWORD@localhost:27017/JobBoss
```

### Run the Sync

```bash
# Incremental sync (only changed jobs since last run)
python jb_sync.py

# Full sync (all jobs — use for first-time setup)
python jb_sync.py --full
```

### Schedule Automatic Sync

#### Linux (cron)

```bash
crontab -e
```

Add a line to sync every 5 minutes:

```
*/5 * * * * cd /opt/foundry-management/sync && /usr/bin/python3 jb_sync.py >> /var/log/foundry-sync.log 2>&1
```

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create a new task that runs `python C:\foundry-management\sync\jb_sync.py`
3. Set trigger to repeat every 5 minutes
4. Set the environment variables in the task's action settings

---

## Step 10: Set Up a Reverse Proxy (Optional but Recommended)

Running behind nginx gives you HTTPS, better security, and the ability to serve on port 80/443.

### Install nginx

```bash
sudo apt-get install nginx
```

### Configure

```bash
sudo nano /etc/nginx/sites-available/foundry
```

```nginx
server {
    listen 80;
    server_name foundry.southerncast.local;  # Or your internal hostname

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE (Server-Sent Events) support for Change Log
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/foundry /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

If using nginx, add `proxy: true` back to the session config in `server/index.ts`.

### Add HTTPS with a Self-Signed Certificate (Internal Use)

```bash
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/foundry.key \
  -out /etc/ssl/certs/foundry.crt \
  -subj "/CN=foundry.southerncast.local"
```

Update the nginx config to listen on 443 with SSL:

```nginx
server {
    listen 443 ssl;
    server_name foundry.southerncast.local;

    ssl_certificate /etc/ssl/certs/foundry.crt;
    ssl_certificate_key /etc/ssl/private/foundry.key;

    # ... same proxy_pass config as above ...
}

server {
    listen 80;
    server_name foundry.southerncast.local;
    return 301 https://$host$request_uri;
}
```

When using HTTPS, update the cookie settings in `server/index.ts`:
- Set `secure: true`
- Keep `proxy: true` (since nginx proxies the request)

---

## Step 11: Set Up Your Custom Domain

You have two options depending on whether you want the system accessible only inside your company network, or publicly on the internet.

### Option A: Internal Domain (Company Network Only)

This is the simplest approach — users on your office network access the app at something like `foundry.southerncast.local` or `foundry.yourdomain.com`.

**1. Choose your internal hostname**

Pick a name like:
- `foundry.southerncast.local`
- `dashboard.southerncast.internal`
- `foundry.yourdomain.com` (if you own the domain and control DNS)

**2. Point the hostname to your server**

You have two options:

**Option 1 — Local DNS (if you have a DNS server like Active Directory):**

Add an A record in your DNS server:
```
foundry.southerncast.local  →  192.168.1.100  (your server's IP)
```

**Option 2 — Hosts file (quick setup for small teams):**

On each user's computer, edit the hosts file:

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Mac/Linux: `/etc/hosts`

Add:
```
192.168.1.100  foundry.southerncast.local
```

**3. Update nginx config**

Replace `server_name` in your nginx config with your chosen hostname:

```nginx
server_name foundry.southerncast.local;
```

Then restart nginx:
```bash
sudo systemctl restart nginx
```

Users can now open their browser and go to `http://foundry.southerncast.local`.

### Option B: Public Domain (Accessible from Anywhere)

If you want the app accessible from outside your office — for example at `foundry.southerncast.com` — you'll need a public domain and a few extra steps.

**1. Buy/use a domain**

If you already own `southerncast.com`, you can create a subdomain like `foundry.southerncast.com`. If not, register a domain through any registrar (GoDaddy, Namecheap, Cloudflare, etc.).

**2. Point DNS to your server**

Log into your domain registrar's DNS settings and create an A record:

```
Type: A
Name: foundry          (or @ for the root domain)
Value: YOUR_PUBLIC_IP  (your office's public IP address)
TTL: 300
```

To find your public IP, run this from your server:
```bash
curl ifconfig.me
```

**3. Set up port forwarding on your router/firewall**

Forward incoming traffic on ports 80 and 443 from your router to your server's internal IP:

| External Port | Internal IP | Internal Port |
|---|---|---|
| 80 | 192.168.1.100 | 80 |
| 443 | 192.168.1.100 | 443 |

The exact steps depend on your router/firewall — check your network admin or IT team.

**4. Get a real SSL certificate with Let's Encrypt (free)**

For a public domain, use a real certificate instead of self-signed:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (automatically configures nginx)
sudo certbot --nginx -d foundry.southerncast.com

# Auto-renewal is set up automatically, but verify:
sudo certbot renew --dry-run
```

Certbot will automatically update your nginx config to use HTTPS and redirect HTTP to HTTPS.

**5. Update nginx config**

```nginx
server {
    listen 443 ssl;
    server_name foundry.southerncast.com;

    ssl_certificate /etc/letsencrypt/live/foundry.southerncast.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/foundry.southerncast.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}

server {
    listen 80;
    server_name foundry.southerncast.com;
    return 301 https://$host$request_uri;
}
```

**6. Update cookie settings for HTTPS**

In `server/index.ts`, make sure the cookie config has:
```typescript
cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,       // Required for HTTPS
  sameSite: "lax",
},
proxy: true,           // Required when behind nginx
```

**7. Security considerations for public access**

If exposing to the internet, consider these additional steps:

- **Firewall**: Only allow ports 80, 443, and SSH (22) from the internet. Block MongoDB port (27017) from external access.
- **Fail2ban**: Install to protect against brute-force login attempts:
  ```bash
  sudo apt-get install fail2ban
  ```
- **Rate limiting in nginx**: Add to your server block:
  ```nginx
  limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

  location /api/auth/login {
      limit_req zone=login burst=3;
      proxy_pass http://127.0.0.1:5000;
  }
  ```
- **Keep the system updated**: Regularly run `sudo apt update && sudo apt upgrade`

### Summary: Which Option to Choose?

| | Internal Only | Public Domain |
|---|---|---|
| **Access** | Office network only | Anywhere with internet |
| **Setup difficulty** | Easy | Moderate |
| **SSL certificate** | Self-signed or none | Let's Encrypt (free, auto-renewing) |
| **Security risk** | Low | Higher — needs firewall, rate limiting |
| **Best for** | Shop floor dashboards, office use | Remote managers, traveling employees |
| **Cost** | Free | Free (if you already own a domain) |

---

## Updating the Application

When you have a new version of the code:

```bash
cd /opt/foundry-management

# Get new code (git pull, or copy new files)
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart the service
sudo systemctl restart foundry
```

---

## Backup Strategy

### MongoDB Backup

```bash
# Full backup
mongodump --uri="mongodb://foundry_app:PASSWORD@localhost:27017/JobBoss" --out=/backup/mongo/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://foundry_app:PASSWORD@localhost:27017/JobBoss" /backup/mongo/20260313/JobBoss
```

Schedule daily backups:

```bash
# Add to crontab
0 2 * * * mongodump --uri="mongodb://foundry_app:PASSWORD@localhost:27017/JobBoss" --out=/backup/mongo/$(date +\%Y\%m\%d) --gzip
```

---

## Troubleshooting

### App won't start

| Error | Fix |
|---|---|
| `SESSION_SECRET must be set` | Set the `SESSION_SECRET` environment variable |
| `MONGODB_URI environment variable is not set` | Set the `MONGODB_URI` environment variable |
| `MongoServerError: Authentication failed` | Check your MongoDB username/password in the connection string |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB is not running — start it with `sudo systemctl start mongod` |

### Can't log in

- On first startup, use `nugent@southerncast.com` and you'll be prompted to set a password
- If you've run BambooHR sync, use your BambooHR email — first login will prompt for password setup
- Check that cookies aren't being blocked (if using HTTPS, make sure `secure: true` is set)

### Dashboard shows no jobs

- Run the JobBoss sync: `cd sync && python jb_sync.py --full`
- Verify MongoDB has data: `mongosh --eval "use JobBoss; db.jobs.countDocuments()"`

### SSE (Change Log real-time updates) not working

- If behind nginx, make sure `proxy_buffering off` is set
- Check that the SSE endpoint is accessible: `curl http://localhost:5000/api/change-log/stream`

### Check application logs

```bash
# If running as systemd service
sudo journalctl -u foundry -f

# If running manually
npm start 2>&1 | tee /var/log/foundry.log
```

---

## Network Architecture (On-Premises)

```
┌─────────────────────────────────────────────────────┐
│                  Your Network                        │
│                                                      │
│  ┌──────────┐    ┌──────────────────────────────┐   │
│  │ Browsers  │───>│  Foundry Server               │   │
│  │ (users)   │    │  - Node.js app (port 5000)    │   │
│  └──────────┘    │  - MongoDB (port 27017)        │   │
│                   │  - nginx (ports 80/443)        │   │
│                   └──────────┬───────────────────┘   │
│                              │                        │
│                   ┌──────────v───────────────────┐   │
│                   │  JobBoss SQL Server            │   │
│                   │  (existing on-prem)            │   │
│                   └──────────────────────────────┘   │
│                                                      │
│  Sync: jb_sync.py runs on schedule (cron/Task Sched) │
│  Pulls from JobBoss SQL → pushes to MongoDB           │
└─────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Action | Command |
|---|---|
| Start (development) | `npm run dev` |
| Build for production | `npm run build` |
| Start (production) | `npm start` |
| Start service | `sudo systemctl start foundry` |
| Stop service | `sudo systemctl stop foundry` |
| View logs | `sudo journalctl -u foundry -f` |
| Run sync (incremental) | `cd sync && python jb_sync.py` |
| Run sync (full) | `cd sync && python jb_sync.py --full` |
| Backup MongoDB | `mongodump --uri="..." --out=/backup/$(date +%Y%m%d)` |
| Check MongoDB | `mongosh --eval "use JobBoss; db.stats()"` |
