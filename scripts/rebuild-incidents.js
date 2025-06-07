const fs = require('fs');
const path = require('path');
const RSS = require('rss');

const INCIDENTS_DIR = path.join(__dirname, '../data/incidents');
const INCIDENTS_JSON = path.join(__dirname, '../data/incidents.json');
const STATUS_JSON = path.join(__dirname, '../data/status.json');
const INCIDENTS_RSS = path.join(__dirname, '../dist/incidents.rss');

// Ensure output dir exists
const DIST_DIR = path.join(__dirname, '../dist');
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}

// Load all incident files
const files = fs.readdirSync(INCIDENTS_DIR).filter(f => f.endsWith('.json'));

let incidents = [];

files.forEach(file => {
  const filePath = path.join(INCIDENTS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  incidents.push(data);
});

// Sort newest first
incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

// Write incidents.json
fs.writeFileSync(INCIDENTS_JSON, JSON.stringify(incidents, null, 2));
console.log(`✅ Updated ${INCIDENTS_JSON} with ${incidents.length} incidents.`);

// === Update status.json ===
const statusData = JSON.parse(fs.readFileSync(STATUS_JSON, 'utf-8'));
const currentStatuses = statusData.statuses;

// For each system, find most recent incident (if any)
currentStatuses.forEach(statusEntry => {
  const latestIncident = incidents.find(inc => inc.system === statusEntry.system);
  if (latestIncident) {
    statusEntry.status = latestIncident.status;
    statusEntry.lastUpdated = new Date().toISOString();
    console.log(`🔄 Updated status for ${statusEntry.system} → ${statusEntry.status}`);
  }
});

// Write updated status.json
const updatedStatusJson = {
  statuses: currentStatuses,
  lastBuilt: new Date().toISOString()
};

fs.writeFileSync(STATUS_JSON, JSON.stringify(updatedStatusJson, null, 2));
console.log(`✅ Updated ${STATUS_JSON}.`);

// === Build RSS feed ===
const feed = new RSS({
  title: 'Outage Tracker - Recent Incidents',
  feed_url: '/dist/incidents.rss',
  site_url: '/', // You can update with your prod URL
});

incidents.slice(0, 10).forEach(inc => {
  feed.item({
    title: `[${inc.status.toUpperCase()}] ${inc.system}`,
    description: inc.description,
    date: inc.timestamp,
  });
});

fs.writeFileSync(INCIDENTS_RSS, feed.xml({ indent: true }));
console.log(`✅ Updated ${INCIDENTS_RSS}.`);