console.log('Admin JS loaded.');

document.addEventListener('DOMContentLoaded', async () => {
  const incidentForm = document.getElementById('incident-form');
  const allHealthyBtn = document.getElementById('all-healthy');
  const adminMessages = document.getElementById('admin-messages');
  const lastBuiltEl = document.getElementById('last-built');
  const systemSelect = document.getElementById('system-select');

  // === Load system list from applications.json ===
  try {
    const appsResponse = await fetch('data/applications.json');
    const appsData = await appsResponse.json();
    const apps = appsData;

    // Populate system dropdown
    systemSelect.innerHTML = '<option value="">-- Select System --</option>';
    apps.forEach(app => {
      const option = document.createElement('option');
      option.value = app.system;
      option.textContent = app.system;
      systemSelect.appendChild(option);
    });

    console.log('Loaded systems:', apps.map(a => a.system));
  } catch (err) {
    console.error('Error loading applications.json:', err);
    systemSelect.innerHTML = '<option value="">Error loading systems</option>';
  }

  // === Load lastBuilt from status.json ===
  try {
    const statusResponse = await fetch('data/status.json');
    const statusData = await statusResponse.json();
    lastBuiltEl.textContent = statusData.lastBuilt || 'Unknown';
  } catch (err) {
    console.error('Error loading status.json:', err);
    lastBuiltEl.textContent = 'Error';
  }

  // === Submit New Incident ===
  incidentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(incidentForm);
    const system = formData.get('system');
    const status = formData.get('status');
    const description = formData.get('description');
    const timestamp = new Date().toISOString();

    const filename = `data/incidents/${timestamp.slice(0,10)}-${system.toLowerCase().replace(/\s+/g,'-')}.json`;

    const incidentData = {
      timestamp,
      system,
      status,
      description
    };

    const fileContent = JSON.stringify(incidentData, null, 2);
    const prTitle = `Add incident: ${system} ${timestamp.slice(0,10)}`;

    const prURL = buildGitHubPRURL(filename, fileContent, prTitle);

    adminMessages.innerHTML = `
      <p>Generated PR for new incident:</p>
      <p><a href="${prURL}" target="_blank">${prURL}</a></p>
    `;

    console.log('Generated Incident PR:', { filename, fileContent });
  });

  // === Mark All Healthy ===
  allHealthyBtn.addEventListener('click', async () => {
    const timestamp = new Date().toISOString();

    try {
      const statusResponse = await fetch('data/status.json');
      const statusData = await statusResponse.json();

      // Set all statuses to green
      const updatedStatuses = statusData.statuses.map(s => ({
        ...s,
        status: 'green',
        lastUpdated: timestamp
      }));

      const updatedStatusJson = {
        statuses: updatedStatuses,
        lastBuilt: timestamp
      };

      const fileContent = JSON.stringify(updatedStatusJson, null, 2);
      const prTitle = `Mark all systems healthy (${timestamp.slice(0,10)})`;

      const prURL = buildGitHubPRURL('data/status.json', fileContent, prTitle);

      adminMessages.innerHTML = `
        <p>Generated PR to mark all systems healthy:</p>
        <p><a href="${prURL}" target="_blank">${prURL}</a></p>
      `;

      console.log('Generated All Healthy PR:', { fileContent });

    } catch (err) {
      console.error('Error loading status.json:', err);
      adminMessages.innerHTML = '<p style="color:red;">Error loading status.json.</p>';
    }
  });
});

// === Build GitHub PR URL — basic starter ===
function buildGitHubPRURL(filename, content, title) {
  const repo = 'chavezucf/outage'; // ✅ your repo
  const branch = 'main'; // or 'staging'
  const baseURL = `https://github.com/${repo}/new/${branch}?filename=${encodeURIComponent(filename)}&value=${encodeURIComponent(content)}&title=${encodeURIComponent(title)}`;
  return baseURL;
}