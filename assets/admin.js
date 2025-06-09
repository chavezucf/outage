console.log('Admin JS loaded.');

// === CONFIG ===
const REPO = 'chavezucf/outage';
const BRANCH = 'main';
const MARK_ALL_HEALTHY_WORKFLOW = 'mark-all-healthy.yml';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mainDashboard);
} else {
  mainDashboard();
}

async function mainDashboard() {
  const versionParam = `?v=${new Date().getTime()}`;
  const incidentForm = document.getElementById('incident-form');
  const adminMessages = document.getElementById('admin-messages');
  const lastBuiltEl = document.getElementById('last-built');
  const systemSelect = document.getElementById('system-select');

  // === Load system list from applications.json ===
  try {
    const appsResponse = await fetch(`data/applications.json${versionParam}`);
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
    const statusResponse = await fetch(`data/status.json${versionParam}`);
    const statusData = await statusResponse.json();
    lastBuiltEl.textContent = statusData.lastBuilt ? new Date(statusData.lastBuilt).toLocaleString() : 'Unknown';
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
}

// === Build GitHub PR URL for NEW incident ===
function buildGitHubPRURL(filename, content, title) {
  return `https://github.com/${REPO}/new/${BRANCH}?filename=${encodeURIComponent(filename)}&value=${encodeURIComponent(content)}&title=${encodeURIComponent(title)}`;
}

// === Build GitHub Actions Workflow URL ===
function buildWorkflowURL() {
  return `https://github.com/${REPO}/actions/workflows/${MARK_ALL_HEALTHY_WORKFLOW}`;
}

// === Trigger Mark All Healthy (just opens Actions tab) ===
function triggerMarkAllHealthy() {
  const workflowURL = buildWorkflowURL();
  window.open(workflowURL, '_blank');

  document.getElementById('admin-messages').innerHTML = `
    <p>Opened GitHub Actions tab to run "Mark All Healthy" workflow:</p>
    <p><a href="${workflowURL}" target="_blank">${workflowURL}</a></p>
  `;

  console.log('Opened workflow URL:', workflowURL);
}