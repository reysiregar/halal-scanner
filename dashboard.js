import { getApiUrl, API_ENDPOINTS } from './config.js';

const currentUserRaw = localStorage.getItem('currentUser');
const token = localStorage.getItem('jwtToken');
const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
const isAdminPage = window.location.pathname.endsWith('/admin-dashboard.html') || window.location.pathname.endsWith('admin-dashboard.html');

function redirectToHome() {
  window.location.href = 'index.html?stay=1';
}

function requireAuth() {
  if (!currentUser || !token) {
    redirectToHome();
    return false;
  }

  const isAdminUser = currentUser.email === 'admin@halalscanner.com';
  if (isAdminPage && !isAdminUser) {
    redirectToHome();
    return false;
  }

  if (!isAdminPage && isAdminUser) {
    window.location.href = 'admin-dashboard.html';
    return false;
  }

  return true;
}

function wireHeaderActions() {
  const backHomeBtn = document.getElementById('backHomeBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const greeting = document.getElementById('dashboardGreeting');

  if (greeting && currentUser?.name) {
    greeting.textContent = `Welcome back, ${currentUser.name}. ${isAdminPage ? 'Review reports and saved scans.' : 'Manage your saved scans and reports.'}`;
  }

  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      redirectToHome();
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('jwtToken');
      redirectToHome();
    });
  }
}

