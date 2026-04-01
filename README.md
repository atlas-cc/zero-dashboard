# ZERO Dashboard — Frontend

Agent operations dashboard for monitoring ZERO AI agent activity, tasks, sprints, costs, and corrections.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript

**Color scheme:** Dark — `#0A0A0A` background · `#141414` cards · `#F5F5F5` primary text

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main dashboard — agent status, cost summary, sprint progress, kanban board, corrections feed |
| `/tasks` | Full task list with filtering by status |
| `/system` | System health, agent logs, live event stream |

## Local Development

```bash
# Install dependencies
npm install

# Set backend URL (optional, defaults to localhost:7779)
echo "NEXT_PUBLIC_API_URL=http://localhost:7779" > .env.local

# Run dev server
npm run dev
```

Open http://localhost:3000.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:7779` | ZERO backend API base URL |

## Deploy on Vercel

Set `NEXT_PUBLIC_API_URL` to your Hetzner backend URL in the Vercel project environment variables, then connect the repo.

---

## Backend — Install as systemd Service (Hetzner)

Run these commands on your Hetzner server as root (or with sudo):

```bash
# 1. Copy the backend files to /opt/zero-dashboard
sudo mkdir -p /opt/zero-dashboard
sudo cp -r ~/zero-dashboard/backend /opt/zero-dashboard/
sudo cp -r ~/zero-dashboard/scripts /opt/zero-dashboard/

# 2. Install Python dependencies
cd /opt/zero-dashboard/backend
sudo pip3 install -r requirements.txt

# 3. Create the systemd unit file
sudo tee /etc/systemd/system/zero-dashboard.service > /dev/null <<EOF
[Unit]
Description=ZERO Agent Operations Dashboard API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/zero-dashboard/backend
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=5
Environment=ZERO_DB_PATH=/var/lib/zero-dashboard/zero.db
Environment=ZERO_PORT=7779

[Install]
WantedBy=multi-user.target
EOF

# 4. Create the data directory
sudo mkdir -p /var/lib/zero-dashboard

# 5. Reload systemd, enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable zero-dashboard
sudo systemctl start zero-dashboard

# 6. Verify it's running
sudo systemctl status zero-dashboard
curl http://localhost:7779/api/dashboard
```

To view logs:

```bash
sudo journalctl -u zero-dashboard -f
```

To update the backend after pulling new code:

```bash
sudo cp -r ~/zero-dashboard/backend /opt/zero-dashboard/
sudo systemctl restart zero-dashboard
```
