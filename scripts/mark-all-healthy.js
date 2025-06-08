const fs = require('fs');
const path = require('path');

const STATUS_JSON = path.join(__dirname, '../data/status.json');

// Load status.json
const statusData = JSON.parse(fs.readFileSync(STATUS_JSON, 'utf-8'));
const timestamp = new Date().toISOString();

// Set all systems to green
const updatedStatuses = statusData.statuses.map(s => ({
  ...s,
  status: 'green',
  lastUpdated: timestamp
}));

const updatedStatusJson = {
  statuses: updatedStatuses,
  lastBuilt: timestamp
};

// Write updated status.json
fs.writeFileSync(STATUS_JSON, JSON.stringify(updatedStatusJson, null, 2));
console.log(`✅ Marked all systems healthy. Updated ${STATUS_JSON}.`);