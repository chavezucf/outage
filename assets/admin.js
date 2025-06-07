console.log('Admin JS loaded.');

document.addEventListener('DOMContentLoaded', async () => {
  const incidentForm = document.getElementById('incident-form');
  const allHealthyBtn = document.getElementById('all-healthy');
  const adminMessages = document.getElementById('admin-messages');
  const lastBuiltEl = document.getElementById('last-built');

  // Load lastBuilt from status.json
  try {
    const statusResponse = await fetch('data/status.json');
    const statusData = await statusResponse.json();
    lastBuiltEl.textContent = new Date(statusData.lastBuilt).toLocaleString() || 'Unknown';
  } catch (err) {
    console.error('Error loading status.json:', err);
    lastBuiltEl.textContent = 'Error';
  }

  // Submit New Incident
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

  // Mark All Healthy
  allHealthyBtn.addEventListener('click', async () => {
    const timestamp = new Date().toISOString();

    // Load current statuses
    try {
      const statusResponse = await fetch('data/status.json');
      const statusData = await statusResponse.json();

      // Set all to green
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

// Build GitHub PR URL — basic starter
function buildGitHubPRURL(filename, content, title) {
  const repo = 'your-org/your-repo'; // TODO: configure
  const branch = 'main'; // or 'staging' if you prefer
  const baseURL = `https://github.com/${repo}/new/${branch}?filename=${encodeURIComponent(filename)}&value=${encodeURIComponent(content)}&title=${encodeURIComponent(title)}`;
  return baseURL;
}