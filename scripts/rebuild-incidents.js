const fs = require('fs');
const path = require('path');
const RSS = require('rss');

const INCIDENTS_DIR = path.join(__dirname, '../data/incidents');
const INCIDENTS_JSON = path.join(__dirname, '../data/incidents.json');
const STATUS_JSON = path.join(__dirname, '../data/status.json');
const INCIDENTS_RSS = path.join(__dirname, '../data/incidents.rss');

// Load all incident files
const files = fs.readdirSync(INCIDENTS_DIR).filter(f => f.endsWith('.json'));

let incidents = [];

files.forEach(file => {
  const filePath = path.join(INCIDENTS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  incidents.push(data);
});

// Load status.json to get lastHealthy
const statusData = JSON.parse(fs.readFileSync(STATUS_JSON, 'utf-8'));
const lastHealthy = statusData.lastHealthy;

// Sort all incidents newest first
incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

// Write ALL incidents to incidents.json (no filtering)
fs.writeFileSync(INCIDENTS_JSON, JSON.stringify(incidents, null, 2));
console.log(`✅ Updated ${INCIDENTS_JSON} with ${incidents.length} total incidents.`);

const currentStatuses = statusData.statuses;

// For each system, find most recent incident after lastHealthy (if any)
currentStatuses.forEach(statusEntry => {
  const incidentAfterHealthy = lastHealthy
    ? incidents.filter(inc => inc.system === statusEntry.system && new Date(inc.timestamp) > new Date(lastHealthy))
    : [];
  if (incidentAfterHealthy.length > 0) {
    // Use the most recent such incident
    const latestIncident = incidentAfterHealthy[0];
    statusEntry.status = latestIncident.status;
    statusEntry.lastUpdated = new Date().toISOString();
    console.log(`🔄 Updated status for ${statusEntry.system} → ${statusEntry.status}`);
  }
});

// Write updated status.json
const updatedStatusJson = {
  statuses: currentStatuses,
  lastBuilt: new Date().toISOString(),
  lastHealthy: lastHealthy
};

fs.writeFileSync(STATUS_JSON, JSON.stringify(updatedStatusJson, null, 2));
console.log(`✅ Updated ${STATUS_JSON}.`);

// === Build RSS feed ===
const feed = new RSS({
  title: 'Outage Tracker - Recent Incidents',
  feed_url: '/data/incidents.rss', // optional: replace with full URL
  site_url: '/', // optional: replace with full URL
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