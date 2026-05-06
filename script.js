//Github : 
//Discord : Rinmochi

/* =========================================================
 * Pinterest Clone
 * Features: create, read, update, delete, search, tags filter,
 * file upload from computer, image URL, localStorage persistence.
 * ========================================================= */

(function () {
  'use strict';

  // ==========================================
  // CONSTANTS - Configuration & Seed Data
  // ==========================================
  // STORAGE_KEY: unique key for localStorage to persist pins across sessions
  // using versioning (v2) to allow future schema migrations
  const STORAGE_KEY = 'pinterest.pins.v2';
  
  // SEED_PINS: default sample pins loaded on first visit to demonstrate the app
  // each pin contains title, description, image URL (from Unsplash), and tags array
  // these are converted to proper pin objects with generated IDs and timestamps in loadPins()
  const SEED_PINS = [
    { title: 'Cozy Reading Nook', description: 'Warm tones and soft lighting make this corner irresistible.', image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600', tags: ['home', 'design', 'cozy'] },
    { title: 'Mountain Sunrise', description: 'A breathtaking view above the clouds at golden hour.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600', tags: ['travel', 'nature', 'photography'] },
    { title: 'Minimalist Workspace', description: 'Clean lines, neutral palette, maximum focus.', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', tags: ['design', 'workspace', 'minimal'] },
    { title: 'Street Food Adventures', description: 'Vibrant flavors from a night market in Bangkok.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', tags: ['food', 'travel'] },
    { title: 'Forest Path', description: 'Sunlight filtering through the canopy on a quiet morning.', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', tags: ['nature', 'photography'] },
    { title: 'Urban Architecture', description: 'Geometric shapes and shadows in the modern city skyline.', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600', tags: ['architecture', 'design', 'urban'] },
    { title: 'Pasta Night', description: 'Homemade tagliatelle with a rich tomato basil sauce.', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600', tags: ['food', 'recipe'] },
    { title: 'Beach Escape', description: 'Crystal clear water and white sand — pure paradise.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', tags: ['travel', 'nature', 'beach'] },
  ];

  // ==========================================
  // STYLES - Injected via JavaScript
  // ==========================================

  const STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #f9f9f9; --card: #ffffff; --text: #1a1a1a; --muted: #767676;
      --accent: #e60023; --accent-hover: #ad081b; --border: #e1e1e1;
      --shadow: 0 1px 3px rgba(0,0,0,.08); --shadow-hover: 0 8px 24px rgba(0,0,0,.18);
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { position: sticky; top: 0; z-index: 100; background: var(--card); border-bottom: 1px solid var(--border); padding: 12px 24px; display: flex; align-items: center; gap: 16px; }
    .logo { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 22px; color: var(--accent); text-decoration: none; }
    .logo-icon { width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; }
    .search { flex: 1; max-width: 700px; padding: 12px 16px; border-radius: 24px; background: #efefef; border: none; font-size: 15px; outline: none; }
    .search:focus { background: #fff; box-shadow: 0 0 0 2px var(--accent); }
    .header-spacer { flex: 1; }
    .btn { padding: 10px 18px; border-radius: 24px; border: none; font-weight: 600; font-size: 14px; cursor: pointer; transition: background .15s, transform .1s; white-space: nowrap; }
    .btn:active { transform: scale(.97); }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-secondary { background: #efefef; color: var(--text); }
    .btn-secondary:hover { background: #e0e0e0; }
    .btn-ghost { background: transparent; color: var(--text); }
    .btn-ghost:hover { background: #efefef; }

    .tag-bar { display: flex; gap: 8px; padding: 12px 24px; overflow-x: auto; background: var(--card); border-bottom: 1px solid var(--border); position: sticky; top: 65px; z-index: 99; scrollbar-width: thin; }
    .tag-bar::-webkit-scrollbar { height: 6px; }
    .tag-bar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
    .tag-chip { padding: 8px 16px; border-radius: 20px; background: #efefef; border: none; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s; }
    .tag-chip:hover { background: #e0e0e0; }
    .tag-chip.active { background: var(--text); color: #fff; }

    main { padding: 24px; }
    .grid { column-count: 5; column-gap: 16px; }
    @media (max-width: 1400px) { .grid { column-count: 4; } }
    @media (max-width: 1024px) { .grid { column-count: 3; } }
    @media (max-width: 700px)  { .grid { column-count: 2; } }
    @media (max-width: 480px)  { .grid { column-count: 1; } }

    .pin { break-inside: avoid; margin-bottom: 16px; background: var(--card); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow); cursor: pointer; position: relative; transition: box-shadow .2s, transform .2s; }
    .pin:hover { box-shadow: var(--shadow-hover); transform: translateY(-2px); }
    .pin img { width: 100%; display: block; }
    .pin-body { padding: 12px 14px 14px; }
    .pin-title { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
    .pin-desc { font-size: 13px; color: var(--muted); line-height: 1.4; margin-bottom: 8px; }
    .pin-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .pin-tag { font-size: 11px; background: #f0f0f0; color: #555; padding: 3px 8px; border-radius: 10px; font-weight: 500; }
    .pin-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; opacity: 0; transition: opacity .15s; }
    .pin:hover .pin-actions { opacity: 1; }
    .icon-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.95); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 6px rgba(0,0,0,.2); }
    .icon-btn:hover { background: #fff; }
    .icon-btn.danger:hover { background: var(--accent); color: #fff; }

    .empty { text-align: center; padding: 80px 20px; color: var(--muted); }
    .empty h2 { font-size: 22px; margin-bottom: 8px; color: var(--text); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: none; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
    .modal-backdrop.open { display: flex; }
    .modal { background: var(--card); border-radius: 20px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 28px; }
    .modal h2 { margin-bottom: 20px; font-size: 22px; }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
    .field input, .field textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--border); border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; transition: border-color .15s; }
    .field input:focus, .field textarea:focus { border-color: var(--accent); }
    .field textarea { resize: vertical; min-height: 80px; }
    .field-hint { font-size: 12px; color: var(--muted); margin-top: 4px; }

    .upload-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: border-color .15s, background .15s; }
    .upload-zone:hover, .upload-zone.dragover { border-color: var(--accent); background: #fff5f5; }
    .upload-zone p { color: var(--muted); font-size: 13px; }
    .upload-zone strong { color: var(--accent); }
    .or-divider { text-align: center; color: var(--muted); font-size: 12px; margin: 12px 0; position: relative; }
    .or-divider::before, .or-divider::after { content: ''; position: absolute; top: 50%; width: 45%; height: 1px; background: var(--border); }
    .or-divider::before { left: 0; } .or-divider::after { right: 0; }

    .preview { width: 100%; max-height: 240px; object-fit: contain; background: #f0f0f0; border-radius: 10px; margin-top: 8px; display: none; }
    .preview.show { display: block; }

    .tags-input-wrap { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border: 1px solid var(--border); border-radius: 10px; min-height: 44px; align-items: center; }
    .tags-input-wrap:focus-within { border-color: var(--accent); }
    .tag-pill { background: var(--text); color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
    .tag-pill button { background: none; border: none; color: #fff; cursor: pointer; font-size: 14px; line-height: 1; padding: 0; }
    .tags-input-wrap input { border: none; outline: none; flex: 1; min-width: 100px; padding: 6px; font-size: 14px; }

    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

    .detail { background: var(--card); border-radius: 20px; width: 100%; max-width: 800px; max-height: 90vh; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; position: relative; }
    @media (max-width: 700px) { .detail { grid-template-columns: 1fr; max-height: 95vh; overflow-y: auto; } }
    .detail img { width: 100%; height: 100%; object-fit: cover; max-height: 90vh; }
    .detail-body { padding: 28px; overflow-y: auto; }
    .detail-body h2 { font-size: 26px; margin-bottom: 12px; }
    .detail-body p { color: #444; line-height: 1.5; margin-bottom: 16px; }
    .detail-meta { font-size: 12px; color: var(--muted); margin-bottom: 16px; }
    .detail-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
    .close-x { position: absolute; top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; border: none; cursor: pointer; font-size: 18px; z-index: 10; }
  `;

  // ==========================================
  // STATE MANAGEMENT - Single Source of Truth
  // ==========================================
  // pins: main data array holding all pin objects
  //   each pin: { id, title, description, image, tags[], createdAt }
  // editingId: tracks which pin (if any) is currently being edited; null when creating new
  // currentDetailId: ID of pin shown in detail modal; used to link edit/delete actions
  // searchQuery: current text input from search field; triggers filter on change
  // activeTag: currently selected tag filter (null = show all); toggles on/off
  // pendingTags: array of tags being added in form modal before pin is saved
  // pendingImage: temporarily holds image (file or URL) in form before save
  //
  // These variables drive the reactive UI: when changed, render* functions are called
  let pins = [];
  // Tracks which pin is being edited (null for new pin)
  let editingId = null;
  // ID of currently displayed pin in detail view
  let currentDetailId = null;
  // User's search text, drives filter logic
  let searchQuery = '';
  // Currently active tag filter (null = no filter)
  let activeTag = null;
  // Tags temporarily collected before form submission
  let pendingTags = [];
  // Holds image data (dataURL or URL) before form is submitted
  let pendingImage = '';

  // ==========================================
  // DOM CACHE - Avoid repeated querySelector calls
  // ==========================================
  // Storing references to frequently accessed DOM elements at app start
  // This improves performance and makes code more readable
  // $ is a shorthand utility function equivalent to document.getElementById
  // Pattern: cache once in cacheDOM(), then reuse throughout the app
  let $ = (id) => document.getElementById(id);
  
  // Grid and main layout
  let grid, emptyState, searchInput, createBtn, tagBar;
  // Form modal and inputs
  let formModal, formTitle, pinForm, titleInput, descInput, imageInput, imagePreview;
  // Form controls
  let cancelBtn, saveBtn, fileInput, uploadZone, tagsWrap, tagsInput, orDivider;
  // Detail modal for viewing pins
  let detailModal, detailImg, detailTitle, detailDesc, detailMeta, detailTags;
  // Detail modal buttons
  let detailClose, detailEdit, detailDelete;

  // ==========================================
  // FUNCTION: cacheDOM
  // ==========================================
  // Purpose: Initialize all DOM element references at app startup
  // Called once in init() before event binding
  // Finding orDivider as nextElementSibling because it's a structural element
  // without a unique ID (shared 'or-divider' class styling)
  // Benefits: Reduces DOM lookups (querySelector is expensive) and centralizes
  // all DOM references in one place for easier maintenance
  function cacheDOM() {
    // Cache grid container and utility elements
    grid = $('pinGrid'); emptyState = $('emptyState'); searchInput = $('searchInput');
    createBtn = $('createBtn'); tagBar = $('tagBar');
    // Cache form modal and its input fields
    formModal = $('formModal'); formTitle = $('formTitle'); pinForm = $('pinForm');
    titleInput = $('titleInput'); descInput = $('descInput'); imageInput = $('imageInput');
    imagePreview = $('imagePreview'); cancelBtn = $('cancelBtn'); saveBtn = $('saveBtn');
    fileInput = $('fileInput'); uploadZone = $('uploadZone');
    tagsWrap = $('tagsWrap'); tagsInput = $('tagsInput');
    // Find orDivider as next sibling to uploadZone (for show/hide functionality)
    orDivider = uploadZone.nextElementSibling;
    // Cache detail modal and its elements
    detailModal = $('detailModal'); detailImg = $('detailImg'); detailTitle = $('detailTitle');
    detailDesc = $('detailDesc'); detailMeta = $('detailMeta'); detailTags = $('detailTags');
    detailClose = $('detailClose'); detailEdit = $('detailEdit'); detailDelete = $('detailDelete');
  }

  // ==========================================
  // DATA PERSISTENCE - localStorage Management
  // ==========================================
  // This section handles reading from and writing to browser localStorage
  // localStorage persists data across browser sessions (until cleared)
  // Approach:
  // 1. On app start: try to load saved pins from localStorage
  // 2. If localStorage is empty or invalid: populate with SEED_PINS
  // 3. On every change: save current pins array to localStorage
  //
  // FUNCTION: loadPins
  // Reads pins from localStorage, parses JSON, validates array
  // If storage is empty or invalid, transforms SEED_PINS into pin objects
  // with generated IDs and timestamps (staggered 1 minute apart for sorting)
  // Returns: array of pin objects
  function loadPins() {
    // Try to retrieve and parse existing pins from localStorage
    // Graceful fallback: catch parse errors and return seed data instead
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Validate that parsed data is actually an array (prevents accidents)
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { console.warn('Failed to parse stored pins.', e); }
    // If no valid stored data: create default pins from SEED_PINS template
    // Map assigns unique IDs and timestamps (newest first for display sorting)
    // Timestamps are staggered by 1 minute (60000ms) for realistic ordering
    const seeded = SEED_PINS.map((p, i) => ({
      id: generateId(), title: p.title, description: p.description,
      image: p.image, tags: p.tags || [], createdAt: Date.now() - (SEED_PINS.length - i) * 60000,
    }));
    savePins(seeded);
    return seeded;
  }

  // FUNCTION: savePins
  // Serializes pins array to JSON and saves to localStorage
  // Storage has limits (~5-10MB depending on browser)
  // If full: alerts user and returns false for error handling
  function savePins(list) {
    // Attempt to serialize and store pins
    // localStorage stores as string; we use JSON to convert objects
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      // Likely storage quota exceeded (user has too many large pin images)
      console.error('Save failed:', e);
      alert('Storage is full. Try deleting some older pins to free up space, then try again.');
      return false;
    }
  }

  // FUNCTION: generateId
  // Creates a unique identifier combining timestamp and random string
  // Format: 'pin_' + timestamp + '_' + random
  // Ensures no ID collisions even if multiple pins created in same ms
  function generateId() {
    // timestamp in base-36 is compact and sortable
    // random suffix prevents collisions (very unlikely but possible with timestamps alone)
    return 'pin_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // ==========================================
  // UTILITY HELPERS - String & Data Formatting
  // ==========================================
  // These functions transform and sanitize data for display
  // FUNCTION: escapeHTML
  // Prevents XSS (cross-site scripting) attacks by encoding special HTML characters
  // Required because user-generated content (titles, descriptions) is inserted into DOM
  // Example: user input "<script>alert('xss')</script>" becomes harmless text
  function escapeHTML(str) {
    // Replace HTML special characters with their entity equivalents
    // Ensures user text is displayed literally, not interpreted as markup
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // FUNCTION: formatDate
  // Converts Unix timestamp to relative human-readable format (e.g., "2h ago")
  // Shows exact date for pins older than 7 days
  // Calculation: compare difference in seconds against time thresholds
  function formatDate(ts) {
    // Calculate elapsed time in seconds between pin creation and now
    const diff = (Date.now() - ts) / 1000;
    // Return appropriate format based on age: seconds < minutes < hours < days < weeks
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    // For older pins, show full date
    return new Date(ts).toLocaleDateString();
  }

  // FUNCTION: getAllTags
  // Aggregates all unique tags from all pins with frequency counts
  // Returns array sorted by frequency (most used tags first)
  // Uses Map to count occurrences efficiently: Map.set(tag, count)
  // This drives the tag bar rendering and enables tag filtering
  function getAllTags() {
    // Build a map of tag -> count by iterating through all pins and their tags
    const map = new Map();
    pins.forEach((p) => (p.tags || []).forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    // Convert map entries to array, sort descending by count, extract just tag names
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }

  // FUNCTION: getFilteredPins
  // Core filtering logic: combines search, tag filter, and recent-first sorting
  // Returns pins matching current searchQuery and activeTag
  // Always sorts by createdAt descending (newest first)
  // Performs two-stage filtering: tag first (faster), then text search on description/tags
  function getFilteredPins() {
    // Normalize search query: trim whitespace and convert to lowercase for case-insensitive matching
    const q = searchQuery.trim().toLowerCase();
    // Clone and sort by recency (newest pins first)
    let list = pins.slice().sort((a, b) => b.createdAt - a.createdAt);
    // First filter: by tag (if one is selected)
    // If activeTag is null, skip this filter (show all pins)
    if (activeTag) list = list.filter((p) => (p.tags || []).includes(activeTag));
    // Second filter: by search query text
    // Concatenate title + description + tags for comprehensive search
    // allows users to search by any attribute
    if (q) {
      list = list.filter((p) => {
        const hay = (p.title + ' ' + (p.description || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }

  // ==========================================
  // TAG BAR RENDERING - Dynamic Tag Filter UI
  // ==========================================
  // The tag bar is a sticky horizontal scrollbar showing all available tags
  // Users click tags to filter pins; each tag shows implicitly which are popular
  // FUNCTION: renderTagBar
  // Dynamically creates tag buttons from getAllTags()
  // Includes "All" button to clear filters
  // Tags are sorted by frequency (most used first)
  // Active tag is highlighted with dark background
  function renderTagBar() {
    // Get all unique tags sorted by frequency
    const tags = getAllTags();
    // Clear old tag buttons
    tagBar.innerHTML = '';
    // If no tags exist (empty app), hide the entire tag bar
    if (tags.length === 0) { tagBar.style.display = 'none'; return; }
    tagBar.style.display = 'flex';

    // Create "All" button to clear tag filter
    // When clicked, sets activeTag to null and re-renders
    const allBtn = document.createElement('button');
    allBtn.className = 'tag-chip' + (activeTag === null ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.onclick = () => { activeTag = null; renderTagBar(); renderGrid(); };
    tagBar.appendChild(allBtn);

    // Create a button for each tag
    // Toggle behavior: click to select, click again to deselect
    // Re-render both tag bar (to show active state) and grid (to filter pins)
    tags.forEach((t) => {
      const btn = document.createElement('button');
      btn.className = 'tag-chip' + (activeTag === t ? ' active' : '');
      btn.textContent = t;
      btn.onclick = () => { activeTag = activeTag === t ? null : t; renderTagBar(); renderGrid(); };
      tagBar.appendChild(btn);
    });
  }

  // ==========================================
  // GRID & PIN CARD RENDERING
  // ==========================================
  // FUNCTION: renderGrid
  // Main rendering function that updates the pins grid
  // Called whenever filters change (search, tag, or data updates)
  // Uses DocumentFragment for efficient DOM batch insertion
  // Handles empty state messaging based on whether filters are active
  function renderGrid() {
    // Get pins filtered by current search and tag
    const filtered = getFilteredPins();
    // Clear old grid content
    grid.innerHTML = '';
    
    // Handle empty state: show helpful message based on why list is empty
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      const h2 = emptyState.querySelector('h2');
      const p = emptyState.querySelector('p');
      // Different messages for "no results" vs "empty app"
      if (searchQuery || activeTag) {
        h2.textContent = 'No matching pins';
        p.textContent = 'Try a different search or tag.';
      } else {
        h2.textContent = 'No pins yet';
        p.textContent = 'Click "Create Pin" to add your first one.';
      }
      return;
    }
    
    // Grid has content: hide empty state
    emptyState.style.display = 'none';
    // Use DocumentFragment for efficient batch insertion
    // Avoids layout thrashing (multiple reflows) when adding many elements
    const frag = document.createDocumentFragment();
    filtered.forEach((pin) => frag.appendChild(buildPinCard(pin)));
    grid.appendChild(frag);
  }

  // FUNCTION: buildPinCard
  // Creates a single pin card element with interactive elements
  // Returns a <div> with:
  //   - Image (with lazy loading and fallback for broken images)
  //   - Edit/delete buttons (visible on hover)
  //   - Title, description, tags (truncated to 3 for space)
  // Click on card opens detail modal; click on buttons triggers edit/delete
  function buildPinCard(pin) {
    // Create card element and store pin ID for event handling
    const card = document.createElement('div');
    card.className = 'pin'; card.dataset.id = pin.id;
    
    // Prepare tag display: show up to 3 tags, escaped for safety
    const tagsHTML = (pin.tags || []).slice(0, 3).map((t) => `<span class="pin-tag">${escapeHTML(t)}</span>`).join('');
    
    // Build card innerHTML with:
    // - Hidden action buttons (show on hover)
    // - Image with lazy loading and broken image placeholder
    // - Title, optional description, optional tags
    // All user content is escaped to prevent XSS
    card.innerHTML = `
      <div class="pin-actions">
        <button class="icon-btn" data-action="edit" title="Edit">✏️</button>
        <button class="icon-btn danger" data-action="delete" title="Delete">🗑️</button>
      </div>
      <img src="${escapeHTML(pin.image)}" alt="${escapeHTML(pin.title)}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/400x300?text=Image+unavailable'" />
      <div class="pin-body">
        <div class="pin-title">${escapeHTML(pin.title)}</div>
        ${pin.description ? `<div class="pin-desc">${escapeHTML(pin.description)}</div>` : ''}
        ${tagsHTML ? `<div class="pin-tags">${tagsHTML}</div>` : ''}
      </div>
    `;
    
    // Add click handler for entire card
    // Event delegation pattern: check if click was on action button
    // If on button: trigger edit/delete; if on card: show detail modal
    // stopPropagation prevents card click from firing when clicking buttons
    card.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.stopPropagation();
        if (actionBtn.dataset.action === 'edit') openFormModal(pin.id);
        if (actionBtn.dataset.action === 'delete') handleDelete(pin.id);
        return;
      }
      // No action button clicked: user clicked on card to view details
      openDetailModal(pin.id);
    });
    return card;
  }

  // ==========================================
  // TAGS INPUT MANAGEMENT
  // ==========================================
  // The tags input is special: it's a flex container that collects tag pills
  // User can type text, press Enter or comma to add a tag
  // Each tag appears as a removable pill; max 8 tags per pin
  // FUNCTION: renderPendingTags
  // Renders all pendingTags as visual pills with delete buttons
  // Called after adding/removing tags to keep UI in sync with state
  function renderPendingTags() {
    // Clear old pill elements while keeping the text input
    tagsWrap.querySelectorAll('.tag-pill').forEach((el) => el.remove());
    
    // Create a pill for each pending tag with a delete button
    pendingTags.forEach((tag) => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.innerHTML = `${escapeHTML(tag)} <button type="button" data-tag="${escapeHTML(tag)}">×</button>`;
      // Delete button removes tag from array and re-renders
      pill.querySelector('button').onclick = () => {
        pendingTags = pendingTags.filter((t) => t !== tag);
        renderPendingTags();
      };
      // Insert pill before input field (maintains input at end)
      tagsWrap.insertBefore(pill, tagsInput);
    });
  }

  // FUNCTION: addPendingTag
  // Validates and adds a tag to pendingTags array
  // Rules:
  //   - Convert to lowercase, replace spaces with hyphens
  //   - Max 24 chars per tag (visible constraint)
  //   - No duplicates (set behavior)
  //   - Max 8 tags total per pin
  // Invalid tags silently fail (no error message needed)
  function addPendingTag(raw) {
    // Normalize and validate tag input
    const tag = String(raw || '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, 24);
    // Silently skip if tag is empty, duplicate, or limit reached
    if (!tag || pendingTags.includes(tag) || pendingTags.length >= 8) return;
    // Add valid tag and update display
    pendingTags.push(tag);
    renderPendingTags();
  }

  // ==========================================
  // FORM MODAL - Create/Edit Pin
  // ==========================================
  // The form modal is used for both creating new pins and editing existing ones
  // Key concept: pendingImage and pendingTags are temporary until form is submitted
  // FUNCTION: openFormModal
  // Populates form with existing pin data (if editing) or clears it (if creating)
  // editingId tracks which pin is being edited; null = new pin
  // Shows modal and focuses on title input for better UX
  function openFormModal(id) {
    // Initialize: clear temporary state
    editingId = id || null;
    pendingTags = []; pendingImage = '';
    
    // If editing: populate form with existing pin data
    if (editingId) {
      const pin = pins.find((p) => p.id === editingId);
      if (!pin) return;
      // Update form title and button to indicate edit mode
      formTitle.textContent = 'Edit Pin';
      saveBtn.textContent = 'Update';
      // Populate fields with current pin data
      titleInput.value = pin.title;
      descInput.value = pin.description || '';
      // Don't show data URLs in image input (they're too long); show URL instead if available
      imageInput.value = pin.image.startsWith('data:') ? '' : pin.image;
      pendingImage = pin.image;
      // Clone tags for editing (don't modify original until save)
      pendingTags = (pin.tags || []).slice();
      updatePreview(pin.image);
    } else {
      // Creating new pin: set form to initial state
      formTitle.textContent = 'Create Pin';
      saveBtn.textContent = 'Save';
      pinForm.reset();
      updatePreview('');
    }
    
    // Render tags and show modal
    renderPendingTags();
    formModal.classList.add('open');
    // Auto-focus title input for faster input (setTimeout allows modal animation)
    setTimeout(() => titleInput.focus(), 50);
  }

  // FUNCTION: closeFormModal
  // Hides modal and clears temporary state
  // All unsaved changes (pendingTags, pendingImage) are discarded
  function closeFormModal() {
    // Hide modal and clear all temporary form state
    formModal.classList.remove('open');
    editingId = null; pendingTags = []; pendingImage = '';
    pinForm.reset(); updatePreview('');
  }

  // FUNCTION: updatePreview
  // Shows/hides image preview and upload controls based on whether image is selected
  // When preview is shown: hides upload zone, divider, and URL input (cleaner UI)
  // When preview is cleared: shows them again for new image selection
  function updatePreview(url) {
    // Show preview and hide upload controls
    if (url) {
      imagePreview.src = url;
      imagePreview.classList.add('show');
      uploadZone.style.display = 'none';
      orDivider.style.display = 'none';
      imageInput.style.display = 'none';
    } else {
      // Hide preview and show upload controls again
      imagePreview.classList.remove('show');
      imagePreview.removeAttribute('src');
      uploadZone.style.display = 'block';
      orDivider.style.display = 'block';
      imageInput.style.display = 'block';
    }
  }

  // FUNCTION: compressImage
  // Reads image file, resizes to max 1200px, compresses to JPEG format
  // Returns Promise that resolves to dataURL string (can be stored in localStorage)
  // Strategy: canvas-based image processing reduces large uploads (~5MB+) to ~300KB
  // This is essential for localStorage which has size limits (~5-10MB)
  // Note: PNG transparency is lost (JPEG doesn't support alpha), acceptable for pins
  // Resize/compress an image File via canvas to keep localStorage usage small.
  // Max dimension ~1200px, JPEG quality 0.82 — typically yields <300KB per pin.
  function compressImage(file, maxDim = 1200, quality = 0.82) {
    // Return Promise for async image processing
    return new Promise((resolve, reject) => {
      // Read file as dataURL (base64 string)
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.onload = (e) => {
        // Create Image object from dataURL
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image'));
        img.onload = () => {
          // Calculate new dimensions to fit within maxDim
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          // Draw resized image onto canvas
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          // Convert canvas to JPEG dataURL (smaller than PNG usually)
          // Note: Use JPEG for better compression (transparent PNGs lose alpha — acceptable for pins)
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // FUNCTION: handleFile
  // Validates uploaded image file and compresses it
  // Checks: file exists, is an image type, is under 10MB
  // Shows processing indicator and handles errors gracefully
  async function handleFile(file) {
    // Validate file type and size
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file.'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB.'); return;
    }
    // Try to compress image; show loading indicator
    try {
      uploadZone.querySelector('p').innerHTML = '⏳ Processing image...';
      const compressed = await compressImage(file);
      // Compressed image is stored as dataURL string in localStorage
      pendingImage = compressed;
      // Clear URL input since we're using file upload
      imageInput.value = '';
      updatePreview(pendingImage);
    } catch (err) {
      console.error(err);
      alert('Could not process this image. Try a different file.');
    } finally {
      // Restore upload zone text (success or failure)
      const p = uploadZone.querySelector('p');
      if (p) p.innerHTML = '📁 <strong>Click to upload</strong> or drag & drop';
    }
  }

  // FUNCTION: handleFormSubmit
  // Validates form and creates or updates pin
  // Logic:
  //   1. Validate required fields (title and image)
  //   2. Capture any pending tag text before submission
  //   3. Create new pin or update existing pin
  //   4. Save to localStorage and re-render UI
  function handleFormSubmit(e) {
    // Prevent form's default submission behavior
    e.preventDefault();
    // Gather form input values
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const urlVal = imageInput.value.trim();
    // Prefer URL input if provided, otherwise use compressed file upload
    const image = urlVal || pendingImage;
    
    // Validate required fields
    if (!title) { alert('Please add a title.'); return; }
    if (!image) { alert('Please upload an image or paste a URL.'); return; }

    // Capture any in-progress tag text in input field before submission
    if (tagsInput.value.trim()) addPendingTag(tagsInput.value);

    // Either update existing pin or create new pin
    if (editingId) {
      // Edit mode: find pin by ID and update it
      const idx = pins.findIndex((p) => p.id === editingId);
      if (idx !== -1) pins[idx] = { ...pins[idx], title, description, image, tags: pendingTags.slice() };
    } else {
      // Create mode: add new pin with generated ID and current timestamp
      pins.push({ id: generateId(), title, description, image, tags: pendingTags.slice(), createdAt: Date.now() });
    }
    // Persist to localStorage and re-render everything
    savePins(pins);
    renderTagBar(); renderGrid(); closeFormModal();
  }

  // ==========================================
  // DETAIL MODAL - Pin Preview
  // ==========================================
  // FUNCTION: openDetailModal
  // Shows full pin details in a modal overlay
  // Displays image, title, description, creation date, tags, edit/delete buttons
  function openDetailModal(id) {
    // Find pin by ID
    const pin = pins.find((p) => p.id === id);
    if (!pin) return;
    // Store ID for edit/delete buttons
    currentDetailId = id;
    // Populate detail modal with pin data
    detailImg.src = pin.image; detailImg.alt = pin.title;
    detailTitle.textContent = pin.title;
    detailDesc.textContent = pin.description || 'No description.';
    detailMeta.textContent = 'Created ' + formatDate(pin.createdAt);
    // Render tags (no truncation like in grid cards)
    detailTags.innerHTML = (pin.tags || []).map((t) => `<span class="pin-tag">${escapeHTML(t)}</span>`).join('');
    // Show modal
    detailModal.classList.add('open');
  }

  // FUNCTION: closeDetailModal
  // Hides detail modal and clears stored ID
  function closeDetailModal() {
    // Hide modal and clear state
    detailModal.classList.remove('open');
    currentDetailId = null;
  }

  // ==========================================
  // DELETE FUNCTIONALITY
  // ==========================================
  // FUNCTION: handleDelete
  // Removes pin from array, saves to storage, and updates UI
  // Includes confirmation dialog to prevent accidental deletion
  // Also handles edge cases:
  //   - Close detail modal if pin being viewed is deleted
  //   - Clear active tag filter if tag no longer exists after deletion
  function handleDelete(id) {
    // Find pin and confirm deletion with user
    const pin = pins.find((p) => p.id === id);
    if (!pin) return;
    if (!confirm(`Delete "${pin.title}"? This cannot be undone.`)) return;
    
    // Remove pin from array and save
    pins = pins.filter((p) => p.id !== id);
    savePins(pins);
    
    // Close detail modal if we're deleting the currently viewed pin
    if (currentDetailId === id) closeDetailModal();
    
    // If active tag no longer exists in remaining pins: clear filter
    // Prevents confusing empty grid with incorrect active tag button
    if (activeTag && !getAllTags().includes(activeTag)) activeTag = null;
    
    // Re-render everything with updated data
    renderTagBar(); renderGrid();
  }

  // ==========================================
  // EVENT BINDING - Wire up all interactions
  // ==========================================
  // FUNCTION: bindEvents
  // Central location for all event listener setup
  // Organized by feature: form, file upload, tags, search, detail, backdrops
  // Called once during init() to activate the app
  function bindEvents() {
    // ---- Form Modal Controls ----
    // Create button opens form for new pin (no ID)
    createBtn.addEventListener('click', () => openFormModal(null));
    // Cancel button closes form without saving
    cancelBtn.addEventListener('click', closeFormModal);
    // Form submit is handled by handleFormSubmit
    pinForm.addEventListener('submit', handleFormSubmit);

    // ---- Image Input (URL) ----
    // When user pastes image URL: clear pending file and show preview
    // Note: this clears pendingImage so URL is used over file (if both provided)
    imageInput.addEventListener('input', (e) => {
      pendingImage = ''; updatePreview(e.target.value);
    });

    // ---- File Upload Events ----
    // Click upload zone to trigger hidden file input
    uploadZone.addEventListener('click', () => fileInput.click());
    // File input change: process selected file
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    });
    // Drag enter/over: show visual feedback
    ['dragenter', 'dragover'].forEach((ev) =>
      uploadZone.addEventListener(ev, (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); })
    );
    // Drag leave/drop: hide visual feedback and handle drop
    ['dragleave', 'drop'].forEach((ev) =>
      uploadZone.addEventListener(ev, (e) => { e.preventDefault(); uploadZone.classList.remove('dragover'); })
    );
    // Drop: extract file from drag data and process
    uploadZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // ---- Tags Input Events ----
    // Enter or comma key: add tag
    // Backspace with empty input: delete last tag (convenience)
    tagsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addPendingTag(tagsInput.value);
        tagsInput.value = '';
      } else if (e.key === 'Backspace' && !tagsInput.value && pendingTags.length) {
        pendingTags.pop(); renderPendingTags();
      }
    });
    // Click on tag container to focus input (better UX)
    tagsWrap.addEventListener('click', (e) => {
      if (e.target === tagsWrap) tagsInput.focus();
    });

    // ---- Search Input ----
    // Real-time search: filter grid as user types
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value; renderGrid();
    });

    // ---- Detail Modal Controls ----
    // Close button
    detailClose.addEventListener('click', closeDetailModal);
    // Edit button: close detail, open form for editing
    detailEdit.addEventListener('click', () => {
      const id = currentDetailId; closeDetailModal();
      if (id) openFormModal(id);
    });
    // Delete button: remove pin
    detailDelete.addEventListener('click', () => {
      if (currentDetailId) handleDelete(currentDetailId);
    });

    // ---- Backdrop Click to Close ----
    // Click outside modal content (on semi-transparent backdrop) to close
    // Checking if event.target === backdrop (not a child element)
    formModal.addEventListener('click', (e) => { if (e.target === formModal) closeFormModal(); });
    detailModal.addEventListener('click', (e) => { if (e.target === detailModal) closeDetailModal(); });

    // ---- Escape Key to Close ----
    // Press Escape to close currently open modal
    // Priority: form first, then detail (only one open at a time)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (formModal.classList.contains('open')) closeFormModal();
      else if (detailModal.classList.contains('open')) closeDetailModal();
    });
  }

  // ==========================================
  // INITIALIZATION - App Startup
  // ==========================================
  // FUNCTION: init
  // Main entry point called when DOM is ready
  // Steps:
  //   1. Inject CSS styles into <head>
  //   2. Cache all DOM element references
  //   3. Load pins from localStorage (or seed data)
  //   4. Bind all event listeners
  //   5. Render tag bar and grid (initial view)
  function init() {
    // Inject all CSS styles into document head
    // This approach keeps styles with JavaScript logic and avoids external CSS files
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    // Cache DOM elements for fast repeated access throughout app
    cacheDOM();
    // Load pins from localStorage or initialize with seed data
    pins = loadPins();
    // Attach event listeners to all interactive elements
    bindEvents();
    // Render initial UI state (tag bar and pin grid)
    renderTagBar();
    renderGrid();
  }

  // ==========================================
  // APP ENTRY POINT
  // ==========================================
  // Check DOM readiness before initializing
  // If DOM is still loading: wait for DOMContentLoaded event
  // If DOM is already loaded: initialize immediately (current document state is 'complete' or 'interactive')
  // This ensures HTML elements are present before we try to cache and manipulate them
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
