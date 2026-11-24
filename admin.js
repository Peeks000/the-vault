/**
 * =============================================================================
 * THE VAULT — Administration Controller (admin.js)
 * =============================================================================
 * WHAT THIS FILE DOES:
 * Controls the private curator & administration dashboard on admin.html.
 *
 * CORE CAPABILITIES:
 * 1. Cryptographic Security Gate:
 *    Restricts access strictly to verified super-admin sessions via the
 *    database-level is_super_admin() RPC function. Unauthorized users are blocked.
 * 2. Real-Time Telemetry & Metrics:
 *    Fetches accurate counts for total lots, live auctions, closed auctions,
 *    registered bidders, and submitted bids from PostgreSQL tables.
 * 3. Recent Activity Streams:
 *    Displays feeds of recent lots, live bids, and incoming contact enquiries.
 * 4. Full Auction Lot Management (CRUD):
 *    - Create (Add new auction lot with imagery).
 *    - Read (Query, filter by category/status, search by keyword).
 *    - Update (Edit details, adjust price, quick-change status via dropdown).
 *    - Delete (Delete lot, or safely withdraw if bids already exist).
 * 5. Database Seeding:
 *    Injects 8 curated demonstration lots into Supabase using SQL UPSERT.
 * 6. Error Diagnostics:
 *    Captures PostgreSQL SQLSTATE errors (such as 42501 permission denied or
 *    23503 foreign key violation) and displays helpful troubleshooting hints.
 *
 * VIVA CONCEPTS TO HIGHLIGHT:
 * - Nested Relational Joins: Fetches images from the child table lot_images
 *   directly within the parent auction_lots query using Supabase's GraphQL-like syntax.
 * - Promise.all(): Fires multiple asynchronous database queries concurrently
 *   instead of sequentially, dramatically reducing dashboard loading time.
 * - SQLSTATE 23503 (Foreign Key Constraint): Why financial records cannot be
 *   deleted if bids reference them, demonstrating database integrity.
 * - Clearly Documented Placeholders: Sections 03 (Bids management), 04 (Articles),
 *   and 05 (Settings) are explicitly documented as future extensions.
 * =============================================================================
 */

