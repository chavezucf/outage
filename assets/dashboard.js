const DAILY_BAR_COUNT = 50;

document.addEventListener('DOMContentLoaded', async () => {
  const versionParam = `?v=${new Date().getTime()}`;
  const appContainer = document.getElementById('app-list');
  const lastBuiltEl = document.getElementById('last-built');
  const lastIncidentEl = document.getElementById('last-incident');
  const lastCheckedEl = document.getElementById('last-checked');
  const activeIncidentsSection = document.getElementById('active-incidents');
  const activeIncidentList = document.getElementById('active-incident-list');
  const systemStatusBanner = document.getElementById('system-status-banner');

  try {
    // Load applications.json
    const appsResponse = await fetch(`data/applications.json${versionParam}`);
    const appsData = await appsResponse.json();
    const apps = appsData;

    // Load status.json
    const statusResponse = await fetch(`data/status.json${versionParam}`);
    const statusData = await statusResponse.json();
    const statuses = statusData.statuses;
    const lastBuilt = new Date(statusData.lastBuilt).toLocaleString() || 'Unknown';

    // Load incidents.json
    const incidentsResponse = await fetch(`data/incidents.json${versionParam}`);
    const incidents = await incidentsResponse.json();

    // Compute last incident date
    let lastIncidentDate = 'None';
    if (incidents.length > 0) {
      lastIncidentDate = new Date(incidents[0].timestamp).toLocaleString();
    }

    // Update "last checked", "last built", "last incident"
    lastCheckedEl.textContent = lastBuilt;
    lastBuiltEl.textContent = lastBuilt;
    lastIncidentEl.textContent = lastIncidentDate;

    // Populate Active Incidents section
    const activeIncidents = incidents.filter(i => i.active);
    if (activeIncidents.length > 0) {
      activeIncidentsSection.style.display = '';
      activeIncidentList.innerHTML = activeIncidents.map(i =>
        `<li>${i.system}: ${i.description}</li>`
      ).join('');
    } else {
      activeIncidentsSection.style.display = 'none';
    }

    // Combine applications + status
    const combinedApps = apps.map(app => {
      const matchingStatus = statuses.find(s => s.system === app.system);
      return {
        ...app,
        status: matchingStatus ? matchingStatus.status : 'green',
        lastUpdated: matchingStatus ? matchingStatus.lastUpdated : 'Unknown'
      };
    });

    // Determine overall system status
    const overallStatus = computeOverallStatus(combinedApps);
    updateSystemBanner(overallStatus, lastBuilt);

    // Render apps as cards in the grid/list
    appContainer.innerHTML = '';
    combinedApps.forEach(app => renderAppCard(app, incidents));

  } catch (err) {
    console.error('Error loading data:', err);
    appContainer.innerHTML = '<div class="error">Failed to load application data.</div>';
  }
});

function computeOverallStatus(apps) {
  if (apps.some(app => app.status === 'red')) {
    return 'red';
  } else if (apps.some(app => app.status === 'yellow')) {
    return 'yellow';
  } else {
    return 'green';
  }
}

function updateSystemBanner(overallStatus, lastBuilt) {
  const banner = document.getElementById('system-status-banner');
  banner.className = 'system-status-banner status-' + overallStatus;

  const dateStr = new Date(lastBuilt).toLocaleDateString();

  if (overallStatus === 'red') {
    banner.innerHTML = `System Status: OUTAGE <span>Last checked: ${dateStr}</span>`;
  } else if (overallStatus === 'yellow') {
    banner.innerHTML = `System Status: DEGRADED <span>Last checked: ${dateStr}</span>`;
  } else {
    banner.innerHTML = `System Status: OPERATIONAL <span>Last checked: ${dateStr}</span>`;
  }
}

function renderAppCard(app, incidents) {
  const {
    system = 'Unknown',
    status = 'green',
    lastUpdated = '',
    businessImpact = [],
    dependentSystems = []
  } = app;

  const card = document.createElement('div');
  card.className = `status-card status-${status}`;

  card.innerHTML = `
    <div class="card-header">
      <div class="system-name">${system}</div>
      <div class="system-status-dot status-${status}"></div>
    </div>

    <span class="last-updated">Last updated: ${new Date(lastUpdated).toLocaleString()}</span>

    ${status !== 'green' && businessImpact.length > 0 ? 
      `<div class="business-impact status-${status}">
        <strong>Impact:</strong>
        <ul class="incident-list">
          ${businessImpact.map(bi => `<li>${bi}</li>`).join('')}
        </ul>
      </div>` 
      : ''}

    <div class="card-details hidden">
      <div class="detail-section">
        <strong>${DAILY_BAR_COUNT} Day Tracker:</strong>
        <div class="status-bars">${generateDayBars(system, incidents)}</div>
      </div>

      <div class="detail-section">
        <strong>Recent Incidents:</strong>
        <ul class="incident-list">
          ${
            systemIncidents = getRecentIncidents(system, incidents), 
            systemIncidents.length > 0 ? systemIncidents.map(inc => `
              <li>${new Date(inc.timestamp).toLocaleDateString()}: ${colorToStatus(inc.status)} — ${inc.description}</li>
            `).join('') : '<li>None</li>'
          }
        </ul>
      </div>
    </div>
  `;

  // Create footer
  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const toggleLink = document.createElement('div');
  toggleLink.className = 'view-other-details-toggle';
  toggleLink.textContent = 'Other details ▼';

  const detailsSection = card.querySelector('.card-details');

  toggleLink.addEventListener('click', () => {
    detailsSection.classList.toggle('hidden');
    const expanded = !detailsSection.classList.contains('hidden');
    toggleLink.textContent = expanded ? 'Hide details ▲' : 'Other details ▼';
  });

  footer.appendChild(toggleLink);
  card.appendChild(footer);

  document.getElementById('app-list').appendChild(card);
}

function colorToStatus(color) {
  if (color === 'green') return 'Operational';
  if (color === 'yellow') return 'Degraded';
  if (color === 'red') return 'Outage';
}

function generateDayBars(system, incidents) {
  const bars = [];
  const today = new Date();

  for (let i = DAILY_BAR_COUNT - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dayString = day.toISOString().slice(0, 10);

    const matchingIncident = incidents.find(incident =>
      incident.system === system &&
      incident.timestamp.startsWith(dayString)
    );

    let barClass = 'bar-green';
    if (matchingIncident) {
      if (matchingIncident.status === 'red') {
        barClass = 'bar-red';
      } else if (matchingIncident.status === 'yellow') {
        barClass = 'bar-yellow';
      }
    }

    bars.push(`<span class="bar ${barClass}" title="${dayString}"></span>`);
  }

  return bars.join('');
}

function getRecentIncidents(system, incidents) {
  return incidents
    .filter(incident => incident.system === system)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);
}