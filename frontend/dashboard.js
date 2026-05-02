import { getApiUrl, API_ENDPOINTS } from './config.js';

const currentUserRaw = sessionStorage.getItem('currentUser');
const token = sessionStorage.getItem('jwtToken');
const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
const isAdminPage = window.location.pathname.endsWith('/admin-dashboard.html') || window.location.pathname.endsWith('admin-dashboard.html');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showDashboardConfirm(message, title = 'Please Confirm', confirmButtonText = 'Yes') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'hs-alert-overlay';
    overlay.innerHTML = `
      <div class="hs-alert-card" role="dialog" aria-modal="true" aria-live="polite">
        <h3 class="hs-alert-title">${escapeHtml(title)}</h3>
        <div class="hs-alert-body"><p>${escapeHtml(message)}</p></div>
        <div class="hs-alert-actions">
          <button type="button" class="hs-alert-btn hs-alert-cancel">Cancel</button>
          <button type="button" class="hs-alert-btn hs-alert-confirm">${escapeHtml(confirmButtonText)}</button>
        </div>
      </div>
    `;

    let isClosed = false;
    const close = (result) => {
      if (isClosed) return;
      isClosed = true;
      document.removeEventListener('keydown', onEsc);
      overlay.classList.remove('is-visible');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }, 140);
    };

    const onEsc = (event) => {
      if (event.key === 'Escape') close(false);
    };

    const confirmBtn = overlay.querySelector('.hs-alert-confirm');
    const cancelBtn = overlay.querySelector('.hs-alert-cancel');

    if (confirmBtn) confirmBtn.addEventListener('click', () => close(true));
    if (cancelBtn) cancelBtn.addEventListener('click', () => close(false));

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close(false);
    });

    document.addEventListener('keydown', onEsc);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
  });
}

function showDashboardInputDialog({
  title = 'Add Note',
  message = 'Enter your note below:',
  confirmButtonText = 'Save',
  placeholder = 'Type your note...',
  initialValue = ''
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'hs-alert-overlay';
    overlay.innerHTML = `
      <div class="hs-alert-card" role="dialog" aria-modal="true" aria-live="polite">
        <h3 class="hs-alert-title">${escapeHtml(title)}</h3>
        <div class="hs-alert-body">
          <p>${escapeHtml(message)}</p>
          <textarea class="hs-alert-textarea" rows="4" placeholder="${escapeHtml(placeholder)}">${escapeHtml(initialValue)}</textarea>
          <p class="hs-alert-error" aria-live="polite"></p>
        </div>
        <div class="hs-alert-actions">
          <button type="button" class="hs-alert-btn hs-alert-cancel">Cancel</button>
          <button type="button" class="hs-alert-btn hs-alert-confirm">${escapeHtml(confirmButtonText)}</button>
        </div>
      </div>
    `;

    let isClosed = false;
    const close = (result) => {
      if (isClosed) return;
      isClosed = true;
      document.removeEventListener('keydown', onEsc);
      overlay.classList.remove('is-visible');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }, 140);
    };

    const onEsc = (event) => {
      if (event.key === 'Escape') close(null);
    };

    const textarea = overlay.querySelector('.hs-alert-textarea');
    const errorText = overlay.querySelector('.hs-alert-error');
    const confirmBtn = overlay.querySelector('.hs-alert-confirm');
    const cancelBtn = overlay.querySelector('.hs-alert-cancel');

    const submit = () => {
      const value = (textarea?.value || '').trim();
      if (!value) {
        if (errorText) errorText.textContent = 'Note cannot be empty.';
        textarea?.focus();
        return;
      }
      close(value);
    };

    if (confirmBtn) confirmBtn.addEventListener('click', submit);
    if (cancelBtn) cancelBtn.addEventListener('click', () => close(null));
    if (textarea) {
      textarea.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          submit();
        }
      });
      textarea.addEventListener('input', () => {
        if (errorText) errorText.textContent = '';
      });
    }

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close(null);
    });

    document.addEventListener('keydown', onEsc);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add('is-visible');
      textarea?.focus();
      textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  });
}

