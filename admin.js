/**
 * THE VAULT — Administration Controller
 *
 * Secures the private room via database-level super-admin verification.
 * Provides read-only operational telemetry, metrics, and activity streams
 * through Supabase Row Level Security policies.
 */

(function () {
  'use strict';

  async function initAdmin() {
    const auth = window.vaultAuth;

    // DOM Elements
    const accessState = document.querySelector('#admin-access-state');
    const dashboard = document.querySelector('#admin-dashboard');
    const sidebar = document.querySelector('#admin-sidebar');
    const menuToggle = document.querySelector('#admin-menu-toggle');
    const connectionIndicator = document.querySelector('#admin-connection');
    const sectionTitle = document.querySelector('#admin-section-title');
    const overviewSection = document.querySelector('#admin-overview');
    const placeholderSection = document.querySelector('#admin-placeholder');
    const placeholderTitle = document.querySelector('#admin-placeholder-title');
    const placeholderCopy = document.querySelector('#admin-placeholder-copy');
    const accountEmail = document.querySelector('#admin-account-email');
    const sidebarEmail = document.querySelector('#admin-sidebar-email');
    const diagnosticsSection = document.querySelector('#admin-diagnostics');
    const diagnosticsList = document.querySelector('#admin-diagnostics-list');

    const queryErrors = [];
    let verifiedUserId = '';

    // -------------------------------------------------------------------------
    // UI Helpers
    // -------------------------------------------------------------------------

    function showAccessError(message) {
      if (!accessState) return;

      accessState.replaceChildren();

      const label = document.createElement('p');
      label.className = 'admin-kicker';
      label.textContent = 'PRIVATE ROOM / ACCESS ISSUE';

      const heading = document.createElement('h1');
      heading.textContent = 'Entry could not be verified.';

      const detail = document.createElement('span');
      detail.textContent = message;

      const returnLink = document.createElement('a');
      returnLink.className = 'admin-return-overview';
      returnLink.href = 'index.html';
      returnLink.textContent = 'Return to the house ↗';

      accessState.append(label, heading, detail, returnLink);
    }

    function setConnectionStatus(text, statusClass) {
      if (!connectionIndicator) return;
      connectionIndicator.className = `admin-connection ${statusClass}`;
      connectionIndicator.replaceChildren();

      const dot = document.createElement('i');
      connectionIndicator.append(dot, document.createTextNode(text));
    }

    function setMetric(id, value) {
      const element = document.querySelector(`#${id}`);
      if (!element) return;
      element.textContent = value === null
        ? 'Unavailable'
        : Number(value).toLocaleString('en-IN');
    }

    function formatDate(value) {
      if (!value) return 'Date unavailable';
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(value));
    }

    function formatAmount(value) {
      if (value === null || value === undefined) return 'Amount unavailable';
      return `₹${Number(value).toLocaleString('en-IN')}`;
    }

    function setListStatusMessage(id, message, isError = false) {
      const target = document.querySelector(`#${id}`);
      if (!target) return;

      target.replaceChildren();
      const paragraph = document.createElement('p');
      paragraph.className = `admin-list-status${isError ? ' is-error' : ''}`;
      paragraph.textContent = message;
      target.append(paragraph);
    }

    function createActivityRow(kickerText, titleText, detailText) {
      const row = document.createElement('div');
      row.className = 'admin-activity-row';

      const copy = document.createElement('div');

      const kicker = document.createElement('span');
      kicker.className = 'admin-row-kicker';
      kicker.textContent = kickerText;

      const heading = document.createElement('strong');
      heading.textContent = titleText;

      const meta = document.createElement('small');
      meta.textContent = detailText;

      copy.append(kicker, heading, meta);
      row.append(copy);
      return row;
    }

    function renderActivityList(containerId, rows, rowRenderer, emptyMessage) {
      const container = document.querySelector(`#${containerId}`);
      if (!container) return;

      container.replaceChildren();

      if (!rows.length) {
        setListStatusMessage(containerId, emptyMessage, false);
        return;
      }

      rows.forEach(item => {
        container.append(rowRenderer(item));
      });
    }

    function recordQueryError(table, query, error) {
      queryErrors.push({
        table,
        query,
        code: error?.code || 'CLIENT_ERROR',
        message: error?.message || 'The request failed without a message.',
        details: error?.details || '',
        hint: error?.hint || ''
      });
    }

    function renderDiagnostics() {
      if (!diagnosticsList || !diagnosticsSection) return;

      diagnosticsList.replaceChildren();

      if (!queryErrors.length) {
        diagnosticsSection.hidden = true;
        return;
      }

      diagnosticsSection.hidden = false;

      queryErrors.forEach(err => {
        const article = document.createElement('article');
        article.className = 'admin-diagnostic-row';

        const heading = document.createElement('strong');
        heading.textContent = `${err.table} / ${err.query}`;

        const codeBadge = document.createElement('span');
        codeBadge.textContent = err.code;

        const errorMsg = document.createElement('p');
        errorMsg.textContent = err.message;

        article.append(heading, codeBadge, errorMsg);

        if (err.details) {
          const detailNote = document.createElement('small');
          detailNote.textContent = `Details: ${err.details}`;
          article.append(detailNote);
        }

        if (err.hint) {
          const hintNote = document.createElement('small');
          hintNote.textContent = `Hint: ${err.hint}`;
          article.append(hintNote);
        }

        diagnosticsList.append(article);
      });
    }

    // -------------------------------------------------------------------------
    // Data Loading
    // -------------------------------------------------------------------------

    async function countRows(tableName, queryLabel, configFn) {
      try {
        let query = auth.client.from(tableName).select('*', { count: 'exact', head: true });
        if (configFn) query = configFn(query);

        const { count, error } = await query;
        return {
          table: tableName,
          query: queryLabel,
          value: error ? null : (count || 0),
          error
        };
      } catch (err) {
        return { table: tableName, query: queryLabel, value: null, error: err };
      }
    }

    async function fetchRows(tableName, queryLabel, configFn) {
      try {
        return await configFn(auth.client.from(tableName));
      } catch (err) {
        return { data: null, error: err };
      }
    }

    async function loadOverviewData() {
      queryErrors.length = 0;

      // 1. Telemetry Metric Counts
      const metricQueries = await Promise.all([
        countRows('auction_lots', 'total count'),
        countRows('auction_lots', 'published count', q => q.not('published_at', 'is', null)),
        countRows('auction_lots', 'live count', q => q.eq('status', 'live')),
        countRows('auction_lots', 'closed count', q => q.eq('status', 'closed')),
        countRows('bids', 'total count'),
        countRows('profiles', 'member count')
      ]);

      const metricElementIds = [
        'stat-total-lots',
        'stat-published-lots',
        'stat-live-auctions',
        'stat-closed-auctions',
        'stat-total-bids',
        'stat-members'
      ];

      metricQueries.forEach((res, index) => {
        setMetric(metricElementIds[index], res.value);
        if (res.error) recordQueryError(res.table, res.query, res.error);
      });

      // 2. Recent Streams
      const [lotsResult, bidsResult, enquiriesResult] = await Promise.all([
        fetchRows('auction_lots', 'recent lots', q =>
          q.select('id, lot_number, title, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5)
        ),
        fetchRows('bids', 'recent bids', q =>
          q.select('id, lot_id, amount, created_at')
            .order('created_at', { ascending: false })
            .limit(5)
        ),
        fetchRows('contact_messages', 'recent enquiries', q =>
          q.select('id, full_name, enquiry_type, subject, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5)
        )
      ]);

      // Handle Recent Lots
      if (lotsResult.error) {
        recordQueryError('auction_lots', 'recent lots', lotsResult.error);
        setListStatusMessage('recent-lots', 'Recent lots are unavailable from the current database connection.', true);
      } else {
        renderActivityList(
          'recent-lots',
          lotsResult.data || [],
          lot => createActivityRow(lot.status.toUpperCase(), lot.title, `LOT ${lot.lot_number} / ${formatDate(lot.created_at)}`),
          'No lots have been recorded yet.'
        );
      }

      // Handle Recent Bids
      if (bidsResult.error) {
        recordQueryError('bids', 'recent bids', bidsResult.error);
        setListStatusMessage('recent-bids', 'Recent bids are unavailable from the current database connection.', true);
      } else {
        renderActivityList(
          'recent-bids',
          bidsResult.data || [],
          bid => createActivityRow('RECORDED BID', formatAmount(bid.amount), `LOT ${String(bid.lot_id).slice(0, 8)} / ${formatDate(bid.created_at)}`),
          'No bids have been recorded yet.'
        );
      }

      // Handle Recent Enquiries
      if (enquiriesResult.error) {
        recordQueryError('contact_messages', 'recent enquiries', enquiriesResult.error);
        setListStatusMessage('recent-enquiries', 'Recent enquiries are unavailable from the current database connection.', true);
      } else {
        renderActivityList(
          'recent-enquiries',
          enquiriesResult.data || [],
          enquiry => createActivityRow(enquiry.status.toUpperCase(), enquiry.subject, `${enquiry.enquiry_type} / ${formatDate(enquiry.created_at)}`),
          'No enquiries have been recorded yet.'
        );
      }

      // 3. Diagnostics & Connection Badge
      renderDiagnostics();
      const hasErrors = queryErrors.length > 0;
      setConnectionStatus(
        hasErrors ? 'Connected with limitations' : 'Supabase connected',
        hasErrors ? 'is-limited' : 'is-connected'
      );
    }

    // -------------------------------------------------------------------------
    // Navigation & Layout
    // -------------------------------------------------------------------------

    function closeMobileSidebar() {
      if (!sidebar) return;
      sidebar.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }

    function switchSection(sectionKey, sectionLabel) {
      if (sectionTitle) sectionTitle.textContent = sectionLabel;

      document.querySelectorAll('[data-admin-section]').forEach(link => {
        link.classList.toggle('active', link.dataset.adminSection === sectionKey);
      });

      const isOverview = sectionKey === 'overview';

      if (overviewSection) overviewSection.hidden = !isOverview;
      if (placeholderSection) placeholderSection.hidden = isOverview;

      if (!isOverview) {
        if (placeholderTitle) placeholderTitle.textContent = `${sectionLabel} is being prepared.`;
        if (placeholderCopy) {
          placeholderCopy.textContent = `${sectionLabel} management has not been implemented yet. This read-only foundation does not provide simulated actions or controls.`;
        }
      }

      closeMobileSidebar();
    }

    async function handleLogout() {
      const result = await auth.signOut();
      if (result.error) {
        setConnectionStatus('Logout failed', 'is-limited');
        return;
      }
      window.location.replace('auth.html');
    }

    // -------------------------------------------------------------------------
    // Authority & Session Verification
    // -------------------------------------------------------------------------

    if (!auth || !auth.configured || !auth.client) {
      showAccessError('Supabase authentication is not configured for this environment.');
      return;
    }

    try {
      const sessionResult = await auth.getSession();
      if (sessionResult.error) {
        showAccessError('Your session could not be restored. Please sign in again.');
        return;
      }
      if (!sessionResult.session) {
        window.location.replace('auth.html?next=admin');
        return;
      }

      const adminResult = await auth.isSuperAdmin();
      if (adminResult.error) {
        showAccessError('The database could not verify administrator authority. No dashboard data was loaded.');
        return;
      }
      if (!adminResult.authorized) {
        showAccessError('Access denied. This account is not the designated super-admin.');
        return;
      }

      // Authority verified
      verifiedUserId = sessionResult.session.user.id;
      const userEmail = sessionResult.session.user.email || 'Verified super-admin';

      if (accountEmail) accountEmail.textContent = userEmail;
      if (sidebarEmail) sidebarEmail.textContent = userEmail;

      if (accessState) accessState.hidden = true;
      if (dashboard) dashboard.hidden = false;

      // Bind Section Navigation
      document.querySelectorAll('[data-admin-section]').forEach(link => {
        link.addEventListener('click', event => {
          event.preventDefault();
          switchSection(link.dataset.adminSection, link.dataset.sectionLabel);
          window.history.replaceState(null, '', `#${link.dataset.adminSection}`);
        });
      });

      // Bind Mobile Menu Toggle
      menuToggle?.addEventListener('click', () => {
        const isOpen = sidebar?.classList.toggle('is-open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
      });

      // Bind Logout Actions
      document.querySelectorAll('#admin-top-logout, #admin-sidebar-logout').forEach(button => {
        button.addEventListener('click', handleLogout);
      });

      // Restore requested section or default to overview
      const initialSectionKey = window.location.hash.slice(1);
      const matchedLink = document.querySelector(`[data-admin-section="${initialSectionKey}"]`);
      switchSection(
        matchedLink ? initialSectionKey : 'overview',
        matchedLink ? matchedLink.dataset.sectionLabel : 'Overview'
      );

      // Load initial overview data
      await loadOverviewData();

      // Monitor session invalidation
      auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          window.location.replace('auth.html');
        } else if (session.user.id !== verifiedUserId) {
          window.location.reload();
        }
      });
    } catch (err) {
      console.error('Administration entry error:', err);
      showAccessError('The administration room could not be loaded. Please try again.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();
