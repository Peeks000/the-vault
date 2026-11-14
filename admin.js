(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    const auth = window.vaultAuth;
    const accessState = document.querySelector('#admin-access-state');
    const dashboard = document.querySelector('#admin-dashboard');
    const sidebar = document.querySelector('#admin-sidebar');
    const menuToggle = document.querySelector('#admin-menu-toggle');
    const connection = document.querySelector('#admin-connection');
    const sectionTitle = document.querySelector('#admin-section-title');
    const overview = document.querySelector('#admin-overview');
    const placeholder = document.querySelector('#admin-placeholder');
    const placeholderTitle = document.querySelector('#admin-placeholder-title');
    const placeholderCopy = document.querySelector('#admin-placeholder-copy');
    const accountEmail = document.querySelector('#admin-account-email');
    const sidebarEmail = document.querySelector('#admin-sidebar-email');
    const diagnostics = document.querySelector('#admin-diagnostics');
    const diagnosticsList = document.querySelector('#admin-diagnostics-list');
    const queryErrors = [];
    let verifiedUserId = '';

    function showAccessError(message) {
      accessState.replaceChildren();
      const label = document.createElement('p');
      label.className = 'admin-kicker';
      label.textContent = 'PRIVATE ROOM / ACCESS ISSUE';
      const heading = document.createElement('h1');
      heading.textContent = 'Entry could not be verified.';
      const detail = document.createElement('span');
      detail.textContent = message;
      const link = document.createElement('a');
      link.className = 'admin-return-overview';
      link.href = 'index.html';
      link.textContent = 'Return to the house ↗';
      accessState.append(label, heading, detail, link);
    }

    function setConnection(text, state) {
      connection.className = `admin-connection ${state}`;
      connection.replaceChildren();
      const indicator = document.createElement('i');
      connection.append(indicator, document.createTextNode(text));
    }

    function setMetric(id, value) {
      document.querySelector(`#${id}`).textContent = value === null ? 'Unavailable' : Number(value).toLocaleString('en-IN');
    }

    function formatDate(value) {
      if (!value) return 'Date unavailable';
      return new Intl.DateTimeFormat('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value));
    }

    function formatAmount(value) {
      if (value === null || value === undefined) return 'Amount unavailable';
      return `₹${Number(value).toLocaleString('en-IN')}`;
    }

    function setListMessage(id, message, isError) {
      const target = document.querySelector(`#${id}`);
      target.replaceChildren();
      const item = document.createElement('p');
      item.className = `admin-list-status${isError ? ' is-error' : ''}`;
      item.textContent = message;
      target.append(item);
    }

    function appendActivity(id, rows, renderRow, emptyMessage) {
      const target = document.querySelector(`#${id}`);
      target.replaceChildren();
      if (!rows.length) {
        setListMessage(id, emptyMessage, false);
        return;
      }
      rows.forEach(function (row) {
        target.append(renderRow(row));
      });
    }

    function activityRow(kicker, title, detail) {
      const row = document.createElement('div');
      row.className = 'admin-activity-row';
      const copy = document.createElement('div');
      const label = document.createElement('span');
      label.className = 'admin-row-kicker';
      label.textContent = kicker;
      const heading = document.createElement('strong');
      heading.textContent = title;
      const meta = document.createElement('small');
      meta.textContent = detail;
      copy.append(label, heading, meta);
      row.append(copy);
      return row;
    }

    function recordQueryError(table, query, error) {
      queryErrors.push({
        table: table,
        query: query,
        code: error && error.code ? error.code : 'CLIENT_ERROR',
        message: error && error.message ? error.message : 'The request failed without a message.',
        details: error && error.details ? error.details : '',
        hint: error && error.hint ? error.hint : ''
      });
    }

    function renderDiagnostics() {
      diagnosticsList.replaceChildren();
      if (!queryErrors.length) {
        diagnostics.hidden = true;
        return;
      }
      diagnostics.hidden = false;
      queryErrors.forEach(function (item) {
        const row = document.createElement('article');
        row.className = 'admin-diagnostic-row';
        const heading = document.createElement('strong');
        heading.textContent = `${item.table} / ${item.query}`;
        const code = document.createElement('span');
        code.textContent = item.code;
        const message = document.createElement('p');
        message.textContent = item.message;
        row.append(heading, code, message);
        if (item.details) {
          const details = document.createElement('small');
          details.textContent = `Details: ${item.details}`;
          row.append(details);
        }
        if (item.hint) {
          const hint = document.createElement('small');
          hint.textContent = `Hint: ${item.hint}`;
          row.append(hint);
        }
        diagnosticsList.append(row);
      });
    }

    async function countRows(table, queryLabel, configure) {
      try {
        let query = auth.client.from(table).select('*', {count: 'exact', head: true});
        if (configure) query = configure(query);
        const result = await query;
        return {table: table, query: queryLabel, value: result.error ? null : result.count || 0, error: result.error};
      } catch (error) {
        return {table: table, query: queryLabel, value: null, error: error};
      }
    }

    async function readRows(table, queryLabel, configure) {
      try {
        return await configure(auth.client.from(table));
      } catch (error) {
        return {data: null, error: error};
      }
    }

    async function loadOverview() {
      queryErrors.length = 0;
      const metricResults = await Promise.all([
        countRows('auction_lots', 'total count'),
        countRows('auction_lots', 'published count', query => query.not('published_at', 'is', null)),
        countRows('auction_lots', 'live count', query => query.eq('status', 'live')),
        countRows('auction_lots', 'closed count', query => query.eq('status', 'closed')),
        countRows('bids', 'total count'),
        countRows('profiles', 'member count')
      ]);
      const metricIds = ['stat-total-lots', 'stat-published-lots', 'stat-live-auctions', 'stat-closed-auctions', 'stat-total-bids', 'stat-members'];
      metricResults.forEach(function (result, index) {
        setMetric(metricIds[index], result.value);
        if (result.error) recordQueryError(result.table, result.query, result.error);
      });

      const [lotsResult, bidsResult, enquiriesResult] = await Promise.all([
        readRows('auction_lots', 'recent lots', query => query.select('id, lot_number, title, status, created_at').order('created_at', {ascending: false}).limit(5)),
        readRows('bids', 'recent bids', query => query.select('id, lot_id, amount, created_at').order('created_at', {ascending: false}).limit(5)),
        readRows('contact_messages', 'recent enquiries', query => query.select('id, full_name, enquiry_type, subject, status, created_at').order('created_at', {ascending: false}).limit(5))
      ]);

      if (lotsResult.error) {
        recordQueryError('auction_lots', 'recent lots', lotsResult.error);
        setListMessage('recent-lots', 'Recent lots are unavailable from the current database connection.', true);
      }
      else appendActivity('recent-lots', lotsResult.data || [], function (lot) {
        return activityRow(lot.status.toUpperCase(), lot.title, `LOT ${lot.lot_number} / ${formatDate(lot.created_at)}`);
      }, 'No lots have been recorded yet.');

      if (bidsResult.error) {
        recordQueryError('bids', 'recent bids', bidsResult.error);
        setListMessage('recent-bids', 'Recent bids are unavailable from the current database connection.', true);
      }
      else appendActivity('recent-bids', bidsResult.data || [], function (bid) {
        return activityRow('RECORDED BID', formatAmount(bid.amount), `LOT ${String(bid.lot_id).slice(0, 8)} / ${formatDate(bid.created_at)}`);
      }, 'No bids have been recorded yet.');

      if (enquiriesResult.error) {
        recordQueryError('contact_messages', 'recent enquiries', enquiriesResult.error);
        setListMessage('recent-enquiries', 'Recent enquiries are unavailable from the current database connection.', true);
      }
      else appendActivity('recent-enquiries', enquiriesResult.data || [], function (enquiry) {
        return activityRow(enquiry.status.toUpperCase(), enquiry.subject, `${enquiry.enquiry_type} / ${formatDate(enquiry.created_at)}`);
      }, 'No enquiries have been recorded yet.');

      renderDiagnostics();
      const hasErrors = queryErrors.length > 0;
      setConnection(hasErrors ? 'Connected with limitations' : 'Supabase connected', hasErrors ? 'is-limited' : 'is-connected');
    }

    function closeMobileNavigation() {
      sidebar.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }

    function selectSection(section, label) {
      sectionTitle.textContent = label;
      document.querySelectorAll('[data-admin-section]').forEach(function (link) {
        link.classList.toggle('active', link.dataset.adminSection === section);
      });
      const isOverview = section === 'overview';
      overview.hidden = !isOverview;
      placeholder.hidden = isOverview;
      if (!isOverview) {
        placeholderTitle.textContent = `${label} is being prepared.`;
        placeholderCopy.textContent = `${label} management has not been implemented yet. This read-only foundation does not provide simulated actions or controls.`;
      }
      closeMobileNavigation();
    }

    async function logout() {
      const result = await auth.signOut();
      if (result.error) {
        setConnection('Logout failed', 'is-limited');
        return;
      }
      window.location.replace('auth.html');
    }

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

      verifiedUserId = sessionResult.session.user.id;
      const email = sessionResult.session.user.email || 'Verified super-admin';
      accountEmail.textContent = email;
      sidebarEmail.textContent = email;
      accessState.hidden = true;
      dashboard.hidden = false;

      document.querySelectorAll('[data-admin-section]').forEach(function (link) {
        link.addEventListener('click', function (event) {
          event.preventDefault();
          selectSection(link.dataset.adminSection, link.dataset.sectionLabel);
          window.history.replaceState(null, '', `#${link.dataset.adminSection}`);
        });
      });
      menuToggle.addEventListener('click', function () {
        const open = sidebar.classList.toggle('is-open');
        menuToggle.setAttribute('aria-expanded', String(open));
      });
      document.querySelectorAll('#admin-top-logout, #admin-sidebar-logout').forEach(button => button.addEventListener('click', logout));

      const requestedSection = window.location.hash.slice(1);
      const requestedLink = document.querySelector(`[data-admin-section="${requestedSection}"]`);
      selectSection(requestedLink ? requestedSection : 'overview', requestedLink ? requestedLink.dataset.sectionLabel : 'Overview');
      await loadOverview();

      auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_OUT' || !session) {
          window.location.replace('auth.html');
        } else if (session.user.id !== verifiedUserId) {
          window.location.reload();
        }
      });
    } catch (error) {
      showAccessError('The administration room could not be loaded. Please try again.');
    }
  });
})();