(function () {
  'use strict';

  /**
   * Main Admin Initialization:
   * Coordinates security verification, DOM references, and data loading.
   */
  async function initAdmin() {
    const auth = window.vaultAuth;

    // -------------------------------------------------------------------------
    // DOM Element References — Navigation & Panels
    // -------------------------------------------------------------------------
    const accessState = document.querySelector('#admin-access-state'); // Access Denied screen
    const dashboard = document.querySelector('#admin-dashboard');       // Main Admin UI container
    const sidebar = document.querySelector('#admin-sidebar');           // Collapsible navigation drawer
    const menuToggle = document.querySelector('#admin-menu-toggle');     // Mobile hamburger button
    const connectionIndicator = document.querySelector('#admin-connection'); // Database health badge
    const sectionTitle = document.querySelector('#admin-section-title'); // Active section heading
    const overviewSection = document.querySelector('#admin-overview');   // 01 / Telemetry section
    const placeholderSection = document.querySelector('#admin-placeholder'); // Placeholder section for upcoming tabs
    const placeholderTitle = document.querySelector('#admin-placeholder-title');
    const placeholderCopy = document.querySelector('#admin-placeholder-copy');
    const accountEmail = document.querySelector('#admin-account-email'); // Header admin email display
    const sidebarEmail = document.querySelector('#admin-sidebar-email'); // Sidebar admin email display
    const diagnosticsSection = document.querySelector('#admin-diagnostics'); // Error diagnostics panel
    const diagnosticsList = document.querySelector('#admin-diagnostics-list');

    // -------------------------------------------------------------------------
    // DOM Element References — 02 / Lots Management Table & Filters
    // -------------------------------------------------------------------------
    const lotsSection = document.querySelector('#admin-lots');
    const lotsTbody = document.querySelector('#admin-lots-tbody');
    const lotsStatus = document.querySelector('#admin-lots-status');
    const lotsSearchInput = document.querySelector('#admin-lots-search');
    const statusFilter = document.querySelector('#admin-status-filter');
    const categoryFilter = document.querySelector('#admin-category-filter');
    const addLotBtn = document.querySelector('#admin-add-lot-btn');
    const refreshLotsBtn = document.querySelector('#admin-refresh-lots-btn');
    const seedLotsBtn = document.querySelector('#admin-seed-lots-btn');

    // -------------------------------------------------------------------------
    // DOM Element References — Lot Add/Edit Modal Form
    // -------------------------------------------------------------------------
    const lotModal = document.querySelector('#admin-lot-modal');
    const lotModalClose = document.querySelector('#admin-lot-modal-close');
    const lotForm = document.querySelector('#admin-lot-form');
    const lotFormCancel = document.querySelector('#lot-form-cancel');
    const modalLotTitle = document.querySelector('#modal-lot-title');
    const modalFeedback = document.querySelector('#modal-lot-feedback');

    // Lot Form Input Fields
    const fieldLotId = document.querySelector('#lot-form-id');
    const fieldLotMode = document.querySelector('#lot-form-mode');
    const fieldLotTitle = document.querySelector('#lot-form-title');
    const fieldLotNumber = document.querySelector('#lot-form-number');
    const fieldLotCategory = document.querySelector('#lot-form-category');
    const fieldLotStatus = document.querySelector('#lot-form-status');
    const fieldLotSubtitle = document.querySelector('#lot-form-subtitle');
    const fieldLotDescription = document.querySelector('#lot-form-description');
    const fieldLotPeriod = document.querySelector('#lot-form-period');
    const fieldLotPrice = document.querySelector('#lot-form-price');
    const fieldLotEstLow = document.querySelector('#lot-form-est-low');
    const fieldLotEstHigh = document.querySelector('#lot-form-est-high');
    const fieldLotImage = document.querySelector('#lot-form-image');
    const fieldLotPublished = document.querySelector('#lot-form-published');

    // -------------------------------------------------------------------------
    // DOM Element References — Lot Deletion Confirmation Modal
    // -------------------------------------------------------------------------
    const deleteModal = document.querySelector('#admin-delete-modal');
    const deleteModalClose = document.querySelector('#admin-delete-modal-close');
    const deleteModalCopy = document.querySelector('#delete-modal-copy');
    const deleteModalFeedback = document.querySelector('#delete-modal-feedback');
    const confirmDeleteBtn = document.querySelector('#confirm-delete-btn');
    const withdrawInsteadBtn = document.querySelector('#withdraw-instead-btn');
    const cancelDeleteBtn = document.querySelector('#cancel-delete-btn');

    // In-memory state variables
    let adminLots = [];          // Stores current auction lots loaded from Supabase
    let pendingDeleteLot = null; // References the lot object currently targeted for deletion
    const queryErrors = [];      // Diagnostic error bucket capturing failed database calls
    let verifiedUserId = '';     // UUID of the authenticated super-admin

    // -------------------------------------------------------------------------
    // UI Helpers (Formatting & Feedback)
    // -------------------------------------------------------------------------

    /**
     * Function: showAccessError(message)
     * Purpose: Renders a full-screen "Access Denied" lock state when an unauthorized
     * or unauthenticated user tries to view admin.html.
     */
    function showAccessError(message) {
      if (!accessState) return;

      accessState.replaceChildren(); // Efficiently removes all existing child elements

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

    /**
     * Function: setConnectionStatus(text, statusClass)
     * Purpose: Updates the database status pill indicator (e.g. green "Supabase connected").
     */
    function setConnectionStatus(text, statusClass) {
      if (!connectionIndicator) return;
      connectionIndicator.className = `admin-connection ${statusClass}`;
      connectionIndicator.replaceChildren();

      const dot = document.createElement('i');
      connectionIndicator.append(dot, document.createTextNode(text));
    }

    /**
     * Function: setMetric(id, value)
     * Purpose: Formats numeric metrics using Indian locale grouping (e.g. 10,00,000).
     */
    function setMetric(id, value) {
      const element = document.querySelector(`#${id}`);
      if (!element) return;
      element.textContent = value === null
        ? 'Unavailable'
        : Number(value).toLocaleString('en-IN');
    }

    /**
     * Function: formatDate(value)
     * Purpose: Formats ISO timestamp strings into curatorial editorial dates (e.g. "20 Nov 2026").
     */
    function formatDate(value) {
      if (!value) return 'Date unavailable';
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(value));
    }

    /**
     * Function: formatAmount(value)
     * Purpose: Formats financial values with Indian Rupee symbol (₹).
     */
    function formatAmount(value) {
      if (value === null || value === undefined) return 'Amount unavailable';
      return `₹${Number(value).toLocaleString('en-IN')}`;
    }

    /**
     * Function: setListStatusMessage(id, message, isError)
     * Purpose: Displays loading spinners or empty-state notices inside list containers.
     */
    function setListStatusMessage(id, message, isError = false) {
      const target = document.querySelector(`#${id}`);
      if (!target) return;

      target.replaceChildren();
      const paragraph = document.createElement('p');
      paragraph.className = `admin-list-status${isError ? ' is-error' : ''}`;
      paragraph.textContent = message;
      target.append(paragraph);
    }

    /**
     * Function: createActivityRow(kickerText, titleText, detailText)
     * Purpose: Factory function creating a structured DOM node for activity stream rows.
     */
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

    /**
     * Function: renderActivityList(containerId, rows, rowRenderer, emptyMessage)
     * Purpose: Generic rendering pipeline for feeds (recent lots, recent bids, inquiries).
     */
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

    /**
     * Function: recordQueryError(table, query, error)
     * Purpose: Logs database exceptions to in-memory diagnostic state for administrator review.
     */
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

    /**
     * Function: renderDiagnostics()
     * Purpose: Populates the troubleshooting panel with actionable SQL error information.
     */
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
    // Data Loading (Database Queries & Telemetry)
    // -------------------------------------------------------------------------

    /**
     * Function: countRows(tableName, queryLabel, configFn)
     * Purpose: Executes an efficient COUNT query using Supabase's head: true option.
     * WHY head: true? Returns the exact count from HTTP headers without downloading
     * any actual row payloads, maximizing network performance!
     */
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

    /**
     * Function: fetchRows(tableName, queryLabel, configFn)
     * Purpose: Wrapper for executing custom SELECT queries with error boundaries.
     */
    async function fetchRows(tableName, queryLabel, configFn) {
      try {
        return await configFn(auth.client.from(tableName));
      } catch (err) {
        return { data: null, error: err };
      }
    }

    /**
     * Function: loadOverviewData()
     * Purpose: Concurrently loads all dashboard metrics and recent activity feeds.
     *
     * How Promise.all() optimizes this:
     * Instead of waiting for 6 count queries one after another (serial),
     * Promise.all executes them in parallel (concurrently). Total load time
     * equals the slowest query rather than the sum of all queries!
     */
    async function loadOverviewData() {
      queryErrors.length = 0;

      // 1. Telemetry Metric Counts (Fired concurrently)
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

      // 2. Recent Activity Streams (Latest 5 records from each table)
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

      // Process Recent Lots
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

      // Process Recent Bids
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

      // Process Recent Enquiries
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
    // 02 / Lots CRUD Controller
    // -------------------------------------------------------------------------

    // 8 Pre-configured curated demonstration lots for database seeding.
    const DEMO_SEED_LOTS = [
      {
        legacy_id: 'watch',
        lot_number: '024',
        category: 'Timepieces',
        period: '1960s–70s',
        title: 'The Heritage Chronograph',
        subtitle: 'A considered study in mechanical craft and enduring design.',
        current_bid: 240000,
        estimate_low: 200000,
        estimate_high: 300000,
        image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85',
        description: 'There is a particular pleasure in a well-made mechanical object. The measured sweep of its hands, the tactility of its details and the quiet engineering beneath the dial make this a piece to be appreciated slowly.'
      },
      {
        legacy_id: 'art',
        lot_number: '031',
        category: 'Fine Art',
        period: 'Contemporary',
        title: 'A Study in Stillness',
        subtitle: 'A quiet composition that rewards a longer look.',
        current_bid: 85000,
        estimate_low: 65000,
        estimate_high: 110000,
        image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85',
        description: 'An artwork changes with the room around it and the attention it receives. This demonstration lot is presented as a study in colour, composition and the personal connection between an object and its collector.'
      },
      {
        legacy_id: 'car',
        lot_number: '042',
        category: 'Automotive',
        period: 'Classic',
        title: 'The Open-Road Icon',
        subtitle: 'A sculptural expression of performance and proportion.',
        current_bid: 1850000,
        estimate_low: 1600000,
        estimate_high: 2200000,
        image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85',
        description: 'The appeal of a classic automobile lives in its stance, its surfaces and the feeling of a different era of design. This sample listing shows how an auction lot could present a vehicle to an informed audience.'
      },
      {
        legacy_id: 'jewel',
        lot_number: '056',
        category: 'Jewellery',
        period: 'Modern heirloom',
        title: 'The Quiet Brilliance',
        subtitle: 'A study in proportion, detail and considered making.',
        current_bid: 125000,
        estimate_low: 100000,
        estimate_high: 160000,
        image_url: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=85',
        description: 'Fine jewellery is often appreciated in the details: the finish, the balance and the way it catches light. This fictional lot demonstrates the editorial format for describing a piece without making unsupported claims.'
      },
      {
        legacy_id: 'camera',
        lot_number: '063',
        category: 'Timepieces',
        period: 'Mid-century',
        title: 'The Photographer’s Companion',
        subtitle: 'An enduring instrument for seeing the world differently.',
        current_bid: 42000,
        estimate_low: 35000,
        estimate_high: 60000,
        image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85',
        description: 'Mechanical cameras are a reminder that the process of making an image can be as satisfying as the image itself. This demonstration entry would be accompanied by verified technical details in a production auction.'
      },
      {
        legacy_id: 'sculpture',
        lot_number: '071',
        category: 'Fine Art',
        period: 'Contemporary',
        title: 'Form in Conversation',
        subtitle: 'An expressive object for a thoughtful space.',
        current_bid: 67000,
        estimate_low: 50000,
        estimate_high: 90000,
        image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=85',
        description: 'A sculptural piece that invites the viewer to move around it. Contemporary craft that balances material presence with restraint.'
      },
      {
        legacy_id: 'pen',
        lot_number: '085',
        category: 'Timepieces',
        period: '1950s',
        title: 'The Written Word',
        subtitle: 'A vintage fountain pen of distinguished provenance.',
        current_bid: 28000,
        estimate_low: 25000,
        estimate_high: 40000,
        image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1000&q=85',
        description: 'A solid gold nib, ebonite feed and celluloid barrel from an era when personal writing instruments were lifelong companions.'
      },
      {
        legacy_id: 'chair',
        lot_number: '094',
        category: 'Fine Art',
        period: 'Mid-century modern',
        title: 'The Lounge Classic',
        subtitle: 'An iconic silhouette in molded plywood and leather.',
        current_bid: 310000,
        estimate_low: 280000,
        estimate_high: 420000,
        image_url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=85',
        description: 'A benchmark in twentieth-century furniture design, combining organic warmth with industrial precision.'
      }
    ];

    /**
     * Function: loadAdminLots()
     * Purpose: Fetches the complete auction catalog including nested gallery images.
     * Notice the nested query:
     * lot_images ( id, image_url, alt_text, is_primary, sort_order )
     * PostgREST automatically performs a LEFT JOIN using the foreign key constraint.
     */
    async function loadAdminLots() {
      if (!lotsTbody || !lotsStatus) return;
      lotsStatus.hidden = false;
      lotsStatus.className = 'admin-list-status';
      lotsStatus.textContent = 'Loading auction listings from Supabase…';
      lotsTbody.replaceChildren();

      try {
        const { data, error } = await auth.client
          .from('auction_lots')
          .select(`
            id,
            legacy_id,
            lot_number,
            category,
            period,
            title,
            subtitle,
            description,
            estimate_low,
            estimate_high,
            current_bid,
            bid_count,
            starts_at,
            ends_at,
            status,
            published_at,
            created_at,
            lot_images (
              id,
              image_url,
              alt_text,
              is_primary,
              sort_order
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          recordQueryError('auction_lots', 'load admin lots', error);
          lotsStatus.textContent = `Unable to fetch lots: ${error.message} (Code: ${error.code}). Check database RLS and table privileges.`;
          lotsStatus.className = 'admin-list-status is-error';
          renderDiagnostics();
          return;
        }

        adminLots = data || [];
        renderAdminLotsTable();
      } catch (err) {
        lotsStatus.textContent = `Connection error: ${err.message}`;
        lotsStatus.className = 'admin-list-status is-error';
      }
    }

    /**
     * Function: renderAdminLotsTable()
     * Purpose: Filters, searches, and dynamically populates the administrative lots HTML table.
     * Uses JavaScript array.filter() for instant, zero-latency client-side filtering.
     */
    function renderAdminLotsTable() {
      if (!lotsTbody || !lotsStatus) return;

      const searchQuery = (lotsSearchInput?.value || '').trim().toLowerCase();
      const selectedStatus = statusFilter?.value || 'all';
      const selectedCategory = categoryFilter?.value || 'all';

      // Multi-criteria client-side filter
      const filtered = adminLots.filter(lot => {
        const matchesStatus = selectedStatus === 'all' || lot.status === selectedStatus;
        const matchesCategory = selectedCategory === 'all' || lot.category === selectedCategory;
        const searchTarget = `${lot.lot_number || ''} ${lot.title || ''} ${lot.category || ''} ${lot.subtitle || ''}`.toLowerCase();
        const matchesSearch = !searchQuery || searchTarget.includes(searchQuery);
        return matchesStatus && matchesCategory && matchesSearch;
      });

      lotsTbody.replaceChildren();

      if (!adminLots.length) {
        lotsStatus.hidden = false;
        lotsStatus.className = 'admin-list-status';
        lotsStatus.textContent = 'No auction lots recorded in Supabase yet. Click "Add new lot" or "Seed demo lots" to begin.';
        return;
      }

      if (!filtered.length) {
        lotsStatus.hidden = false;
        lotsStatus.className = 'admin-list-status';
        lotsStatus.textContent = 'No lots matched the current filter and search criteria.';
        return;
      }

      lotsStatus.hidden = true;

      // Construct table rows using standard, secure DOM methods (no dangerous innerHTML injection)
      filtered.forEach(lot => {
        const images = Array.isArray(lot.lot_images) ? [...lot.lot_images] : [];
        const primaryImg = images.find(img => img.is_primary) || images[0];
        const imgSrc = primaryImg?.image_url || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=150&q=80';

        const row = document.createElement('tr');

        // Column 1: Lot Number
        const tdNumber = document.createElement('td');
        const strongNum = document.createElement('strong');
        strongNum.textContent = `LOT ${lot.lot_number || '—'}`;
        tdNumber.append(strongNum);

        // Column 2: Product Details & Thumbnail
        const tdDetails = document.createElement('td');
        const cellWrap = document.createElement('div');
        cellWrap.className = 'admin-lot-cell';

        const thumb = document.createElement('img');
        thumb.className = 'admin-lot-thumb';
        thumb.src = imgSrc;
        thumb.alt = lot.title;
        thumb.loading = 'lazy';

        const metaWrap = document.createElement('div');
        const titleSpan = document.createElement('strong');
        titleSpan.className = 'admin-lot-meta-title';
        titleSpan.textContent = lot.title;

        const subSpan = document.createElement('span');
        subSpan.className = 'admin-lot-meta-subtitle';
        subSpan.textContent = lot.subtitle || lot.period || 'No subtitle provided';

        metaWrap.append(titleSpan, subSpan);
        cellWrap.append(thumb, metaWrap);
        tdDetails.append(cellWrap);

        // Column 3: Category
        const tdCategory = document.createElement('td');
        tdCategory.textContent = lot.category;

        // Column 4: Current Bid
        const tdCurrentBid = document.createElement('td');
        const strongBid = document.createElement('strong');
        strongBid.textContent = formatAmount(lot.current_bid);
        tdCurrentBid.append(strongBid);

        // Column 5: Estimate Range
        const tdEstimate = document.createElement('td');
        const smallEst = document.createElement('small');
        smallEst.textContent = lot.estimate_low && lot.estimate_high
          ? `${formatAmount(lot.estimate_low)} – ${formatAmount(lot.estimate_high)}`
          : (lot.estimate_low ? `From ${formatAmount(lot.estimate_low)}` : 'Upon request');
        tdEstimate.append(smallEst);

        // Column 6: Quick Status Change Dropdown
        const tdStatus = document.createElement('td');
        const statusSelect = document.createElement('select');
        statusSelect.className = `admin-action-btn admin-status-select status-${lot.status}`;
        statusSelect.setAttribute('aria-label', `Change status for ${lot.title}`);
        ['draft', 'scheduled', 'live', 'closed', 'withdrawn'].forEach(st => {
          const opt = document.createElement('option');
          opt.value = st;
          opt.textContent = st.charAt(0).toUpperCase() + st.slice(1);
          if (lot.status === st) opt.selected = true;
          statusSelect.append(opt);
        });
        statusSelect.addEventListener('change', () => handleQuickStatusChange(lot.id, statusSelect.value));
        tdStatus.append(statusSelect);

        // Column 7: Actions (Edit & Delete buttons)
        const tdActions = document.createElement('td');
        tdActions.className = 'admin-actions-cell';
        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'admin-row-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'admin-action-btn btn-edit';
        editBtn.type = 'button';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => openEditModal(lot.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'admin-action-btn btn-delete';
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => openDeleteModal(lot));

        actionsWrap.append(editBtn, deleteBtn);
        tdActions.append(actionsWrap);

        row.append(tdNumber, tdDetails, tdCategory, tdCurrentBid, tdEstimate, tdStatus, tdActions);
        lotsTbody.append(row);
      });
    }

    // -------------------------------------------------------------------------
    // Modal Management (Add, Edit, Delete Workflows)
    // -------------------------------------------------------------------------

    function setModalFeedback(message, type = '') {
      if (!modalFeedback) return;
      modalFeedback.textContent = message;
      modalFeedback.className = `admin-modal-feedback ${type}`.trim();
      modalFeedback.hidden = !message;
    }

    /**
     * Function: openAddModal()
     * Purpose: Prepares and displays the lot creation modal form with default values.
     */
    function openAddModal() {
      if (!lotModal || !lotForm) return;
      lotForm.reset();
      fieldLotId.value = '';
      fieldLotMode.value = 'add'; // Identifies operation as INSERT
      if (modalLotTitle) modalLotTitle.textContent = 'Add new auction listing';
      if (fieldLotStatus) fieldLotStatus.value = 'live';
      if (fieldLotPublished) fieldLotPublished.checked = true;
      setModalFeedback('');
      lotModal.hidden = false;
    }

    /**
     * Function: openEditModal(lotId)
     * Purpose: Pre-populates form fields with existing lot attributes for editing.
     */
    function openEditModal(lotId) {
      const lot = adminLots.find(item => item.id === lotId);
      if (!lot || !lotModal || !lotForm) return;

      const images = Array.isArray(lot.lot_images) ? [...lot.lot_images] : [];
      const primaryImg = images.find(img => img.is_primary) || images[0];

      fieldLotId.value = lot.id;
      fieldLotMode.value = 'edit'; // Identifies operation as UPDATE
      if (modalLotTitle) modalLotTitle.textContent = `Edit auction listing (LOT ${lot.lot_number})`;

      if (fieldLotTitle) fieldLotTitle.value = lot.title || '';
      if (fieldLotNumber) fieldLotNumber.value = (lot.lot_number || '').replace(/^LOT\s*/i, '');
      if (fieldLotCategory) fieldLotCategory.value = lot.category || 'Timepieces';
      if (fieldLotStatus) fieldLotStatus.value = lot.status || 'live';
      if (fieldLotSubtitle) fieldLotSubtitle.value = lot.subtitle || '';
      if (fieldLotDescription) fieldLotDescription.value = lot.description || '';
      if (fieldLotPeriod) fieldLotPeriod.value = lot.period || '';
      if (fieldLotPrice) fieldLotPrice.value = lot.current_bid ?? 0;
      if (fieldLotEstLow) fieldLotEstLow.value = lot.estimate_low ?? '';
      if (fieldLotEstHigh) fieldLotEstHigh.value = lot.estimate_high ?? '';
      if (fieldLotImage) fieldLotImage.value = primaryImg?.image_url || '';
      if (fieldLotPublished) fieldLotPublished.checked = Boolean(lot.published_at);

      setModalFeedback('');
      lotModal.hidden = false;
    }

    function closeLotModal() {
      if (lotModal) lotModal.hidden = true;
      setModalFeedback('');
    }

    /**
     * Handler: handleLotFormSubmit(event)
     * Purpose: Validates form input and executes either an INSERT or UPDATE on auction_lots.
     */
    async function handleLotFormSubmit(event) {
      event.preventDefault();

      const mode = fieldLotMode.value;
      const lotId = fieldLotId.value;

      const title = (fieldLotTitle?.value || '').trim();
      const lotNumber = (fieldLotNumber?.value || '').trim();
      const category = fieldLotCategory?.value || 'Timepieces';
      const status = fieldLotStatus?.value || 'live';
      const subtitle = (fieldLotSubtitle?.value || '').trim();
      const description = (fieldLotDescription?.value || '').trim();
      const period = (fieldLotPeriod?.value || '').trim();
      const price = Number(fieldLotPrice?.value) || 0;
      const estLow = fieldLotEstLow?.value ? Number(fieldLotEstLow.value) : null;
      const estHigh = fieldLotEstHigh?.value ? Number(fieldLotEstHigh.value) : null;
      const imageUrl = (fieldLotImage?.value || '').trim();
      const shouldPublish = fieldLotPublished?.checked;

      // Data integrity validations matching database check constraints
      if (!title) {
        return setModalFeedback('Please enter a product title.', 'error');
      }
      if (!lotNumber) {
        return setModalFeedback('Please enter a lot number.', 'error');
      }
      if (price < 0) {
        return setModalFeedback('Starting/current bid cannot be negative.', 'error');
      }
      if (estLow !== null && estHigh !== null && estHigh < estLow) {
        return setModalFeedback('Estimate maximum must be greater than or equal to estimate minimum.', 'error');
      }

      setModalFeedback('Saving listing to Supabase…', 'loading');

      const payload = {
        lot_number: lotNumber,
        category,
        period: period || null,
        title,
        subtitle: subtitle || null,
        description: description || null,
        estimate_low: estLow,
        estimate_high: estHigh,
        current_bid: price,
        status,
        published_at: shouldPublish ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      try {
        if (mode === 'add') {
          // INSERT Operation
          payload.legacy_id = `lot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          payload.created_by = verifiedUserId || null;

          const { data: newLot, error: insertError } = await auth.client
            .from('auction_lots')
            .insert(payload)
            .select()
            .single();

          if (insertError) {
            recordQueryError('auction_lots', 'insert lot', insertError);
            return setModalFeedback(`Failed to save listing: ${insertError.message}`, 'error');
          }

          // Insert corresponding image record if provided
          if (imageUrl && newLot) {
            await auth.client.from('lot_images').insert({
              lot_id: newLot.id,
              image_url: imageUrl,
              alt_text: title,
              is_primary: true,
              sort_order: 0
            });
          }

          setModalFeedback('✓ Auction listing created successfully.', 'success');
        } else {
          // UPDATE Operation
          const { error: updateError } = await auth.client
            .from('auction_lots')
            .update(payload)
            .eq('id', lotId);

          if (updateError) {
            recordQueryError('auction_lots', 'update lot', updateError);
            return setModalFeedback(`Failed to update listing: ${updateError.message}`, 'error');
          }

          // Update or insert primary image record
          if (imageUrl) {
            const { data: existingImages } = await auth.client
              .from('lot_images')
              .select('id')
              .eq('lot_id', lotId)
              .eq('is_primary', true);

            if (existingImages && existingImages.length > 0) {
              await auth.client
                .from('lot_images')
                .update({ image_url: imageUrl, alt_text: title })
                .eq('id', existingImages[0].id);
            } else {
              await auth.client.from('lot_images').insert({
                lot_id: lotId,
                image_url: imageUrl,
                alt_text: title,
                is_primary: true,
                sort_order: 0
              });
            }
          }

          setModalFeedback('✓ Auction listing updated successfully.', 'success');
        }

        // Close modal and refresh listings
        setTimeout(() => {
          closeLotModal();
          loadAdminLots();
          loadOverviewData();
        }, 600);
      } catch (err) {
        setModalFeedback(`Error saving listing: ${err.message}`, 'error');
      }
    }

    /**
     * Function: handleQuickStatusChange(lotId, newStatus)
     * Purpose: Directly updates lot status from the table dropdown.
     */
    async function handleQuickStatusChange(lotId, newStatus) {
      try {
        const updatePayload = {
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        if (newStatus === 'live' || newStatus === 'scheduled') {
          updatePayload.published_at = new Date().toISOString();
        }

        const { error } = await auth.client
          .from('auction_lots')
          .update(updatePayload)
          .eq('id', lotId);

        if (error) {
          alert(`Could not update status: ${error.message}`);
          loadAdminLots();
          return;
        }

        const target = adminLots.find(item => item.id === lotId);
        if (target) target.status = newStatus;
        renderAdminLotsTable();
        loadOverviewData();
      } catch (err) {
        alert(`Error: ${err.message}`);
        loadAdminLots();
      }
    }

    /**
     * Function: openDeleteModal(lot)
     * Purpose: Displays the deletion safety confirmation dialog.
     */
    function openDeleteModal(lot) {
      pendingDeleteLot = lot;
      if (!deleteModal) return;

      if (deleteModalCopy) {
        deleteModalCopy.textContent = `Are you sure you want to permanently delete LOT ${lot.lot_number} ("${lot.title}")? This action cannot be undone.`;
      }
      if (deleteModalFeedback) deleteModalFeedback.hidden = true;
      if (withdrawInsteadBtn) withdrawInsteadBtn.hidden = true;
      if (confirmDeleteBtn) confirmDeleteBtn.disabled = false;

      deleteModal.hidden = false;
    }

    function closeDeleteModal() {
      if (deleteModal) deleteModal.hidden = true;
      pendingDeleteLot = null;
    }

    /**
     * Function: handleConfirmDelete()
     * Purpose: Attempts SQL DELETE on the selected lot.
     *
     * VIVA SPOTLIGHT — Error 23503 Handling:
     * If bids have already been placed on this lot, PostgreSQL blocks the delete
     * because of the foreign key constraint: references auction_lots(id) on delete restrict.
     * The code catches error.code === '23503', explains financial audit compliance,
     * and offers a graceful "Withdraw Instead" alternative!
     */
    async function handleConfirmDelete() {
      if (!pendingDeleteLot) return;

      if (confirmDeleteBtn) confirmDeleteBtn.disabled = true;
      if (deleteModalFeedback) {
        deleteModalFeedback.hidden = false;
        deleteModalFeedback.className = 'admin-modal-feedback';
        deleteModalFeedback.textContent = 'Removing lot from database…';
      }

      try {
        const { error } = await auth.client
          .from('auction_lots')
          .delete()
          .eq('id', pendingDeleteLot.id);

        if (error) {
          recordQueryError('auction_lots', 'delete lot', error);
          if (deleteModalFeedback) {
            deleteModalFeedback.className = 'admin-modal-feedback error';
            // SQLSTATE 23503 = foreign_key_violation
            if (error.code === '23503' || String(error.message).includes('foreign key')) {
              deleteModalFeedback.textContent = 'This lot cannot be deleted because permanent bid records or watchlist references exist in the database. To preserve financial audit integrity, change its status to Withdrawn instead.';
              if (withdrawInsteadBtn) withdrawInsteadBtn.hidden = false;
            } else {
              deleteModalFeedback.textContent = `Delete blocked: ${error.message}`;
            }
          }
          if (confirmDeleteBtn) confirmDeleteBtn.disabled = false;
          return;
        }

        // Deletion confirmed
        if (deleteModalFeedback) {
          deleteModalFeedback.className = 'admin-modal-feedback success';
          deleteModalFeedback.textContent = '✓ Lot deleted permanently.';
        }

        setTimeout(() => {
          closeDeleteModal();
          loadAdminLots();
          loadOverviewData();
        }, 500);
      } catch (err) {
        if (deleteModalFeedback) {
          deleteModalFeedback.className = 'admin-modal-feedback error';
          deleteModalFeedback.textContent = `Error: ${err.message}`;
        }
        if (confirmDeleteBtn) confirmDeleteBtn.disabled = false;
      }
    }

    async function handleWithdrawInstead() {
      if (!pendingDeleteLot) return;
      await handleQuickStatusChange(pendingDeleteLot.id, 'withdrawn');
      closeDeleteModal();
    }

    /**
     * Function: handleSeedDemoLots()
     * Purpose: Populates an empty database with 8 curated demonstration lots.
     * Uses SQL UPSERT ({ onConflict: 'legacy_id' }) so running this multiple times
     * updates existing rows rather than creating duplicate lots.
     */
    async function handleSeedDemoLots() {
      if (!confirm('This will insert the 8 curated demonstration lots into your Supabase database. Existing lots will be preserved. Proceed?')) {
        return;
      }

      if (seedLotsBtn) seedLotsBtn.disabled = true;
      if (lotsStatus) {
        lotsStatus.hidden = false;
        lotsStatus.className = 'admin-list-status';
        lotsStatus.textContent = 'Seeding demonstration lots to Supabase…';
      }

      let insertedCount = 0;
      for (const item of DEMO_SEED_LOTS) {
        try {
          const { data: lotData } = await auth.client
            .from('auction_lots')
            .upsert({
              legacy_id: item.legacy_id,
              lot_number: item.lot_number,
              category: item.category,
              period: item.period,
              title: item.title,
              subtitle: item.subtitle,
              description: item.description,
              current_bid: item.current_bid,
              estimate_low: item.estimate_low,
              estimate_high: item.estimate_high,
              status: 'live',
              published_at: new Date().toISOString(),
              created_by: verifiedUserId || null
            }, { onConflict: 'legacy_id' })
            .select()
            .single();

          if (lotData && item.image_url) {
            await auth.client.from('lot_images').upsert({
              lot_id: lotData.id,
              image_url: item.image_url,
              alt_text: item.title,
              is_primary: true,
              sort_order: 0
            }, { onConflict: 'lot_id,sort_order' });
            insertedCount++;
          }
        } catch (err) {
          console.warn('Seed lot item error:', err);
        }
      }

      if (seedLotsBtn) seedLotsBtn.disabled = false;
      alert(`Seeding completed. ${insertedCount} lots initialized.`);
      loadAdminLots();
      loadOverviewData();
    }

    // -------------------------------------------------------------------------
    // Event Wiring — Lots Controls
    // -------------------------------------------------------------------------
    function initLotsControls() {
      addLotBtn?.addEventListener('click', openAddModal);
      refreshLotsBtn?.addEventListener('click', loadAdminLots);
      seedLotsBtn?.addEventListener('click', handleSeedDemoLots);

      lotsSearchInput?.addEventListener('input', renderAdminLotsTable);
      statusFilter?.addEventListener('change', renderAdminLotsTable);
      categoryFilter?.addEventListener('change', renderAdminLotsTable);

      lotModalClose?.addEventListener('click', closeLotModal);
      lotFormCancel?.addEventListener('click', closeLotModal);
      lotForm?.addEventListener('submit', handleLotFormSubmit);

      deleteModalClose?.addEventListener('click', closeDeleteModal);
      cancelDeleteBtn?.addEventListener('click', closeDeleteModal);
      confirmDeleteBtn?.addEventListener('click', handleConfirmDelete);
      withdrawInsteadBtn?.addEventListener('click', handleWithdrawInstead);

      // Close modals when clicking the dim dark backdrop
      lotModal?.addEventListener('click', event => {
        if (event.target === lotModal) closeLotModal();
      });
      deleteModal?.addEventListener('click', event => {
        if (event.target === deleteModal) closeDeleteModal();
      });
    }

    // -------------------------------------------------------------------------
    // Navigation & Layout (Sidebar, Tabs, Logout)
    // -------------------------------------------------------------------------

    function closeMobileSidebar() {
      if (!sidebar) return;
      sidebar.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }

    /**
     * Function: switchSection(sectionKey, sectionLabel)
     * Purpose: Single-page tab switcher between Overview, Lots, and upcoming placeholders.
     */
    function switchSection(sectionKey, sectionLabel) {
      if (sectionTitle) sectionTitle.textContent = sectionLabel;

      document.querySelectorAll('[data-admin-section]').forEach(link => {
        link.classList.toggle('active', link.dataset.adminSection === sectionKey);
      });

      const isOverview = sectionKey === 'overview';
      const isLots = sectionKey === 'lots';

      if (overviewSection) overviewSection.hidden = !isOverview;
      if (lotsSection) lotsSection.hidden = !isLots;
      if (placeholderSection) placeholderSection.hidden = isOverview || isLots;

      if (isLots) {
        loadAdminLots();
      } else if (!isOverview) {
        // Explicitly documents unimplemented placeholder tabs
        if (placeholderTitle) placeholderTitle.textContent = `${sectionLabel} is being prepared.`;
        if (placeholderCopy) {
          placeholderCopy.textContent = `${sectionLabel} management has not been implemented yet. This read-only foundation does not provide simulated actions or controls.`;
        }
      }

      closeMobileSidebar();
    }

    /**
     * Function: handleLogout()
     * Purpose: Logs out administrator and redirects to auth.html.
     */
    async function handleLogout() {
      const result = await auth.signOut();
      if (result.error) {
        setConnectionStatus('Logout failed', 'is-limited');
        return;
      }
      window.location.replace('auth.html');
    }

    // -------------------------------------------------------------------------
    // Authority & Session Gate (Executes on Boot)
    // -------------------------------------------------------------------------

    // Step 1: Pre-flight check on auth configuration
    if (!auth || !auth.configured || !auth.client) {
      showAccessError('Supabase authentication is not configured for this environment.');
      return;
    }

    try {
      // Step 2: Retrieve the active session token
      const sessionResult = await auth.getSession();
      if (sessionResult.error) {
        showAccessError('Your session could not be restored. Please sign in again.');
        return;
      }
      if (!sessionResult.session) {
        // Not signed in: redirect to login with return intent
        window.location.replace('auth.html?next=admin');
        return;
      }

      // Step 3: Server-side cryptographic check for super_admin role
      const adminResult = await auth.isSuperAdmin();
      if (adminResult.error) {
        showAccessError('The database could not verify administrator authority. No dashboard data was loaded.');
        return;
      }
      if (!adminResult.authorized) {
        showAccessError('Access denied. This account is not the designated super-admin.');
        return;
      }

      // Access Granted! Populate admin user information
      verifiedUserId = sessionResult.session.user.id;
      const userEmail = sessionResult.session.user.email || 'Verified super-admin';

      if (accountEmail) accountEmail.textContent = userEmail;
      if (sidebarEmail) sidebarEmail.textContent = userEmail;

      if (accessState) accessState.hidden = true;
      if (dashboard) dashboard.hidden = false;

      // Bind Section Navigation click handlers
      document.querySelectorAll('[data-admin-section]').forEach(link => {
        link.addEventListener('click', event => {
          event.preventDefault();
          switchSection(link.dataset.adminSection, link.dataset.sectionLabel);
          window.history.replaceState(null, '', `#${link.dataset.adminSection}`);
        });
      });

      // Mobile Hamburger Toggle
      menuToggle?.addEventListener('click', () => {
        const isOpen = sidebar?.classList.toggle('is-open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
      });

      // Bind Logout buttons
      document.querySelectorAll('#admin-top-logout, #admin-sidebar-logout').forEach(button => {
        button.addEventListener('click', handleLogout);
      });

      // Initialize lots table controls and listeners
      initLotsControls();

      // Restore active tab from URL hash (#lots or default to #overview)
      const initialSectionKey = window.location.hash.slice(1);
      const matchedLink = document.querySelector(`[data-admin-section="${initialSectionKey}"]`);
      switchSection(
        matchedLink ? initialSectionKey : 'overview',
        matchedLink ? matchedLink.dataset.sectionLabel : 'Overview'
      );

      // Fetch overview metrics and activity streams
      await loadOverviewData();

      // Reactive listener: If admin logs out from another browser tab, immediately revoke access
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

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();