function showDashboardAlert(message, title = 'Notice', buttonText = 'OK') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'hs-alert-overlay';
    overlay.innerHTML = `
      <div class="hs-alert-card" role="dialog" aria-modal="true" aria-live="polite">
        <h3 class="hs-alert-title">${escapeHtml(title)}</h3>
        <div class="hs-alert-body"><p>${escapeHtml(message)}</p></div>
        <div class="hs-alert-actions">
          <button type="button" class="hs-alert-btn hs-alert-confirm">${escapeHtml(buttonText)}</button>
        </div>
      </div>
    `;

    let isClosed = false;
    const close = () => {
      if (isClosed) return;
      isClosed = true;
      document.removeEventListener('keydown', onEsc);
      overlay.classList.remove('is-visible');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve();
      }, 140);
    };

    const onEsc = (event) => {
      if (event.key === 'Escape') close();
    };

    const okBtn = overlay.querySelector('.hs-alert-confirm');
    if (okBtn) okBtn.addEventListener('click', close);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });

    document.addEventListener('keydown', onEsc);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add('is-visible');
      okBtn?.focus();
    });
  });
}

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
    signOutBtn.addEventListener('click', async () => {
      const confirmed = await showDashboardConfirm('Are you sure you want to sign out of your account?', 'Logout', 'Logout');
      if (!confirmed) return;

      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('jwtToken');
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

function buildSkeletonCards(count = 3) {
  return Array.from({ length: count }).map(() => `
    <div class="dashboard-skeleton-card">
      <div class="dashboard-skeleton-line w-24"></div>
      <div class="dashboard-skeleton-line w-full"></div>
      <div class="dashboard-skeleton-line w-3\/4"></div>
    </div>
  `).join('');
}

function buildSkeletonRows(count = 5) {
  return Array.from({ length: count }).map(() => `
    <tr>
      <td class="px-4 py-3"><div class="dashboard-skeleton-line w-28"></div></td>
      <td class="px-4 py-3"><div class="dashboard-skeleton-line w-full"></div></td>
      <td class="px-4 py-3"><div class="dashboard-skeleton-line w-16"></div></td>
    </tr>
  `).join('');
}

function renderDashboardSkeleton(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (type === 'table') {
    container.innerHTML = `
      <div class="overflow-x-auto admin-saved-table-wrap">
        <table class="min-w-full admin-saved-table dashboard-skeleton-table" aria-hidden="true">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium uppercase">User</th>
              <th class="px-4 py-2 text-left text-xs font-medium uppercase">Ingredients</th>
              <th class="px-4 py-2 text-left text-xs font-medium uppercase">Status</th>
            </tr>
          </thead>
          <tbody>${buildSkeletonRows(5)}</tbody>
        </table>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="dashboard-skeleton-list" aria-hidden="true">${buildSkeletonCards(3)}</div>`;
}

function renderUserSavedResults(results) {
  const container = document.getElementById('savedResultsList');
  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = '<div class="dashboard-empty-state"><i class="fas fa-save text-2xl mb-2"></i><p>No saved results yet</p></div>';
    return;
  }

  const isMobile = window.innerWidth < 768;
  container.innerHTML = results.map((result) => {
    const resultData = typeof result.result_data === 'string' ? JSON.parse(result.result_data) : (result.result_data || {});
    const status = (resultData.overallStatus || 'unknown').toLowerCase();
    const statusClass = `status-${status}`;

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
      <div class="saved-result-card">
        <div class="flex justify-between items-start gap-3">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <h5 class="dashboard-card-title">Scan Result</h5>
              <span class="dashboard-status-pill ${statusClass}">${status}</span>
            </div>
            <p class="dashboard-card-text">${resultData.ingredients || 'No ingredients captured'}</p>
          </div>
          <button class="delete-saved-result dashboard-delete-btn" data-id="${result._id || result.id}"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.delete-saved-result').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const confirmed = await showDashboardConfirm('Delete this saved result?', 'Delete Saved Result', 'Delete');
      if (!confirmed) return;
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
    container.innerHTML = '<div class="dashboard-empty-state"><i class="fas fa-save text-2xl mb-2"></i><p>No saved results found</p></div>';
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
                <span class="status-pill status-${status}">${status}</span>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto admin-saved-table-wrap">
      <table class="min-w-full admin-saved-table">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase">User</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase">Ingredients</th>
            <th class="px-4 py-2 text-left text-xs font-medium uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          ${results.map((result) => {
            const data = typeof result.result_data === 'string' ? JSON.parse(result.result_data) : (result.result_data || {});
            const status = (data.overallStatus || 'unknown').toLowerCase();
            return `
              <tr>
                <td class="px-4 py-3 text-sm">${result.user?.name || result.user_name || 'Unknown'}</td>
                <td class="px-4 py-3 text-sm">${data.ingredients || '-'}</td>
                <td class="px-4 py-3 text-sm"><span class="dashboard-status-pill status-${status}">${status}</span></td>
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
              <p class="dashboard-report-meta">${report.user_name || 'Unknown user'} ${report.user_email ? `(${report.user_email})` : ''}</p>
            </div>
            <span class="status-pill ${statusClass}">${report.status}</span>
          </div>
          <div class="mt-2">
            <p class="label">Reason</p>
            <p class="value">${report.reason}</p>
          </div>
          ${report.status === 'pending' ? `
            <div class="dashboard-report-actions">
              <button type="button" class="report-status dashboard-report-action bg-green-600 text-white" data-id="${report.id}" data-status="solved">Solve</button>
              <button type="button" class="report-status dashboard-report-action bg-red-600 text-white" data-id="${report.id}" data-status="rejected">Reject</button>
              <button type="button" class="report-note dashboard-report-action action-note bg-blue-600 text-white" data-id="${report.id}">Add Note</button>
            </div>
          ` : `
            <div class="dashboard-report-actions">
              <button type="button" class="report-note dashboard-report-action action-note bg-blue-600 text-white" data-id="${report.id}">Add Note</button>
            </div>
          `}
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
        ${report.status === 'pending' ? `
          <div class="flex flex-wrap gap-2">
            <button type="button" class="report-status px-3 py-1 rounded bg-green-600 text-white text-sm" data-id="${report.id}" data-status="solved">Solve</button>
            <button type="button" class="report-status px-3 py-1 rounded bg-red-600 text-white text-sm" data-id="${report.id}" data-status="rejected">Reject</button>
            <button type="button" class="report-note px-3 py-1 rounded bg-blue-600 text-white text-sm" data-id="${report.id}">Add Note</button>
          </div>
        ` : `
          <div class="flex flex-wrap gap-2">
            <button type="button" class="report-note px-3 py-1 rounded bg-blue-600 text-white text-sm" data-id="${report.id}">Add Note</button>
          </div>
        `}
        ${report.admin_note ? `<p class="text-sm text-blue-700 mt-2"><strong>Note:</strong> ${report.admin_note}</p>` : ''}
      </div>
    `;
  }).join('');

  container.onclick = async (event) => {
    const statusButton = event.target.closest('.report-status');
    const noteButton = event.target.closest('.report-note');
    const actionButton = statusButton || noteButton;
    if (!actionButton) return;

    event.preventDefault();

    const id = actionButton.getAttribute('data-id');
    if (!id) {
      await showDashboardAlert('Invalid report ID. Please refresh and try again.', 'Action Error');
      return;
    }

    try {
      actionButton.disabled = true;

      if (statusButton) {
        const status = statusButton.getAttribute('data-status');
        const actionLabel = status === 'solved' ? 'Solve' : 'Reject';
        const confirmed = await showDashboardConfirm(
          `Are you sure you want to ${actionLabel.toLowerCase()} this report?`,
          `${actionLabel} Report`,
          actionLabel
        );
        if (!confirmed) return;

        await fetchJson(API_ENDPOINTS.UPDATE_REPORT_STATUS(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        await loadAdminReports();
        return;
      }

      const currentStatus = (event.target.closest('.admin-saved-mobile-card') || event.target.closest('.bg-white'))?.querySelector('.status-pill')?.textContent?.trim() || 'pending';
      const isPending = currentStatus === 'pending';

      const note = await showDashboardInputDialog({
        title: 'Add Admin Note',
        message: isPending ? 'Write a note for this report. Saving will mark it as solved.' : 'Add a note to this report (status will not change).',
        confirmButtonText: 'Save Note',
        placeholder: 'Enter admin note...'
      });
      if (!note) return;

      const payload = { admin_note: note };
      if (isPending) {
        payload.status = 'solved';
      } else {
        payload.status = currentStatus;
      }

      await fetchJson(API_ENDPOINTS.UPDATE_REPORT_STATUS(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await loadAdminReports();
    } catch (error) {
      await showDashboardAlert(error.message || 'Failed to update report', 'Update Failed');
    } finally {
      actionButton.disabled = false;
    }
  };
}

function renderAdminMetrics(metrics = {}) {
  const container = document.getElementById('adminOverviewStats');
  if (!container) return;

  const totalUsers = Number(metrics.total_users || 0);
  const totalTestimonials = Number(metrics.total_testimonials || 0);

  container.innerHTML = `
    <article class="admin-overview-card" aria-label="Total users">
      <p class="admin-overview-label">Total Users</p>
      <p class="admin-overview-value">${totalUsers}</p>
      <p class="admin-overview-note">Excludes default seeded admin and default user.</p>
    </article>
    <article class="admin-overview-card" aria-label="Total testimonials">
      <p class="admin-overview-label">Total Testimonials</p>
      <p class="admin-overview-value">${totalTestimonials}</p>
      <p class="admin-overview-note">All testimonial entries submitted by users.</p>
    </article>
  `;
}

async function loadUserSavedResults() {
  renderDashboardSkeleton('savedResultsList', 'cards');
  const data = await fetchJson(API_ENDPOINTS.GET_SAVED_RESULTS);
  renderUserSavedResults(data.saved_results || []);
}

async function loadUserReports() {
  renderDashboardSkeleton('userReportsList', 'cards');
  const data = await fetchJson(API_ENDPOINTS.GET_USER_REPORTS);
  renderUserReports(data.reports || []);
}

async function loadAdminSavedResults() {
  renderDashboardSkeleton('adminSavedResultsList', window.innerWidth < 768 ? 'cards' : 'table');
  const data = await fetchJson(API_ENDPOINTS.GET_SAVED_RESULTS);
  renderAdminSavedResults(data.saved_results || []);
}

async function loadAdminMetrics() {
  const container = document.getElementById('adminOverviewStats');
  if (container) {
    container.innerHTML = '<div class="dashboard-skeleton-list" aria-hidden="true">' + buildSkeletonCards(2) + '</div>';
  }

  const data = await fetchJson(API_ENDPOINTS.GET_ADMIN_DASHBOARD_METRICS);
  renderAdminMetrics(data.metrics || {});
}

async function loadAdminReports() {
  renderDashboardSkeleton('adminReportsList', 'cards');
  const data = await fetchJson(API_ENDPOINTS.GET_ADMIN_REPORTS);
  renderAdminReports(data.reports || []);
}

function wireAccountDeletion() {
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (!deleteAccountBtn) return;

  deleteAccountBtn.addEventListener('click', async () => {
    const firstConfirm = await showDashboardConfirm(
      'Are you sure? Deleting your account will permanently remove your data.',
      'Delete Account',
      'Continue'
    );
    if (!firstConfirm) return;

    const confirmationText = await showDashboardInputDialog({
      title: 'Final Confirmation',
      message: 'Type DELETE to permanently remove your account and data.',
      confirmButtonText: 'Delete Permanently',
      placeholder: 'Type DELETE'
    });

    if (!confirmationText) return;

    if (confirmationText.trim().toUpperCase() !== 'DELETE') {
      await showDashboardAlert('Confirmation text did not match. Account deletion was cancelled.', 'Deletion Cancelled');
      return;
    }

    try {
      deleteAccountBtn.disabled = true;
      await fetchJson(API_ENDPOINTS.DELETE_MY_ACCOUNT, { method: 'DELETE' });

      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('jwtToken');

      await showDashboardAlert('Your account and data have been deleted permanently.', 'Account Deleted');
      redirectToHome();
    } catch (error) {
      await showDashboardAlert(error.message || 'Failed to delete account', 'Deletion Failed');
    } finally {
      deleteAccountBtn.disabled = false;
    }
  });
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
      } else if (target === 'reports') {
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

      if (target === 'admin-overview') {
        await loadAdminMetrics();
      } else if (target === 'admin-saved-results') {
        await loadAdminSavedResults();
      } else if (target === 'admin-reports') {
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
    await loadAdminMetrics();
  } else {
    wireUserTabs();
    wireAccountDeletion();
    await loadUserSavedResults();
  }
}

init().catch(async (error) => {
  console.error(error);
  await showDashboardAlert(error.message || 'Failed to load dashboard', 'Dashboard Error');
});
