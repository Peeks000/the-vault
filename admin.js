// THE VAULT — Private Curator & Administration Dashboard (admin.html)
(function () {
  'use strict';

  const q = sel => document.querySelector(sel);

  // Tiny DOM builder helper (prevents XSS by setting textContent rather than raw HTML)
  function el(tag, className = '', text = '', ...children) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== '' && text !== null && text !== undefined) node.textContent = text;
    if (children.length) node.append(...children);
    return node;
  }

  async function initAdmin() {
    const auth = window.vaultAuth;
    const accessState = q('#admin-access-state');
    const dashboard = q('#admin-dashboard');
    const sidebar = q('#admin-sidebar');
    const menuToggle = q('#admin-menu-toggle');
    const connectionIndicator = q('#admin-connection');
    const sectionTitle = q('#admin-section-title');
    const overviewSection = q('#admin-overview');
    const placeholderSection = q('#admin-placeholder');
    const lotsSection = q('#admin-lots');
    const lotsTbody = q('#admin-lots-tbody');
    const lotsStatus = q('#admin-lots-status');
    const lotsSearchInput = q('#admin-lots-search');
    const statusFilter = q('#admin-status-filter');
    const categoryFilter = q('#admin-category-filter');
    const lotModal = q('#admin-lot-modal');
    const lotForm = q('#admin-lot-form');
    const deleteModal = q('#admin-delete-modal');

    let adminLots = [];
    let pendingDeleteLot = null;
    const queryErrors = [];
    let verifiedUserId = '';

    // -------------------------------------------------------------------------
    // UI Helpers & Formatters
    // -------------------------------------------------------------------------
    function showAccessError(message) {
      if (!accessState) return;
      accessState.replaceChildren(
        el('p', 'admin-kicker', 'PRIVATE ROOM / ACCESS ISSUE'),
        el('h1', '', 'Entry could not be verified.'),
        el('span', '', message),
        Object.assign(el('a', 'admin-return-overview', 'Return to the house ↗'), { href: 'index.html' })
      );
    }

    function setConnectionStatus(text, statusClass) {
      if (!connectionIndicator) return;
      connectionIndicator.className = `admin-connection ${statusClass}`;
      connectionIndicator.replaceChildren(el('i'), document.createTextNode(text));
    }

    const setMetric = (id, val) => {
      const node = q(`#${id}`);
      if (node) node.textContent = val === null ? 'Unavailable' : Number(val).toLocaleString('en-IN');
    };

    const formatDate = v => !v ? 'Date unavailable' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(v));
    const formatAmount = v => (v === null || v === undefined) ? 'Amount unavailable' : `₹${Number(v).toLocaleString('en-IN')}`;

    function setListStatus(id, message, isError = false) {
      const target = q(`#${id}`);
      if (target) target.replaceChildren(el('p', `admin-list-status${isError ? ' is-error' : ''}`, message));
    }

    const createActivityRow = (kicker, title, detail) =>
      el('div', 'admin-activity-row', '', el('div', '', '', el('span', 'admin-row-kicker', kicker), el('strong', '', title), el('small', '', detail)));

    function renderActivityList(containerId, rows, renderer, emptyMsg) {
      const container = q(`#${containerId}`);
      if (!container) return;
      container.replaceChildren();
      if (!rows.length) return setListStatus(containerId, emptyMsg);
      rows.forEach(item => container.append(renderer(item)));
    }

    function recordQueryError(table, query, error) {
      queryErrors.push({
        table, query,
        code: error?.code || 'CLIENT_ERROR',
        message: error?.message || 'The request failed without a message.',
        details: error?.details || '',
        hint: error?.hint || ''
      });
    }

    function renderDiagnostics() {
      const list = q('#admin-diagnostics-list'), section = q('#admin-diagnostics');
      if (!list || !section) return;
      list.replaceChildren();
      section.hidden = !queryErrors.length;
      queryErrors.forEach(err => {
        const card = el('article', 'admin-diagnostic-row', '', el('strong', '', `${err.table} / ${err.query}`), el('span', '', err.code), el('p', '', err.message));
        if (err.details) card.append(el('small', '', `Details: ${err.details}`));
        if (err.hint) card.append(el('small', '', `Hint: ${err.hint}`));
        list.append(card);
      });
    }

    // -------------------------------------------------------------------------
    // 01 / Telemetry Metrics & Activity Feeds
    // -------------------------------------------------------------------------
    async function countRows(table, label, fn) {
      try {
        let qry = auth.client.from(table).select('*', { count: 'exact', head: true });
        if (fn) qry = fn(qry);
        const { count, error } = await qry;
        return { table, query: label, value: error ? null : (count || 0), error };
      } catch (err) {
        return { table, query: label, value: null, error: err };
      }
    }

    async function fetchRows(table, fn) {
      try { return await fn(auth.client.from(table)); }
      catch (err) { return { data: null, error: err }; }
    }

    async function loadOverviewData() {
      queryErrors.length = 0;

      // Parallel telemetry metric counts via Promise.all
      const metricIds = ['stat-total-lots', 'stat-published-lots', 'stat-live-auctions', 'stat-closed-auctions', 'stat-total-bids', 'stat-members'];
      const metrics = await Promise.all([
        countRows('auction_lots', 'total count'),
        countRows('auction_lots', 'published count', q => q.not('published_at', 'is', null)),
        countRows('auction_lots', 'live count', q => q.eq('status', 'live')),
        countRows('auction_lots', 'closed count', q => q.eq('status', 'closed')),
        countRows('bids', 'total count'),
        countRows('profiles', 'member count')
      ]);
      metrics.forEach((res, i) => {
        setMetric(metricIds[i], res.value);
        if (res.error) recordQueryError(res.table, res.query, res.error);
      });

      // Parallel recent activity feeds
      const [lotsRes, bidsRes, enqRes] = await Promise.all([
        fetchRows('auction_lots', t => t.select('id, lot_number, title, status, created_at').order('created_at', { ascending: false }).limit(5)),
        fetchRows('bids', t => t.select('id, lot_id, amount, created_at').order('created_at', { ascending: false }).limit(5)),
        fetchRows('contact_messages', t => t.select('id, full_name, enquiry_type, subject, status, created_at').order('created_at', { ascending: false }).limit(5))
      ]);

      const streams = [
        [lotsRes, 'auction_lots', 'recent lots', 'recent-lots', l => createActivityRow(l.status.toUpperCase(), l.title, `LOT ${l.lot_number} / ${formatDate(l.created_at)}`), 'No lots have been recorded yet.'],
        [bidsRes, 'bids', 'recent bids', 'recent-bids', b => createActivityRow('RECORDED BID', formatAmount(b.amount), `LOT ${String(b.lot_id).slice(0, 8)} / ${formatDate(b.created_at)}`), 'No bids have been recorded yet.'],
        [enqRes, 'contact_messages', 'recent enquiries', 'recent-enquiries', e => createActivityRow(e.status.toUpperCase(), e.subject, `${e.enquiry_type} / ${formatDate(e.created_at)}`), 'No enquiries have been recorded yet.']
      ];

      streams.forEach(([res, table, label, targetId, renderer, emptyMsg]) => {
        if (res.error) {
          recordQueryError(table, label, res.error);
          setListStatus(targetId, `Recent ${table.replace('_', ' ')} are unavailable from the current database connection.`, true);
        } else {
          renderActivityList(targetId, res.data || [], renderer, emptyMsg);
        }
      });

      renderDiagnostics();
      const hasErrors = queryErrors.length > 0;
      setConnectionStatus(hasErrors ? 'Connected with limitations' : 'Supabase connected', hasErrors ? 'is-limited' : 'is-connected');
    }

    // -------------------------------------------------------------------------
    // 02 / Lots CRUD Controller & Demo Seeding
    // -------------------------------------------------------------------------
    const DEMO_SEED_LOTS = [
      { legacy_id: 'watch', lot_number: '024', category: 'Timepieces', period: '1960s–70s', title: 'The Heritage Chronograph', subtitle: 'A considered study in mechanical craft and enduring design.', current_bid: 240000, estimate_low: 200000, estimate_high: 300000, image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85', description: 'There is a particular pleasure in a well-made mechanical object. The measured sweep of its hands, the tactility of its details and the quiet engineering beneath the dial make this a piece to be appreciated slowly.' },
      { legacy_id: 'art', lot_number: '031', category: 'Fine Art', period: 'Contemporary', title: 'A Study in Stillness', subtitle: 'A quiet composition that rewards a longer look.', current_bid: 85000, estimate_low: 65000, estimate_high: 110000, image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85', description: 'An artwork changes with the room around it and the attention it receives. This demonstration lot is presented as a study in colour, composition and the personal connection between an object and its collector.' },
      { legacy_id: 'car', lot_number: '042', category: 'Automotive', period: 'Classic', title: 'The Open-Road Icon', subtitle: 'A sculptural expression of performance and proportion.', current_bid: 1850000, estimate_low: 1600000, estimate_high: 2200000, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85', description: 'The appeal of a classic automobile lives in its stance, its surfaces and the feeling of a different era of design. This sample listing shows how an auction lot could present a vehicle to an informed audience.' },
      { legacy_id: 'jewel', lot_number: '056', category: 'Jewellery', period: 'Modern heirloom', title: 'The Quiet Brilliance', subtitle: 'A study in proportion, detail and considered making.', current_bid: 125000, estimate_low: 100000, estimate_high: 160000, image_url: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=85', description: 'Fine jewellery is often appreciated in the details: the finish, the balance and the way it catches light. This fictional lot demonstrates the editorial format for describing a piece without making unsupported claims.' },
      { legacy_id: 'camera', lot_number: '063', category: 'Timepieces', period: 'Mid-century', title: 'The Photographer’s Companion', subtitle: 'An enduring instrument for seeing the world differently.', current_bid: 42000, estimate_low: 35000, estimate_high: 60000, image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85', description: 'Mechanical cameras are a reminder that the process of making an image can be as satisfying as the image itself. This demonstration entry would be accompanied by verified technical details in a production auction.' },
      { legacy_id: 'sculpture', lot_number: '071', category: 'Fine Art', period: 'Contemporary', title: 'Form in Conversation', subtitle: 'An expressive object for a thoughtful space.', current_bid: 67000, estimate_low: 50000, estimate_high: 90000, image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=85', description: 'A sculptural piece that invites the viewer to move around it. Contemporary craft that balances material presence with restraint.' },
      { legacy_id: 'pen', lot_number: '085', category: 'Timepieces', period: '1950s', title: 'The Written Word', subtitle: 'A vintage fountain pen of distinguished provenance.', current_bid: 28000, estimate_low: 25000, estimate_high: 40000, image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1000&q=85', description: 'A solid gold nib, ebonite feed and celluloid barrel from an era when personal writing instruments were lifelong companions.' },
      { legacy_id: 'chair', lot_number: '094', category: 'Fine Art', period: 'Mid-century modern', title: 'The Lounge Classic', subtitle: 'An iconic silhouette in molded plywood and leather.', current_bid: 310000, estimate_low: 280000, estimate_high: 420000, image_url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=85', description: 'A benchmark in twentieth-century furniture design, combining organic warmth with industrial precision.' }
    ];

    async function loadAdminLots() {
      if (!lotsTbody || !lotsStatus) return;
      lotsStatus.hidden = false;
      lotsStatus.className = 'admin-list-status';
      lotsStatus.textContent = 'Loading auction listings from Supabase…';
      lotsTbody.replaceChildren();

      try {
        const { data, error } = await auth.client
          .from('auction_lots')
          .select('id, legacy_id, lot_number, category, period, title, subtitle, description, estimate_low, estimate_high, current_bid, bid_count, starts_at, ends_at, status, published_at, created_at, lot_images(id, image_url, alt_text, is_primary, sort_order)')
          .order('created_at', { ascending: false });

        if (error) {
          recordQueryError('auction_lots', 'load admin lots', error);
          lotsStatus.textContent = `Unable to fetch lots: ${error.message} (Code: ${error.code}). Check database RLS and table privileges.`;
          lotsStatus.className = 'admin-list-status is-error';
          return renderDiagnostics();
        }

        adminLots = data || [];
        renderAdminLotsTable();
      } catch (err) {
        lotsStatus.textContent = `Connection error: ${err.message}`;
        lotsStatus.className = 'admin-list-status is-error';
      }
    }

    function renderAdminLotsTable() {
      if (!lotsTbody || !lotsStatus) return;
      const search = (lotsSearchInput?.value || '').trim().toLowerCase();
      const statusVal = statusFilter?.value || 'all';
      const catVal = categoryFilter?.value || 'all';

      const filtered = adminLots.filter(l => {
        const matchSearch = !search || `${l.lot_number || ''} ${l.title || ''} ${l.category || ''} ${l.subtitle || ''}`.toLowerCase().includes(search);
        return (statusVal === 'all' || l.status === statusVal) && (catVal === 'all' || l.category === catVal) && matchSearch;
      });

      lotsTbody.replaceChildren();
      if (!adminLots.length || !filtered.length) {
        lotsStatus.hidden = false;
        lotsStatus.className = 'admin-list-status';
        lotsStatus.textContent = !adminLots.length
          ? 'No auction lots recorded in Supabase yet. Click "Add new lot" or "Seed demo lots" to begin.'
          : 'No lots matched the current filter and search criteria.';
        return;
      }
      lotsStatus.hidden = true;

      filtered.forEach(lot => {
        const imgs = Array.isArray(lot.lot_images) ? lot.lot_images : [];
        const imgSrc = (imgs.find(i => i.is_primary) || imgs[0])?.image_url || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=150&q=80';
        const estText = lot.estimate_low && lot.estimate_high ? `${formatAmount(lot.estimate_low)} – ${formatAmount(lot.estimate_high)}` : (lot.estimate_low ? `From ${formatAmount(lot.estimate_low)}` : 'Upon request');

        const thumb = Object.assign(el('img', 'admin-lot-thumb'), { src: imgSrc, alt: lot.title, loading: 'lazy' });

        const statusSelect = el('select', `admin-action-btn admin-status-select status-${lot.status}`);
        statusSelect.setAttribute('aria-label', `Change status for ${lot.title}`);
        ['draft', 'scheduled', 'live', 'closed', 'withdrawn'].forEach(st => {
          const opt = Object.assign(el('option', '', st.charAt(0).toUpperCase() + st.slice(1)), { value: st, selected: lot.status === st });
          statusSelect.append(opt);
        });
        statusSelect.addEventListener('change', () => handleQuickStatusChange(lot.id, statusSelect.value));

        const editBtn = Object.assign(el('button', 'admin-action-btn btn-edit', 'Edit'), { type: 'button' });
        editBtn.addEventListener('click', () => openEditModal(lot.id));

        const delBtn = Object.assign(el('button', 'admin-action-btn btn-delete', 'Delete'), { type: 'button' });
        delBtn.addEventListener('click', () => openDeleteModal(lot));

        lotsTbody.append(el('tr', '', '',
          el('td', '', '', el('strong', '', `LOT ${lot.lot_number || '—'}`)),
          el('td', '', '', el('div', 'admin-lot-cell', '', thumb, el('div', '', '', el('strong', 'admin-lot-meta-title', lot.title), el('span', 'admin-lot-meta-subtitle', lot.subtitle || lot.period || 'No subtitle provided')))),
          el('td', '', lot.category),
          el('td', '', '', el('strong', '', formatAmount(lot.current_bid))),
          el('td', '', '', el('small', '', estText)),
          el('td', '', '', statusSelect),
          el('td', 'admin-actions-cell', '', el('div', 'admin-row-actions', '', editBtn, delBtn))
        ));
      });
    }

    // -------------------------------------------------------------------------
    // Modal Workflows (Add, Edit, Delete / Withdraw)
    // -------------------------------------------------------------------------
    function setModalFeedback(msg, type = '') {
      const box = q('#modal-lot-feedback');
      if (!box) return;
      box.textContent = msg;
      box.className = `admin-modal-feedback ${type}`.trim();
      box.hidden = !msg;
    }

    function openAddModal() {
      if (!lotModal || !lotForm) return;
      lotForm.reset();
      q('#lot-form-id').value = '';
      q('#lot-form-mode').value = 'add';
      q('#modal-lot-title').textContent = 'Add new auction listing';
      q('#lot-form-status').value = 'live';
      q('#lot-form-published').checked = true;
      setModalFeedback('');
      lotModal.hidden = false;
    }

    function openEditModal(lotId) {
      const lot = adminLots.find(i => i.id === lotId);
      if (!lot || !lotModal || !lotForm) return;
      const imgs = Array.isArray(lot.lot_images) ? lot.lot_images : [];
      const primaryImg = imgs.find(i => i.is_primary) || imgs[0];

      q('#lot-form-id').value = lot.id;
      q('#lot-form-mode').value = 'edit';
      q('#modal-lot-title').textContent = `Edit auction listing (LOT ${lot.lot_number})`;
      q('#lot-form-title').value = lot.title || '';
      q('#lot-form-number').value = (lot.lot_number || '').replace(/^LOT\s*/i, '');
      q('#lot-form-category').value = lot.category || 'Timepieces';
      q('#lot-form-status').value = lot.status || 'live';
      q('#lot-form-subtitle').value = lot.subtitle || '';
      q('#lot-form-description').value = lot.description || '';
      q('#lot-form-period').value = lot.period || '';
      q('#lot-form-price').value = lot.current_bid ?? 0;
      q('#lot-form-est-low').value = lot.estimate_low ?? '';
      q('#lot-form-est-high').value = lot.estimate_high ?? '';
      q('#lot-form-image').value = primaryImg?.image_url || '';
      q('#lot-form-published').checked = Boolean(lot.published_at);

      setModalFeedback('');
      lotModal.hidden = false;
    }

    const closeLotModal = () => { if (lotModal) lotModal.hidden = true; setModalFeedback(''); };

    async function handleLotFormSubmit(event) {
      event.preventDefault();
      const mode = q('#lot-form-mode').value, lotId = q('#lot-form-id').value;
      const title = (q('#lot-form-title')?.value || '').trim();
      const lotNumber = (q('#lot-form-number')?.value || '').trim();
      const price = Number(q('#lot-form-price')?.value) || 0;
      const estLow = q('#lot-form-est-low')?.value ? Number(q('#lot-form-est-low').value) : null;
      const estHigh = q('#lot-form-est-high')?.value ? Number(q('#lot-form-est-high').value) : null;
      const imageUrl = (q('#lot-form-image')?.value || '').trim();

      if (!title) return setModalFeedback('Please enter a product title.', 'error');
      if (!lotNumber) return setModalFeedback('Please enter a lot number.', 'error');
      if (price < 0) return setModalFeedback('Starting/current bid cannot be negative.', 'error');
      if (estLow !== null && estHigh !== null && estHigh < estLow) {
        return setModalFeedback('Estimate maximum must be greater than or equal to estimate minimum.', 'error');
      }

      setModalFeedback('Saving listing to Supabase…', 'loading');
      const now = new Date().toISOString();
      const payload = {
        lot_number: lotNumber,
        category: q('#lot-form-category')?.value || 'Timepieces',
        period: (q('#lot-form-period')?.value || '').trim() || null,
        title,
        subtitle: (q('#lot-form-subtitle')?.value || '').trim() || null,
        description: (q('#lot-form-description')?.value || '').trim() || null,
        estimate_low: estLow,
        estimate_high: estHigh,
        current_bid: price,
        status: q('#lot-form-status')?.value || 'live',
        published_at: q('#lot-form-published')?.checked ? now : null,
        updated_at: now
      };

      try {
        if (mode === 'add') {
          payload.legacy_id = `lot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          payload.created_by = verifiedUserId || null;
          const { data: newLot, error } = await auth.client.from('auction_lots').insert(payload).select().single();
          if (error) { recordQueryError('auction_lots', 'insert lot', error); return setModalFeedback(`Failed to save listing: ${error.message}`, 'error'); }
          if (imageUrl && newLot) {
            await auth.client.from('lot_images').insert({ lot_id: newLot.id, image_url: imageUrl, alt_text: title, is_primary: true, sort_order: 0 });
          }
          setModalFeedback('✓ Auction listing created successfully.', 'success');
        } else {
          const { error } = await auth.client.from('auction_lots').update(payload).eq('id', lotId);
          if (error) { recordQueryError('auction_lots', 'update lot', error); return setModalFeedback(`Failed to update listing: ${error.message}`, 'error'); }
          if (imageUrl) {
            const { data: imgs } = await auth.client.from('lot_images').select('id').eq('lot_id', lotId).eq('is_primary', true);
            if (imgs?.length) await auth.client.from('lot_images').update({ image_url: imageUrl, alt_text: title }).eq('id', imgs[0].id);
            else await auth.client.from('lot_images').insert({ lot_id: lotId, image_url: imageUrl, alt_text: title, is_primary: true, sort_order: 0 });
          }
          setModalFeedback('✓ Auction listing updated successfully.', 'success');
        }
        setTimeout(() => { closeLotModal(); loadAdminLots(); loadOverviewData(); }, 600);
      } catch (err) {
        setModalFeedback(`Error saving listing: ${err.message}`, 'error');
      }
    }

    async function handleQuickStatusChange(lotId, newStatus) {
      try {
        const update = { status: newStatus, updated_at: new Date().toISOString() };
        if (newStatus === 'live' || newStatus === 'scheduled') update.published_at = update.updated_at;
        const { error } = await auth.client.from('auction_lots').update(update).eq('id', lotId);
        if (error) { alert(`Could not update status: ${error.message}`); return loadAdminLots(); }

        const target = adminLots.find(i => i.id === lotId);
        if (target) target.status = newStatus;
        renderAdminLotsTable();
        loadOverviewData();
      } catch (err) {
        alert(`Error: ${err.message}`);
        loadAdminLots();
      }
    }

    function openDeleteModal(lot) {
      pendingDeleteLot = lot;
      if (!deleteModal) return;
      q('#delete-modal-copy').textContent = `Are you sure you want to permanently delete LOT ${lot.lot_number} ("${lot.title}")? This action cannot be undone.`;
      q('#delete-modal-feedback').hidden = true;
      q('#withdraw-instead-btn').hidden = true;
      q('#confirm-delete-btn').disabled = false;
      deleteModal.hidden = false;
    }

    const closeDeleteModal = () => { if (deleteModal) deleteModal.hidden = true; pendingDeleteLot = null; };

    async function handleConfirmDelete() {
      if (!pendingDeleteLot) return;
      const fb = q('#delete-modal-feedback'), btn = q('#confirm-delete-btn'), withdrawBtn = q('#withdraw-instead-btn');
      if (btn) btn.disabled = true;
      if (fb) { fb.hidden = false; fb.className = 'admin-modal-feedback'; fb.textContent = 'Removing lot from database…'; }

      try {
        const { error } = await auth.client.from('auction_lots').delete().eq('id', pendingDeleteLot.id);
        if (error) {
          recordQueryError('auction_lots', 'delete lot', error);
          if (fb) {
            fb.className = 'admin-modal-feedback error';
            // Catch SQLSTATE 23503 Foreign Key Constraint violation and offer safe withdrawal
            if (error.code === '23503' || String(error.message).includes('foreign key')) {
              fb.textContent = 'This lot cannot be deleted because permanent bid records or watchlist references exist in the database. To preserve financial audit integrity, change its status to Withdrawn instead.';
              if (withdrawBtn) withdrawBtn.hidden = false;
            } else {
              fb.textContent = `Delete blocked: ${error.message}`;
            }
          }
          if (btn) btn.disabled = false;
          return;
        }
        if (fb) { fb.className = 'admin-modal-feedback success'; fb.textContent = '✓ Lot deleted permanently.'; }
        setTimeout(() => { closeDeleteModal(); loadAdminLots(); loadOverviewData(); }, 500);
      } catch (err) {
        if (fb) { fb.className = 'admin-modal-feedback error'; fb.textContent = `Error: ${err.message}`; }
        if (btn) btn.disabled = false;
      }
    }

    async function handleSeedDemoLots() {
      if (!confirm('This will insert the 8 curated demonstration lots into your Supabase database. Existing lots will be preserved. Proceed?')) return;
      const seedBtn = q('#admin-seed-lots-btn');
      if (seedBtn) seedBtn.disabled = true;
      if (lotsStatus) { lotsStatus.hidden = false; lotsStatus.className = 'admin-list-status'; lotsStatus.textContent = 'Seeding demonstration lots to Supabase…'; }

      let count = 0;
      for (const item of DEMO_SEED_LOTS) {
        try {
          const { data: lotData } = await auth.client.from('auction_lots').upsert({
            legacy_id: item.legacy_id, lot_number: item.lot_number, category: item.category,
            period: item.period, title: item.title, subtitle: item.subtitle, description: item.description,
            current_bid: item.current_bid, estimate_low: item.estimate_low, estimate_high: item.estimate_high,
            status: 'live', published_at: new Date().toISOString(), created_by: verifiedUserId || null
          }, { onConflict: 'legacy_id' }).select().single();

          if (lotData && item.image_url) {
            await auth.client.from('lot_images').upsert({
              lot_id: lotData.id, image_url: item.image_url, alt_text: item.title, is_primary: true, sort_order: 0
            }, { onConflict: 'lot_id,sort_order' });
            count++;
          }
        } catch (err) { console.warn('Seed lot item error:', err); }
      }
      if (seedBtn) seedBtn.disabled = false;
      alert(`Seeding completed. ${count} lots initialized.`);
      loadAdminLots();
      loadOverviewData();
    }

    // -------------------------------------------------------------------------
    // Section Navigation & Authority Gate
    // -------------------------------------------------------------------------
    function switchSection(key, label) {
      if (sectionTitle) sectionTitle.textContent = label;
      document.querySelectorAll('[data-admin-section]').forEach(l => l.classList.toggle('active', l.dataset.adminSection === key));

      const isOverview = key === 'overview', isLots = key === 'lots';
      if (overviewSection) overviewSection.hidden = !isOverview;
      if (lotsSection) lotsSection.hidden = !isLots;
      if (placeholderSection) placeholderSection.hidden = isOverview || isLots;

      if (isLots) loadAdminLots();
      else if (!isOverview) {
        q('#admin-placeholder-title').textContent = `${label} is being prepared.`;
        q('#admin-placeholder-copy').textContent = `${label} management has not been implemented yet. This read-only foundation does not provide simulated actions or controls.`;
      }
      sidebar?.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }

    if (!auth?.configured || !auth.client) return showAccessError('Supabase authentication is not configured for this environment.');

    try {
      const sessionRes = await auth.getSession();
      if (sessionRes.error) return showAccessError('Your session could not be restored. Please sign in again.');
      if (!sessionRes.session) return window.location.replace('auth.html?next=admin');

      const adminRes = await auth.isSuperAdmin();
      if (adminRes.error) return showAccessError('The database could not verify administrator authority. No dashboard data was loaded.');
      if (!adminRes.authorized) return showAccessError('Access denied. This account is not the designated super-admin.');

      verifiedUserId = sessionRes.session.user.id;
      const email = sessionRes.session.user.email || 'Verified super-admin';
      if (q('#admin-account-email')) q('#admin-account-email').textContent = email;
      if (q('#admin-sidebar-email')) q('#admin-sidebar-email').textContent = email;
      if (accessState) accessState.hidden = true;
      if (dashboard) dashboard.hidden = false;

      // Wire events
      document.querySelectorAll('[data-admin-section]').forEach(link => link.addEventListener('click', e => {
        e.preventDefault();
        switchSection(link.dataset.adminSection, link.dataset.sectionLabel);
        window.history.replaceState(null, '', `#${link.dataset.adminSection}`);
      }));

      menuToggle?.addEventListener('click', () => menuToggle.setAttribute('aria-expanded', String(sidebar?.classList.toggle('is-open'))));
      document.querySelectorAll('#admin-top-logout, #admin-sidebar-logout').forEach(b => b.addEventListener('click', async () => {
        const res = await auth.signOut();
        if (res.error) setConnectionStatus('Logout failed', 'is-limited');
        else window.location.replace('auth.html');
      }));

      q('#admin-add-lot-btn')?.addEventListener('click', openAddModal);
      q('#admin-refresh-lots-btn')?.addEventListener('click', loadAdminLots);
      q('#admin-seed-lots-btn')?.addEventListener('click', handleSeedDemoLots);
      lotsSearchInput?.addEventListener('input', renderAdminLotsTable);
      statusFilter?.addEventListener('change', renderAdminLotsTable);
      categoryFilter?.addEventListener('change', renderAdminLotsTable);

      q('#admin-lot-modal-close')?.addEventListener('click', closeLotModal);
      q('#lot-form-cancel')?.addEventListener('click', closeLotModal);
      lotForm?.addEventListener('submit', handleLotFormSubmit);
      lotModal?.addEventListener('click', e => { if (e.target === lotModal) closeLotModal(); });

      q('#admin-delete-modal-close')?.addEventListener('click', closeDeleteModal);
      q('#cancel-delete-btn')?.addEventListener('click', closeDeleteModal);
      q('#confirm-delete-btn')?.addEventListener('click', handleConfirmDelete);
      q('#withdraw-instead-btn')?.addEventListener('click', async () => {
        if (!pendingDeleteLot) return;
        await handleQuickStatusChange(pendingDeleteLot.id, 'withdrawn');
        closeDeleteModal();
      });
      deleteModal?.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

      const initKey = window.location.hash.slice(1);
      const matched = q(`[data-admin-section="${initKey}"]`);
      switchSection(matched ? initKey : 'overview', matched ? matched.dataset.sectionLabel : 'Overview');
      await loadOverviewData();

      auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) window.location.replace('auth.html');
        else if (session.user.id !== verifiedUserId) window.location.reload();
      });
    } catch (err) {
      console.error('Administration entry error:', err);
      showAccessError('The administration room could not be loaded. Please try again.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAdmin);
  else initAdmin();
})();