async function fetchJson(endpoint, options = {}) {
  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

function renderUserSavedResults(results) {
  const container = document.getElementById('savedResultsList');
  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-save text-2xl mb-2"></i><p>No saved results yet</p></div>';
    return;
  }

  const isMobile = window.innerWidth < 768;
  container.innerHTML = results.map((result) => {
    const resultData = typeof result.result_data === 'string' ? JSON.parse(result.result_data) : (result.result_data || {});
    const status = (resultData.overallStatus || 'unknown').toLowerCase();
    const statusClass = {
      halal: 'bg-green-100 text-green-800',
      haram: 'bg-red-100 text-red-800',
      mashbooh: 'bg-yellow-100 text-yellow-800',
      unknown: 'bg-gray-100 text-gray-800'
    }[status] || 'bg-gray-100 text-gray-800';

    if (isMobile) {
      return `
        <article class="admin-saved-mobile-card">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="label">Scan Result</p>
              <p class="value font-medium">${resultData.ingredients || 'No ingredients captured'}</p>
            </div>
            <button class="delete-saved-result text-gray-400 hover:text-red-600 shrink-0" data-id="${result._id || result.id}" aria-label="Delete saved result"><i class="fas fa-trash"></i></button>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <span class="status-pill ${statusClass}">${status}</span>
          </div>
        </article>
      `;
    }

    return `
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div class="flex justify-between items-start gap-3">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h5 class="font-medium text-gray-900">Scan Result</h5>
              <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${status}</span>
            </div>
            <p class="text-sm text-gray-600">${resultData.ingredients || 'No ingredients captured'}</p>
          </div>
          <button class="delete-saved-result text-gray-400 hover:text-red-600" data-id="${result._id || result.id}"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.delete-saved-result').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      if (!confirm('Delete this saved result?')) return;
      await fetchJson(API_ENDPOINTS.DELETE_SAVED_RESULT(id), { method: 'DELETE' });
      await loadUserSavedResults();
    });
  });
}

function renderUserReports(reports) {
  const container = document.getElementById('userReportsList');
  if (!container) return;

  if (!reports || reports.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-flag text-2xl mb-2"></i><p>No reports yet</p></div>';
    return;
  }

  const isMobile = window.innerWidth < 768;
  container.innerHTML = reports.map((report) => {
    const statusClass = {
      pending: 'bg-yellow-100 text-yellow-800',
      solved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }[report.status] || 'bg-gray-100 text-gray-800';

    if (isMobile) {
      return `
        <article class="admin-saved-mobile-card">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="label">Report Item</p>
              <p class="value font-medium">${report.item_name}</p>
            </div>
            <span class="status-pill ${statusClass}">${report.status}</span>
          </div>
          <div class="mt-2">
            <p class="label">Reason</p>
            <p class="value">${report.reason}</p>
          </div>
          ${report.admin_note ? `<div class="mt-2"><p class="label">Admin note</p><p class="value text-blue-700">${report.admin_note}</p></div>` : ''}
        </article>
      `;
    }

    return `
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-start justify-between mb-2">
          <h5 class="font-medium">${report.item_name}</h5>
          <span class="text-xs px-2 py-1 rounded-full ${statusClass}">${report.status}</span>
        </div>
        <p class="text-sm text-gray-600 mb-2">${report.reason}</p>
        ${report.admin_note ? `<p class="text-sm text-blue-700"><strong>Admin note:</strong> ${report.admin_note}</p>` : ''}
      </div>
    `;
  }).join('');
}

function renderAdminSavedResults(results) {
  const container = document.getElementById('adminSavedResultsList');
  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-save text-2xl mb-2"></i><p>No saved results found</p></div>';
    return;
  }

  if (window.innerWidth < 768) {
    container.innerHTML = `
      <div class="admin-saved-mobile-list">
        ${results.map((result) => {
          const data = typeof result.result_data === 'string' ? JSON.parse(result.result_data) : (result.result_data || {});
          const status = (data.overallStatus || 'unknown').toLowerCase();
          return `
            <article class="admin-saved-mobile-card">
              <div>
                <p class="label">User</p>
                <p class="value">${result.user?.name || result.user_name || 'Unknown'}</p>
              </div>
              <div class="mt-2">
                <p class="label">Ingredients</p>
                <p class="value">${data.ingredients || '-'}</p>
              </div>
              <div class="mt-2">
                <p class="label">Status</p>
                <span class="status-pill">${status}</span>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ingredients</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          ${results.map((result) => {
            const data = typeof result.result_data === 'string' ? JSON.parse(result.result_data) : (result.result_data || {});
            return `
              <tr>
                <td class="px-4 py-3 text-sm text-gray-700">${result.user?.name || result.user_name || 'Unknown'}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${data.ingredients || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${data.overallStatus || 'unknown'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminReports(reports) {
  const container = document.getElementById('adminReportsList');
  if (!container) return;

  if (!reports || reports.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-flag text-2xl mb-2"></i><p>No reports to review</p></div>';
    return;
  }

  const isMobile = window.innerWidth < 768;
  container.innerHTML = reports.map((report) => {
    const statusClass = {
      pending: 'bg-yellow-100 text-yellow-800',
      solved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }[report.status] || 'bg-gray-100 text-gray-800';

    if (isMobile) {
      return `
        <article class="admin-saved-mobile-card">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="label">Reported item</p>
              <p class="value font-medium">${report.item_name}</p>
              <p class="value text-sm text-gray-500">${report.user_name || 'Unknown user'} ${report.user_email ? `(${report.user_email})` : ''}</p>
            </div>
            <span class="status-pill ${statusClass}">${report.status}</span>
          </div>
          <div class="mt-2">
            <p class="label">Reason</p>
            <p class="value">${report.reason}</p>
          </div>
          <div class="mt-3 flex flex-col gap-2">
            <button class="report-status px-3 py-2 rounded bg-green-600 text-white text-sm" data-id="${report.id}" data-status="solved">Solve</button>
            <button class="report-status px-3 py-2 rounded bg-red-600 text-white text-sm" data-id="${report.id}" data-status="rejected">Reject</button>
            <button class="report-note px-3 py-2 rounded bg-blue-600 text-white text-sm" data-id="${report.id}">Add Note</button>
          </div>
          ${report.admin_note ? `<p class="text-sm text-blue-700 mt-2"><strong>Note:</strong> ${report.admin_note}</p>` : ''}
        </article>
      `;
    }

    return `
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h5 class="font-medium">${report.item_name}</h5>
            <p class="text-sm text-gray-600">${report.user_name || 'Unknown user'} (${report.user_email || '-'})</p>
          </div>
          <span class="text-xs px-2 py-1 rounded-full ${statusClass}">${report.status}</span>
        </div>
        <p class="text-sm text-gray-600 mb-3">${report.reason}</p>
        <div class="flex flex-wrap gap-2">
          <button class="report-status px-3 py-1 rounded bg-green-600 text-white text-sm" data-id="${report.id}" data-status="solved">Solve</button>
          <button class="report-status px-3 py-1 rounded bg-red-600 text-white text-sm" data-id="${report.id}" data-status="rejected">Reject</button>
          <button class="report-note px-3 py-1 rounded bg-blue-600 text-white text-sm" data-id="${report.id}">Add Note</button>
        </div>
        ${report.admin_note ? `<p class="text-sm text-blue-700 mt-2"><strong>Note:</strong> ${report.admin_note}</p>` : ''}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.report-status').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const status = button.getAttribute('data-status');
      await fetchJson(API_ENDPOINTS.UPDATE_REPORT_STATUS(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await loadAdminReports();
    });
  });

  container.querySelectorAll('.report-note').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const note = prompt('Enter admin note:');
      if (!note) return;
      await fetchJson(API_ENDPOINTS.UPDATE_REPORT_STATUS(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'solved', admin_note: note })
      });
      await loadAdminReports();
    });
  });
}

async function loadUserSavedResults() {
  const data = await fetchJson(API_ENDPOINTS.GET_SAVED_RESULTS);
  renderUserSavedResults(data.saved_results || []);
}

async function loadUserReports() {
  const data = await fetchJson(API_ENDPOINTS.GET_USER_REPORTS);
  renderUserReports(data.reports || []);
}

async function loadAdminSavedResults() {
  const data = await fetchJson(API_ENDPOINTS.GET_SAVED_RESULTS);
  renderAdminSavedResults(data.saved_results || []);
}

async function loadAdminReports() {
  const data = await fetchJson(API_ENDPOINTS.GET_ADMIN_REPORTS);
  renderAdminReports(data.reports || []);
}

function wireUserTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const target = button.getAttribute('data-tab');
      tabButtons.forEach((b) => {
        b.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
        b.classList.add('text-gray-500');
        b.setAttribute('aria-selected', 'false');
      });
      button.classList.add('active', 'border-indigo-500', 'text-indigo-600');
      button.classList.remove('text-gray-500');
      button.setAttribute('aria-selected', 'true');

      tabContents.forEach((c) => c.classList.add('hidden'));
      const targetContent = document.getElementById(`${target}-tab`);
      if (targetContent) targetContent.classList.remove('hidden');

      if (target === 'saved-results') {
        await loadUserSavedResults();
      } else {
        await loadUserReports();
      }
    });
  });
}

function wireAdminTabs() {
  const tabButtons = document.querySelectorAll('.admin-tab-button');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const target = button.getAttribute('data-tab');
      tabButtons.forEach((b) => {
        b.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
        b.classList.add('text-gray-500');
        b.setAttribute('aria-selected', 'false');
      });
      button.classList.add('active', 'border-indigo-500', 'text-indigo-600');
      button.classList.remove('text-gray-500');
      button.setAttribute('aria-selected', 'true');

      tabContents.forEach((c) => c.classList.add('hidden'));
      const targetContent = document.getElementById(`${target}-tab`);
      if (targetContent) targetContent.classList.remove('hidden');

      if (target === 'admin-saved-results') {
        await loadAdminSavedResults();
      } else {
        await loadAdminReports();
      }
    });
  });
}

async function init() {
  if (!requireAuth()) return;
  wireHeaderActions();

  if (isAdminPage) {
    wireAdminTabs();
    await loadAdminSavedResults();
    await loadAdminReports();
  } else {
    wireUserTabs();
    await loadUserSavedResults();
    await loadUserReports();
  }
}

init().catch((error) => {
  console.error(error);
  alert(error.message || 'Failed to load dashboard');
});
