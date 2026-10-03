/**
 * Dashboard Kemandirian Fiskal Daerah Indonesia – APBD 2024 vs 2025
 * Modul: Data Loading, Filter System, 4 ECharts Visualizations + Interactivity
 */

// ═══════════════════════════════════════════════════════════════
// 1. GLOBAL STATE
// ═══════════════════════════════════════════════════════════════
const State = {
  raw: [],              // Data asli 508 record dari JSON
  filtered: [],         // Data setelah semua filter diterapkan
  geoJson: null,
  palette: 'viridis',
  mapMetric: 'kemandirian_2024_persen',
  mapMode: 'continuous',  // 'continuous' | 'cluster' | 'bubble' | 'overlay'
  pcaMode: 'scatter',     // 'scatter' | 'biplot' | 'radar' | 'parallel' | 'heatmap'
  treeMode: 'treemap',    // 'treemap' | 'sunburst'
  centroids: {},          // key -> [lon, lat]
  brushedKeys: new Set(),
  selectedRegion: null,  // Object data daerah yang diklik
  shiftScope: 'NATIONAL',
  filters: {
    type: 'Semua',       // Semua | Kabupaten | Kota
    provinsi: 'ALL',
    clusters: 'ALL',     // 'ALL' | Set of cluster numbers
    kemMin: 0,
    kemMax: 100,
    kategori: 'ALL'
  },
  charts: { map: null, scatter: null, treemap: null, shift: null }
};

// ═══════════════════════════════════════════════════════════════
// 2. PALETTE SYSTEM (Colorblind-Safe)
// ═══════════════════════════════════════════════════════════════
const Palettes = {
  viridis: {
    seq: ['#440154','#482878','#3e4989','#31688e','#26828e','#1f9e89','#35b779','#6ece58','#b5de2b','#fde725'],
    cluster: { 0: '#0077BB', 1: '#EE7733', 2: '#AA3377', 3: '#009988' },
    bar24: '#0077BB', bar25: '#009988'
  },
  cividis: {
    seq: ['#00204d','#00336e','#264c77','#4b6787','#72809a','#9b9c9e','#c6a96c','#e9c634','#f5e218','#fdea45'],
    cluster: { 0: '#0077BB', 1: '#EE7733', 2: '#AA3377', 3: '#009988' },
    bar24: '#4b6487', bar25: '#e0d54f'
  },
  tealamber: {
    seq: ['#004d40','#00695c','#00897b','#26a69a','#4db6ac','#80cbc4','#ffe082','#ffca28','#ffa000','#e65100'],
    cluster: { 0: '#0077BB', 1: '#EE7733', 2: '#AA3377', 3: '#009988' },
    bar24: '#00897b', bar25: '#f9a825'
  },
  terracotta: {
    seq: ['#F7ECE1','#E8C5A5','#D6946A','#C85A32','#A33C1E','#7B241C'],
    cluster: { 0: '#0077BB', 1: '#EE7733', 2: '#AA3377', 3: '#009988' },
    bar24: '#C85A32', bar25: '#0077BB'
  }
};

function isWarmTheme() {
  return document.documentElement.getAttribute('data-theme') === 'warm-sand';
}

function getThemeColors() {
  const warm = isWarmTheme();
  return {
    isWarm: warm,
    tooltipBg: warm ? '#FFFFFF' : '#0d1117',
    tooltipBorder: warm ? 'rgba(56,46,38,0.15)' : 'rgba(255,255,255,0.1)',
    tooltipText: warm ? '#1C1917' : '#e8e6e1',
    tooltipBoxBg: warm ? '#F5F0E8' : '#161b27',
    tooltipShadow: warm ? '0 12px 28px rgba(56,46,38,0.12)' : '0 20px 40px rgba(0,0,0,0.6)',
    axisLabel: warm ? '#57534E' : '#9ca3af',
    axisLine: warm ? '#DDD6CA' : '#1e2637',
    splitLine: warm ? '#E7E0D3' : '#161b27',
    titleText: warm ? '#1C1917' : '#6b7280',
    legendText: warm ? '#44403C' : '#6b7280',
    mapAreaFill: warm ? '#E7DFD4' : '#1e2637',
    mapAreaEmpty: warm ? '#DED5C8' : '#121722',
    mapBorder: warm ? 'rgba(56,46,38,0.22)' : 'rgba(255,255,255,0.18)',
    vmBg: warm ? 'rgba(255,255,255,0.92)' : 'rgba(10,13,20,0.85)',
    vmBorder: warm ? 'rgba(56,46,38,0.15)' : 'rgba(255,255,255,0.08)',
    vmText: warm ? '#57534E' : '#6b7280'
  };
}

function setTheme(themeName) {
  const warm = (themeName === 'warm-sand');
  if (warm) {
    document.documentElement.setAttribute('data-theme', 'warm-sand');
    localStorage.setItem('fiskal_theme', 'warm-sand');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('fiskal_theme', 'dark');
  }

  // Update topbar button text & icon
  const btnLabel = id('theme-btn-label');
  if (btnLabel) btnLabel.textContent = warm ? 'Mode Gelap' : 'Tema Terang';
  const iconDark = id('theme-icon-dark');
  const iconLight = id('theme-icon-light');
  if (iconDark && iconLight) {
    if (warm) {
      iconDark.classList.add('hidden');
      iconLight.classList.remove('hidden');
    } else {
      iconDark.classList.remove('hidden');
      iconLight.classList.add('hidden');
    }
  }

  // Update sidebar option cards
  const optDark = id('theme-opt-dark');
  const optWarm = id('theme-opt-warm');
  if (optDark && optWarm) {
    if (warm) {
      optDark.style.border = '1px solid var(--border)';
      optDark.style.background = 'var(--bg-elevated)';
      optDark.style.color = 'var(--text-muted)';
      const dTag = optDark.querySelector('span.font-mono');
      if (dTag) { dTag.textContent = 'OLED'; dTag.classList.add('opacity-60'); dTag.style.color = ''; }

      optWarm.style.border = '1px solid var(--accent)';
      optWarm.style.background = 'var(--accent-dim)';
      optWarm.style.color = 'var(--text-primary)';
      const wTag = optWarm.querySelector('span.font-mono');
      if (wTag) { wTag.textContent = 'Aktif'; wTag.classList.remove('opacity-60'); wTag.style.color = 'var(--accent)'; }
    } else {
      optDark.style.border = '1px solid var(--accent)';
      optDark.style.background = 'var(--accent-dim)';
      optDark.style.color = 'var(--text-primary)';
      const dTag = optDark.querySelector('span.font-mono');
      if (dTag) { dTag.textContent = 'Aktif'; dTag.classList.remove('opacity-60'); dTag.style.color = 'var(--accent)'; }

      optWarm.style.border = '1px solid var(--border)';
      optWarm.style.background = 'var(--bg-elevated)';
      optWarm.style.color = 'var(--text-muted)';
      const wTag = optWarm.querySelector('span.font-mono');
      if (wTag) { wTag.textContent = 'Aksesibel'; wTag.classList.add('opacity-60'); wTag.style.color = ''; }
    }
  }

  // Re-render all charts
  if (State.raw && State.raw.length) {
    renderMap();
    renderScatter();
    renderTreemap();
    renderShift();
  }
}

function getPalette() { return Palettes[State.palette] || Palettes.viridis; }

function colorInterpolate(value, min, max) {
  const pal = getPalette().seq;
  if (value === null || value === undefined || isNaN(value)) return '#334155';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const idx = t * (pal.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx), f = idx - lo;
  if (lo === hi) return pal[lo];
  const [r1, g1, b1] = hexRgb(pal[lo]);
  const [r2, g2, b2] = hexRgb(pal[hi]);
  return `rgb(${Math.round(r1+(r2-r1)*f)},${Math.round(g1+(g2-g1)*f)},${Math.round(b1+(b2-b1)*f)})`;
}
function hexRgb(hex) {
  hex = hex.replace('#','');
  if (hex.length === 3) hex = hex.split('').map(x=>x+x).join('');
  const n = parseInt(hex,16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return a / 2;
}

function ringCentroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-12) {
    const n = ring.length || 1;
    return [ring.reduce((s, p) => s + p[0], 0) / n, ring.reduce((s, p) => s + p[1], 0) / n];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function featureCentroid(feat) {
  const g = feat.geometry;
  if (!g) return null;
  if (g.type === 'Polygon') return ringCentroid(g.coordinates[0]);
  if (g.type === 'MultiPolygon') {
    let best = null, bestA = -1;
    for (const poly of g.coordinates) {
      const ring = poly[0];
      const a = Math.abs(ringArea(ring));
      if (a > bestA) { bestA = a; best = ringCentroid(ring); }
    }
    return best;
  }
  return null;
}

function buildCentroids(geo) {
  const out = {};
  geo.features.forEach(f => {
    const key = f.properties.key;
    const c = featureCentroid(f);
    if (key && c) out[key] = c;
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════
// 3. METRIC CONFIG
// ═══════════════════════════════════════════════════════════════
const MetricCfg = {
  kemandirian_2024_persen:   { label:'Kemandirian Fiskal 2024', unit:'%',   min:0,        max:85,        fmt: v=>fmtID(v,2)+'%' },
  pdrb_per_kapita_rupiah:    { label:'PDRB per Kapita',          unit:'Rp',  min:15e6,     max:120e6,     fmt: fmtRp },
  ipm_2024:                  { label:'IPM 2024',                  unit:'',    min:55,       max:88,        fmt: v=>fmtID(v,2) },
  persen_miskin_p0_2024:     { label:'Kemiskinan P0 (%)',         unit:'%',   min:2,        max:35,        fmt: v=>fmtID(v,2)+'%' },
  belanja_modal_2024_persen: { label:'Belanja Modal 2024',        unit:'%',   min:4,        max:36,        fmt: v=>fmtID(v,2)+'%' }
};

function fmtNum(n) { if(n==null||isNaN(n))return'-'; return Math.round(n).toLocaleString('id-ID'); }
function fmtID(n, dec = 2) {
  if (n == null || isNaN(n)) return '-';
  return (+n).toFixed(dec).replace('.', ',');
}
function fmtCompactRp(n) {
  if (n == null || isNaN(n)) return '-';
  if (n >= 1e9)  return 'Rp ' + fmtID(n / 1e9,  n >= 1e10 ? 0 : 1) + ' M';
  if (n >= 1e6)  return 'Rp ' + fmtID(n / 1e6,  n >= 1e7 ? 0 : 1) + ' jt';
  if (n >= 1e3)  return 'Rp ' + fmtID(n / 1e3, 0) + ' rb';
  return 'Rp ' + Math.round(n);
}
function fmtRp(n) {
  if(n==null||isNaN(n))return'-';
  if(n>=1e9) return 'Rp '+fmtID(n/1e9,2)+' M';
  if(n>=1e6) return 'Rp '+fmtID(n/1e6,1)+' jt';
  return 'Rp '+Math.round(n).toLocaleString('id-ID');
}

const ClusterMeta = {
  0:{ name:'K0: Metropolitan Mandiri',   short:'Metropolitan',   color:'#0077BB', bg:'rgba(0,119,187,0.1)',  border:'border-[#0077BB]' },
  1:{ name:'K1: Tertinggal & Bergantung',short:'Tertinggal',     color:'#EE7733', bg:'rgba(238,119,51,0.1)', border:'border-[#EE7733]' },
  2:{ name:'K2: Berkembang / Transisi',  short:'Berkembang',     color:'#AA3377', bg:'rgba(170,51,119,0.1)', border:'border-[#AA3377]' },
  3:{ name:'K3: Akselerasi Belanja Modal',short:'Akselerasi Modal',color:'#009988',bg:'rgba(0,153,136,0.1)',border:'border-[#009988]' },
};

const MULTI_VARS = [
  { key: 'kemandirian_2024_persen', label: 'Kemandirian' },
  { key: 'derajat_desentralisasi_2024_persen', label: 'Desentralisasi' },
  { key: 'rasio_pajak_2024_persen', label: 'Rasio Pajak' },
  { key: 'rasio_efektivitas_pad_2024_persen', label: 'Efektivitas PAD' },
  { key: 'belanja_operasi_2024_persen', label: 'Blj Operasi' },
  { key: 'belanja_modal_2024_persen', label: 'Blj Modal' },
  { key: 'ipm_2024', label: 'IPM' },
  { key: 'persen_miskin_p0_2024', label: 'P0 Miskin' },
  { key: 'pdrb_per_kapita_rupiah', label: 'PDRB/kapita' }
];

function pearson(a, b) {
  const n = a.length;
  if (!n) return 0;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, yb = b[i] - mb;
    num += xa * yb; da += xa * xa; db += yb * yb;
  }
  const den = Math.sqrt(da * db);
  return den ? num / den : 0;
}

function meanStd(vals) {
  const n = vals.length;
  if (!n) return { m: 0, sd: 1 };
  const m = vals.reduce((s, x) => s + x, 0) / n;
  const sd = Math.sqrt(vals.reduce((s, x) => s + (x - m) ** 2, 0) / n) || 1;
  return { m, sd };
}

// ═══════════════════════════════════════════════════════════════
// 4. BOOT / DATA LOADING
// ═══════════════════════════════════════════════════════════════
async function boot() {
  const bar = id('loading-bar');
  const msg = id('loading-msg');

  try {
    bar.style.width = '15%';
    msg.textContent = 'Memuat dataset master APBD (508 kab/kota)…';
    const [masterRes, geoRes] = await Promise.all([
      fetch('kabkota_master_final.json'),
      fetch('kabkota_simplified.geojson')
    ]);
    bar.style.width = '55%';
    msg.textContent = 'Parsing GeoJSON peta Indonesia…';
    const [master, geo] = await Promise.all([masterRes.json(), geoRes.json()]);

    // Normalize GeoJSON feature names
    geo.features.forEach(f => {
      f.properties.name = f.properties.key;
      f.properties.displayName = f.properties.KAB_KOTA || f.properties.key;
    });

    echarts.registerMap('indonesia', geo);
    State.raw = master;
    State.geoJson = geo;
    State.centroids = buildCentroids(geo);
    State.filtered = [...master];

    // 7 daerah punya kemandirian >100% (maks 674,98% Badung); plafon filter harus menampung seluruh rentang data
    const kemCeil = Math.ceil(Math.max(...master.map(d => d.kemandirian_2024_persen || 0)) / 50) * 50;
    State.kemCeil = kemCeil;
    State.filters.kemMax = kemCeil;
    id('kem-min').max = kemCeil;
    id('kem-max').max = kemCeil;
    id('kem-max').value = kemCeil;
    setTxt('kem-range-display', `0 – ${kemCeil}%`);

    bar.style.width = '80%';
    msg.textContent = 'Merender visualisasi…';

    populateProvinceDropdown();
    updateKPIs();
    renderAll();
    setupEventListeners();
    setupNavDots();

    bar.style.width = '100%';
    await delay(300);
    const screen = id('loading-screen');
    screen.style.opacity = '0';
    screen.style.transition = 'opacity 0.4s';
    await delay(400);
    screen.remove();

  } catch(err) {
    msg.textContent = '⚠ Gagal memuat: ' + err.message;
    msg.style.color = '#f87171';
    console.error(err);
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function id(x) { return document.getElementById(x); }

// ═══════════════════════════════════════════════════════════════
// 5. FILTER ENGINE
// ═══════════════════════════════════════════════════════════════
function applyFilters() {
  const f = State.filters;
  State.filtered = State.raw.filter(d => {
    if (f.type !== 'Semua' && d.jenis !== f.type) return false;
    if (f.provinsi !== 'ALL' && d.provinsi !== f.provinsi) return false;
    if (f.clusters !== 'ALL' && !f.clusters.has(d.cluster)) return false;
    const kem = d.kemandirian_2024_persen || 0;
    if (kem < f.kemMin || kem > f.kemMax) return false;
    if (f.kategori !== 'ALL' && d.kategori_desentralisasi_2024 !== f.kategori) return false;
    return true;
  });

  updateFilterBadge();
  updateSidebarStats();
  updateKPIs();
  renderAll();
}

function updateFilterBadge() {
  const f = State.filters;
  let active = 0;
  if (f.type !== 'Semua') active++;
  if (f.provinsi !== 'ALL') active++;
  if (f.clusters !== 'ALL') active++;
  if (f.kemMin > 0 || f.kemMax < State.kemCeil) active++;
  if (f.kategori !== 'ALL') active++;

  const badge = id('filter-count-badge');
  const indicator = id('filter-active-indicator');
  const activeBadge = id('filter-active-badge');

  if (active > 0) {
    badge.textContent = active;
    badge.classList.remove('hidden');
    badge.classList.add('flex');
    indicator.classList.remove('hidden');
    activeBadge.classList.remove('hidden');
    activeBadge.classList.add('flex');
  } else {
    badge.classList.add('hidden');
    badge.classList.remove('flex');
    indicator.classList.add('hidden');
    activeBadge.classList.add('hidden');
    activeBadge.classList.remove('flex');
  }
}

function updateSidebarStats() {
  const provs = new Set(State.filtered.map(d => d.provinsi));
  const sac = id('sidebar-active-count');
  const spc = id('sidebar-prov-count');
  if (sac) sac.textContent = `${State.filtered.length} / ${State.raw.length}`;
  if (spc) spc.textContent = provs.size;
}

function resetAllFilters() {
  State.filters = { type:'Semua', provinsi:'ALL', clusters:'ALL', kemMin:0, kemMax:State.kemCeil, kategori:'ALL' };
  State.brushedKeys.clear();
  State.selectedRegion = null;
  State.shiftScope = 'NATIONAL';

  // Reset UI
  id('filter-provinsi').value = 'ALL';
  id('filter-kategori').value = 'ALL';
  id('kem-min').value = 0;
  id('kem-max').value = State.kemCeil;
  id('kem-range-display').textContent = `0 – ${State.kemCeil}%`;

  document.querySelectorAll('.filter-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filterType === 'Semua');
  });
  document.querySelectorAll('.cluster-filter-check').forEach(cb => {
    cb.checked = cb.dataset.cluster === 'ALL';
  });
  document.querySelectorAll('.scope-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.scope === 'NATIONAL');
  });
  id('selected-region-btn-wrap').classList.add('hidden');
  id('brush-bar').classList.add('hidden');

  applyFilters();
}

function populateProvinceDropdown() {
  const sel = id('filter-provinsi');
  const provs = [...new Set(State.raw.map(d => d.provinsi))].sort();
  provs.forEach(p => {
    const o = document.createElement('option');
    o.value = p; o.textContent = p;
    sel.appendChild(o);
  });
}

// ═══════════════════════════════════════════════════════════════
// 6. KPI CARDS
// ═══════════════════════════════════════════════════════════════
function updateKPIs() {
  const d = State.filtered;
  const n = d.length;
  const pop = d.reduce((s,x)=>s+(x.penduduk_2024||0),0);
  const kemVals = d.map(x => x.kemandirian_2024_persen).filter(v => v != null && !isNaN(v));
  const ipmVals = d.map(x => x.ipm_2024).filter(v => v != null && !isNaN(v));
  const avgKem = kemVals.length ? kemVals.reduce((s,x)=>s+x,0)/kemVals.length : 0;
  const avgIpm = ipmVals.length ? ipmVals.reduce((s,x)=>s+x,0)/ipmVals.length : 0;

  setTxt('kpi-regions', n);
  setTxt('kpi-kemandirian', fmtID(avgKem,2)+'%');
  setTxt('kpi-ipm', fmtID(avgIpm,2));
  setTxt('kpi-pop', fmtID(pop/1e6,1)+' juta');
}
function setTxt(elId, txt) { const el=id(elId); if(el) el.textContent=txt; }

// ═══════════════════════════════════════════════════════════════
// 7. RENDER ALL
// ═══════════════════════════════════════════════════════════════
function renderAll() {
  renderMap();
  renderScatter();
  renderTreemap();
  renderShift();
}

// ─────────────────────────────────────────────
// 7a. MAP CHART
// ─────────────────────────────────────────────
function symbolSizeFromPop(pop) {
  return Math.max(5, Math.min(32, Math.sqrt((pop || 100000) / 8000)));
}

function mapChoroplethData() {
  const pal = getPalette();
  const isCluster = State.mapMode === 'cluster';
  const hasBrush = State.brushedKeys.size > 0;
  const filteredKeys = new Set(State.filtered.map(d => d.key));

  const mapData = State.filtered.map(d => {
    const v = d[State.mapMetric] || 0;
    const inBrush = !hasBrush || State.brushedKeys.has(d.key);
    const clusterColor = d.cluster !== null ? pal.cluster[d.cluster] : '#475569';
    return {
      name: d.key,
      value: v,
      raw: d,
      itemStyle: {
        opacity: inBrush ? 0.92 : 0.12,
        color: isCluster ? clusterColor : undefined
      }
    };
  });

  const greyData = State.raw
    .filter(d => !filteredKeys.has(d.key))
    .map(d => ({
      name: d.key, value: 0, raw: d,
      itemStyle: { color: '#1e2637', opacity: 0.45 }
    }));

  return [...mapData, ...greyData];
}

function mapScatterData() {
  const pal = getPalette();
  const cfg = MetricCfg[State.mapMetric];
  const hasBrush = State.brushedKeys.size > 0;
  const filteredKeys = new Set(State.filtered.map(d => d.key));
  const colorByCluster = State.mapMode === 'cluster';

  return State.raw.map(d => {
    const c = State.centroids[d.key];
    if (!c) return null;
    const inFilter = filteredKeys.has(d.key);
    const inBrush = !hasBrush || State.brushedKeys.has(d.key);
    const v = d[State.mapMetric];
    const fill = colorByCluster
      ? (d.cluster !== null ? pal.cluster[d.cluster] : '#475569')
      : colorInterpolate(v, cfg.min, cfg.max);
    return {
      name: d.nama_asli,
      value: [c[0], c[1], v || 0, d.penduduk_2024 || 0],
      raw: d,
      symbolSize: symbolSizeFromPop(d.penduduk_2024),
      itemStyle: {
        color: fill,
        opacity: inFilter && inBrush ? 0.88 : 0.12,
        borderColor: 'rgba(15,17,23,0.8)',
        borderWidth: 0.6
      }
    };
  }).filter(Boolean);
}

function renderMap() {
  const container = id('map-chart');
  if (!State.charts.map) {
    State.charts.map = echarts.init(container, null, { renderer: 'canvas' });
    State.charts.map.on('click', p => { if (p.data?.raw) onRegionClick(p.data.raw); });
    State.charts.map.on('mouseover', p => { if (p.data?.raw) updateSpotlight(p.data.raw); });
  }

  const pal = getPalette();
  const tc = getThemeColors();
  const cfg = MetricCfg[State.mapMetric];
  const mode = State.mapMode;
  const showFill = mode === 'continuous' || mode === 'cluster' || mode === 'overlay';
  const showBubbles = mode === 'bubble' || mode === 'overlay';
  const isCluster = mode === 'cluster';

  const vmTxt = v => (cfg.unit === 'Rp') ? fmtCompactRp(v) : fmtID(v, 0) + cfg.unit;
  const vm = (isCluster && !showBubbles) ? { show: false } : {
    show: !isCluster,
    type: 'continuous',
    min: cfg.min, max: cfg.max,
    text: [vmTxt(cfg.max), vmTxt(cfg.min)],
    textStyle: { color: tc.vmText, fontSize: 10 },
    inRange: { color: pal.seq },
    calculable: false,
    orient: 'horizontal',
    left: 'center', bottom: 15,
    itemWidth: 12, itemHeight: 160,
    backgroundColor: tc.vmBg,
    borderColor: tc.vmBorder, borderWidth: 1,
    seriesIndex: (showBubbles && !showFill) ? 1 : 0
  };

  const tooltip = {
    trigger: 'item',
    formatter: mapTooltipFmt,
    backgroundColor: tc.tooltipBg,
    borderColor: tc.tooltipBorder,
    textStyle: { color: tc.tooltipText, fontFamily: 'Inter', fontSize: 12 },
    extraCssText: `border-radius:10px;padding:12px 14px;box-shadow:${tc.tooltipShadow};`
  };

  const geoCommon = {
    map: 'indonesia',
    roam: true,
    scaleLimit: { min: 0.9, max: 20 },
    zoom: 1.2,
    center: [118, -2.5],
    label: { show: false },
    itemStyle: {
      borderColor: tc.mapBorder,
      borderWidth: 0.6,
      areaColor: showFill ? tc.mapAreaFill : tc.mapAreaEmpty
    },
    emphasis: {
      label: { show: true, color: tc.tooltipText, fontSize: 10 },
      itemStyle: { areaColor: tc.isWarm ? '#C85A32' : '#F59E0B', borderColor: '#fff', borderWidth: 1.5 }
    }
  };

  const series = [];

  if (showFill) {
    series.push({
      id: 'map-main',
      type: 'map',
      map: 'indonesia',
      geoIndex: 0,
      data: mapChoroplethData(),
      tooltip: { show: !showBubbles || mode !== 'overlay' }
    });
  } else {
    series.push({
      id: 'map-main',
      type: 'map',
      map: 'indonesia',
      geoIndex: 0,
      data: [],
      silent: true,
      itemStyle: { areaColor: tc.mapAreaEmpty, borderColor: tc.mapBorder, borderWidth: 0.5 },
      emphasis: { disabled: true }
    });
  }

  if (showBubbles) {
    series.push({
      id: 'map-bubbles',
      type: 'scatter',
      coordinateSystem: 'geo',
      geoIndex: 0,
      data: mapScatterData(),
      zlevel: 2,
      emphasis: {
        scale: 1.25,
        itemStyle: { borderColor: '#fff', borderWidth: 1.5 }
      }
    });
  }

  State.charts.map.setOption({
    backgroundColor: 'transparent',
    tooltip,
    visualMap: vm,
    geo: geoCommon,
    series
  }, true);
}

function mapTooltipFmt(p) {
  const tc = getThemeColors();
  if (!p.data?.raw) return `<div style="padding:4px"><b style="color:${tc.tooltipText}">${p.name}</b><br><small style="color:${tc.axisLabel}">Tidak dalam filter aktif</small></div>`;
  const d = p.data.raw;
  const cm = ClusterMeta[d.cluster] || { name: 'Data Parsial', color:'#9ca3af' };
  const cfg = MetricCfg[State.mapMetric];
  return `
    <div style="min-width:220px;line-height:1.5">
      <div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${cm.color};margin-bottom:2px">${d.jenis||'Daerah'}</div>
      <div style="font-size:14px;font-weight:800;color:${tc.tooltipText}">${d.nama_asli}</div>
      <div style="font-size:11px;color:${tc.axisLabel};margin-bottom:8px">${d.provinsi}</div>
      <div style="border-top:1px solid ${tc.splitLine};padding-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div style="background:${tc.tooltipBoxBg};border-radius:8px;padding:6px 8px">
          <div style="font-size:10px;color:${tc.axisLabel}">${cfg.label}</div>
          <div style="font-size:13px;font-weight:700;color:var(--accent);font-family:monospace">${cfg.fmt(d[State.mapMetric])}</div>
        </div>
        <div style="background:${tc.tooltipBoxBg};border-radius:8px;padding:6px 8px">
          <div style="font-size:10px;color:${tc.axisLabel}">Klaster</div>
          <div style="font-size:11px;font-weight:700;color:${cm.color}">${cm.short}</div>
        </div>
        <div style="background:${tc.tooltipBoxBg};border-radius:8px;padding:6px 8px">
          <div style="font-size:10px;color:${tc.axisLabel}">IPM 2024</div>
          <div style="font-size:13px;font-weight:700;color:#0077BB;font-family:monospace">${d.ipm_2024||'-'}</div>
        </div>
        <div style="background:${tc.tooltipBoxBg};border-radius:8px;padding:6px 8px">
          <div style="font-size:10px;color:${tc.axisLabel}">Kemiskinan P0</div>
          <div style="font-size:13px;font-weight:700;color:#EE7733;font-family:monospace">${d.persen_miskin_p0_2024||0}%</div>
        </div>
      </div>
      <div style="font-size:10px;color:${tc.axisLabel};margin-top:8px;text-align:center">Klik daerah → analisis anggaran diperbarui ↓ · Sumber: BPS</div>
    </div>
  `;
}

function updateSpotlight(d) {
  setTxt('sp-type', d.jenis || '');
  setTxt('sp-name', d.nama_asli);
  setTxt('sp-prov', d.provinsi);
  setTxt('sp-kem', d.kemandirian_2024_persen !== null ? d.kemandirian_2024_persen+'%' : '–');
  setTxt('sp-ipm', d.ipm_2024 || '–');
}

// ─────────────────────────────────────────────
// 7b. SCATTER CHART (PCA + Brush)
// ─────────────────────────────────────────────
function renderScatter() {
  const container = id('scatter-chart');
  if (!State.charts.scatter) {
    State.charts.scatter = echarts.init(container, null, { renderer: 'canvas' });
    State.charts.scatter.on('brushSelected', handleBrushSelected);
    State.charts.scatter.on('click', p => { if(p.data?.raw) onRegionClick(p.data.raw); });
  }

  const pal = getPalette();
  const tc = getThemeColors();
  const filteredKeys = new Set(State.filtered.map(d => d.key));
  const validAll = State.raw.filter(d => d.pca_x !== null && d.pca_y !== null && d.cluster !== null);
  const hint = id('pca-hint');
  if (hint) {
    hint.style.display = (State.pcaMode === 'scatter' || State.pcaMode === 'biplot') ? 'block' : 'none';
  }

  // HEATMAP TERKLASTER (z-score rata-rata 9 variabel × 4 klaster)
  if (State.pcaMode === 'heatmap') {
    const pool = State.filtered.filter(d => d.cluster !== null);
    const overall = {};
    MULTI_VARS.forEach(v => {
      overall[v.key] = meanStd(pool.map(d => d[v.key]).filter(x => x != null && !isNaN(x)));
    });
    const heat = [];
    [0, 1, 2, 3].forEach((cId, yi) => {
      const items = pool.filter(d => d.cluster === cId);
      MULTI_VARS.forEach((v, xi) => {
        const vals = items.map(d => d[v.key]).filter(x => x != null && !isNaN(x));
        const m = vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0;
        const z = (m - overall[v.key].m) / overall[v.key].sd;
        heat.push([xi, yi, +z.toFixed(2)]);
      });
    });
    State.charts.scatter.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        formatter: p => {
          const v = MULTI_VARS[p.data[0]];
          const c = ClusterMeta[p.data[1]];
          return `<div style="padding:4px"><b>${c.short}</b> · ${v.label}<br>z-score: <b style="color:var(--accent)">${p.data[2]}</b></div>`;
        },
        backgroundColor: tc.tooltipBg, borderColor: tc.tooltipBorder,
        textStyle: { color: tc.tooltipText, fontFamily: 'Inter', fontSize: 12 }
      },
      grid: { left: '18%', right: '12%', top: '12%', bottom: '22%' },
      xAxis: {
        type: 'category',
        data: MULTI_VARS.map(v => v.label),
        axisLabel: { color: tc.axisLabel, fontSize: 10, rotate: 35 },
        axisLine: { lineStyle: { color: tc.axisLine } }
      },
      yAxis: {
        type: 'category',
        data: [0, 1, 2, 3].map(i => ClusterMeta[i].short),
        axisLabel: { color: tc.tooltipText, fontSize: 11 },
        axisLine: { lineStyle: { color: tc.axisLine } }
      },
      visualMap: {
        min: -2, max: 2,
        calculable: true,
        orient: 'vertical',
        right: 8, top: 'center',
        text: ['Tinggi', 'Rendah'],
        textStyle: { color: tc.axisLabel, fontSize: 10 },
        inRange: { color: ['#0077BB', tc.isWarm ? '#E8DFD0' : '#1e2637', '#EE7733'] }
      },
      series: [{
        type: 'heatmap',
        data: heat,
        label: { show: true, color: tc.tooltipText, fontSize: 11, fontFamily: 'JetBrains Mono' },
        itemStyle: { borderColor: tc.isWarm ? '#EAE3D6' : '#0f1117', borderWidth: 2 }
      }]
    }, true);
    return;
  }

  // RADAR MODE
  if (State.pcaMode === 'radar') {
    const indicators = [
      { name: 'Kemandirian (%)', max: 80 },
      { name: 'Derajat Desent. (%)', max: 70 },
      { name: 'Blj Modal (%)', max: 40 },
      { name: 'IPM (0-100)', max: 90 },
      { name: 'Kemiskinan P0 (%)', max: 30 },
      { name: 'Rasio Pajak (%)', max: 40 }
    ];

    const radarData = [0,1,2,3].map(cId => {
      const items = State.filtered.filter(d => d.cluster === cId && d.kemandirian_2024_persen != null);
      const avg = k => items.length ? +(items.reduce((s,d)=>s+(d[k]||0),0)/items.length).toFixed(2) : 0;
      return {
        name: ClusterMeta[cId].short,
        value: [
          avg('kemandirian_2024_persen'),
          avg('derajat_desentralisasi_2024_persen'),
          avg('belanja_modal_2024_persen'),
          avg('ipm_2024'),
          avg('persen_miskin_p0_2024'),
          avg('rasio_pajak_2024_persen')
        ],
        itemStyle: { color: pal.cluster[cId] },
        areaStyle: { color: pal.cluster[cId], opacity: 0.25 }
      };
    });

    State.charts.scatter.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: tc.tooltipBg, borderColor: tc.tooltipBorder, textStyle: { color: tc.tooltipText, fontFamily:'Inter' } },
      legend: { top: 6, textStyle: { color: tc.legendText, fontSize: 11 }, icon: 'circle', itemGap: 16 },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: tc.axisLabel, fontSize: 11, fontFamily: 'Inter' },
        splitLine: { lineStyle: { color: tc.splitLine } },
        splitArea: { areaStyle: { color: ['transparent', tc.isWarm ? 'rgba(56,46,38,0.03)' : 'rgba(255,255,255,0.02)'] } },
        axisLine: { lineStyle: { color: tc.axisLine } }
      },
      series: [{ type: 'radar', data: radarData }]
    }, true);
    return;
  }

  // PARALLEL MODE
  if (State.pcaMode === 'parallel') {
    const parallelAxis = [
      { dim: 0, name: 'Kemandirian (%)' },
      { dim: 1, name: 'Desentralisasi (%)' },
      { dim: 2, name: 'Blj Modal (%)' },
      { dim: 3, name: 'IPM' },
      { dim: 4, name: 'Kemiskinan P0 (%)' },
      { dim: 5, name: 'PC1' }
    ];

    const parallelSeries = [0, 1, 2, 3].map(cId => ({
      type: 'parallel',
      name: ClusterMeta[cId].short,
      lineStyle: { color: pal.cluster[cId], width: 1.05, opacity: 0.35 },
      data: State.filtered
        .filter(d => d.cluster === cId)
        .map(d => [
          d.kemandirian_2024_persen||0,
          d.derajat_desentralisasi_2024_persen||0,
          d.belanja_modal_2024_persen||0,
          d.ipm_2024||0,
          d.persen_miskin_p0_2024||0,
          d.pca_x||0
        ])
    }));

    State.charts.scatter.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: tc.tooltipBg, borderColor: tc.tooltipBorder, textStyle: { color: tc.tooltipText } },
      legend: { top: 6, textStyle: { color: tc.legendText, fontSize: 11 }, icon: 'circle', itemGap: 16 },
      parallelAxis: parallelAxis.map(a => ({
        ...a,
        axisLine: { lineStyle: { color: tc.axisLine } },
        axisLabel: { color: tc.axisLabel, fontSize: 10 },
        nameTextStyle: { color: tc.tooltipText, fontSize: 11, fontWeight: '600' },
        splitLine: { show: false }
      })),
      parallel: { left: '8%', right: '8%', top: '16%', bottom: '12%' },
      series: parallelSeries
    }, true);
    return;
  }

  // SCATTER MODE (DEFAULT)
  const series = [0,1,2,3].map(cId => ({
    name: ClusterMeta[cId].name,
    type: 'scatter',
    symbolSize: val => Math.max(5, Math.min(18, Math.log10(val[3]||100000)*2.8)),
    itemStyle: {
      color: pal.cluster[cId],
      opacity: 0.85,
      borderColor: tc.isWarm ? '#FFFFFF' : '#07090f',
      borderWidth: 1
    },
    emphasis: {
      scale: 1.5,
      itemStyle: { borderColor: '#fff', borderWidth: 2, shadowBlur: 12 }
    },
    data: validAll
      .filter(d => d.cluster === cId)
      .map(d => ({
        name: d.nama_asli,
        value: [d.pca_x, d.pca_y, d.kemandirian_2024_persen, d.penduduk_2024||0],
        raw: d,
        itemStyle: { opacity: filteredKeys.has(d.key) ? 0.85 : 0.1 }
      }))
  }));

  if (State.pcaMode === 'biplot') {
    const xs = validAll.map(d => d.pca_x);
    const ys = validAll.map(d => d.pca_y);
    const maxR = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs), 1);
    const scale = maxR * 0.9;
    const biColor = tc.isWarm ? '#C85A32' : '#F59E0B';
    MULTI_VARS.forEach(v => {
      const vs = validAll.map(d => +(d[v.key] || 0));
      const cx = pearson(xs, vs) * scale;
      const cy = pearson(ys, vs) * scale;
      series.push({
        type: 'line',
        name: v.label,
        data: [[0, 0], [cx, cy]],
        symbol: ['none', 'arrow'],
        symbolSize: 8,
        lineStyle: { color: tc.isWarm ? 'rgba(200,90,50,0.85)' : 'rgba(245,158,11,0.85)', width: 1.4 },
        itemStyle: { color: biColor },
        tooltip: { show: false },
        silent: true,
        z: 8,
        label: {
          show: true,
          formatter: v.label,
          position: 'end',
          color: biColor,
          fontSize: 10,
          fontFamily: 'Inter'
        },
        endLabel: {
          show: true,
          formatter: v.label,
          color: biColor,
          fontSize: 10,
          fontFamily: 'Inter'
        }
      });
    });
  }

  State.charts.scatter.setOption({
    backgroundColor: 'transparent',
    grid: { left:'8%', right:'4%', top:'14%', bottom:'12%' },
    legend: {
      top: 6,
      data: [0,1,2,3].map(i => ClusterMeta[i].name),
      textStyle: { color: tc.legendText, fontSize:11 },
      icon: 'circle', itemGap: 20
    },
    brush: {
      toolbox: ['rect','polygon','clear'],
      xAxisIndex: 0,
      yAxisIndex: 0,
      brushStyle: {
        borderWidth: 1.5,
        color: tc.isWarm ? 'rgba(200,90,50,0.12)' : 'rgba(245,158,11,0.12)',
        borderColor: tc.isWarm ? '#C85A32' : '#F59E0B'
      },
      outOfBrush: { colorAlpha: 0.08 }
    },
    toolbox: {
      right: 8, top: 0, itemSize: 13,
      iconStyle: { borderColor: tc.axisLabel },
      feature: {
        brush: {
          type: ['rect','polygon','clear'],
          title: { rect:'Seleksi Kotak', polygon:'Seleksi Bebas', clear:'Hapus Seleksi' }
        }
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: scatterTooltipFmt,
      backgroundColor: tc.tooltipBg,
      borderColor: tc.tooltipBorder,
      textStyle: { color: tc.tooltipText, fontFamily:'Inter', fontSize:12 },
      extraCssText: `border-radius:10px;padding:12px 14px;box-shadow:${tc.tooltipShadow};`
    },
    xAxis: {
      name: State.pcaMode === 'biplot'
        ? 'PC1 + vektor korelasi variabel (biplot)'
        : 'PC1: Kapasitas Fiskal & Kemandirian →',
      nameLocation: 'middle', nameGap: 28,
      nameTextStyle: { color: tc.axisLabel, fontSize:11, fontWeight:'600' },
      axisLine: { lineStyle: { color: tc.axisLine } },
      splitLine: { lineStyle: { color: tc.splitLine, type:'dashed' } },
      axisLabel: { color: tc.axisLabel, fontSize:10, fontFamily:'JetBrains Mono' }
    },
    yAxis: {
      name: '↑ PC2: Orientasi Belanja Modal vs Operasi',
      nameLocation: 'middle', nameGap: 40,
      nameTextStyle: { color: tc.axisLabel, fontSize:11, fontWeight:'600' },
      axisLine: { lineStyle: { color: tc.axisLine } },
      splitLine: { lineStyle: { color: tc.splitLine, type:'dashed' } },
      axisLabel: { color: tc.axisLabel, fontSize:10, fontFamily:'JetBrains Mono' }
    },
    series
  }, true);
}

function scatterTooltipFmt(p) {
  if (!p.data?.raw) return '';
  const tc = getThemeColors();
  const d = p.data.raw;
  const cm = ClusterMeta[d.cluster] || {};
  return `
    <div style="min-width:200px;line-height:1.6">
      <div style="font-size:10px;font-weight:700;color:${cm.color};text-transform:uppercase;letter-spacing:.06em">${d.provinsi}</div>
      <div style="font-size:14px;font-weight:800;color:${tc.tooltipText};margin-bottom:6px">${d.nama_asli}</div>
      <div style="background:${tc.tooltipBoxBg};border-radius:8px;padding:8px;font-size:11px;font-family:monospace">
        <div>PC1 (Fiskal): <b style="color:var(--accent)">${fmtID(d.pca_x,3)}</b></div>
        <div>PC2 (Belanja): <b style="color:#0077BB">${fmtID(d.pca_y,3)}</b></div>
        <div style="border-top:1px solid ${tc.splitLine};margin-top:6px;padding-top:6px">
          <div>Kemandirian: <b style="color:${tc.tooltipText}">${fmtID(d.kemandirian_2024_persen,2)}%</b></div>
          <div>Blj. Modal: <b style="color:#009988">${fmtID(d.belanja_modal_2024_persen,2)}%</b></div>
        </div>
      </div>
    </div>
  `;
}

function handleBrushSelected(params) {
  const batch = params.batch?.[0];
  if (!batch) return;
  const keys = new Set();
  batch.selected.forEach(s => {
    const sData = State.charts.scatter.getOption().series[s.seriesIndex].data;
    s.dataIndex.forEach(i => {
      if (sData[i]?.raw) keys.add(sData[i].raw.key);
    });
  });
  State.brushedKeys = keys;
  updateBrushBar(keys);
  renderMap();
  renderTreemap();
}

function updateBrushBar(keys) {
  const bar = id('brush-bar');
  if (keys.size === 0) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  setTxt('brush-count', `${keys.size} daerah dipilih`);

  const items = State.raw.filter(d => keys.has(d.key));
  const avgK = items.reduce((s,d)=>s+(d.kemandirian_2024_persen||0),0)/items.length;
  const avgI = items.reduce((s,d)=>s+(d.ipm_2024||0),0)/items.length;
  const names = items.slice(0,3).map(d=>d.nama_asli).join(', ')+(items.length>3?'…':'');
  id('brush-summary').innerHTML = `Rata-rata Kemandirian: <b>${fmtID(avgK,2)}%</b> · IPM: <b>${fmtID(avgI,2)}</b> · Contoh: <span style="color:#f8fafc">${names}</span>`;
}

function clearBrush() {
  State.brushedKeys.clear();
  id('brush-bar').classList.add('hidden');
  State.charts.scatter?.dispatchAction({ type:'brush', command:'clear', areas:[] });
  renderMap();
  renderTreemap();
}

// ─────────────────────────────────────────────
// 7c. TREEMAP CHART
// ─────────────────────────────────────────────
function renderTreemap() {
  const container = id('treemap-chart');
  if (!State.charts.treemap) {
    State.charts.treemap = echarts.init(container, null, { renderer: 'canvas' });
    State.charts.treemap.on('click', handleTreeClick);
  }

  const pal = getPalette();
  const filteredKeys = new Set(State.filtered.map(d => d.key));
  const hasBrush = State.brushedKeys.size > 0;

  const meanKem = items => {
    const v = items.map(d => d.kemandirian_2024_persen).filter(x => x != null && !isNaN(x));
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
  };

  const provMap = {};
  State.raw.forEach(d => {
    if (!provMap[d.provinsi]) provMap[d.provinsi] = [];
    provMap[d.provinsi].push(d);
  });

  const provNodes = Object.entries(provMap).map(([prov, items]) => {
    const provPop = items.reduce((s, d) => s + (d.penduduk_2024 || 0), 0);
    const provKem = meanKem(items);
    return {
      name: prov,
      value: [Math.round(provPop), +provKem.toFixed(2)],
      itemStyle: { color: colorInterpolate(provKem, 0, 80), borderColor: '#07090f', borderWidth: 2 },
      children: items.map(d => {
        const kem = d.kemandirian_2024_persen || 0;
        const inView = filteredKeys.has(d.key) && (!hasBrush || State.brushedKeys.has(d.key));
        return {
          name: d.nama_asli,
          value: [Math.round(d.penduduk_2024 || 10000), +kem.toFixed(2)],
          raw: d,
          itemStyle: {
            color: colorInterpolate(kem, 0, 80),
            opacity: inView ? 1 : 0.22,
            borderColor: 'rgba(7,9,15,0.5)',
            borderWidth: 0.8
          }
        };
      })
    };
  });

  const natPop = State.raw.reduce((s, d) => s + (d.penduduk_2024 || 0), 0);
  const natKem = meanKem(State.raw);
  const data = [{
    name: 'Indonesia',
    value: [Math.round(natPop), +natKem.toFixed(2)],
    itemStyle: { color: colorInterpolate(natKem, 0, 80), borderColor: '#07090f', borderWidth: 3 },
    children: provNodes
  }];

  const legendBar = id('treemap-legend-bar');
  if (legendBar) {
    legendBar.style.background = `linear-gradient(to right, ${pal.seq.join(',')})`;
  }

  const tc = getThemeColors();
  const tooltip = {
    formatter: treemapTooltipFmt,
    backgroundColor: tc.tooltipBg,
    borderColor: tc.tooltipBorder,
    textStyle: { color: tc.tooltipText, fontFamily: 'Inter', fontSize: 12 },
    extraCssText: `border-radius:10px;padding:12px 14px;box-shadow:${tc.tooltipShadow};`
  };

  if (State.treeMode === 'sunburst') {
    State.charts.treemap.setOption({
      backgroundColor: 'transparent',
      tooltip,
      series: [{
        type: 'sunburst',
        data,
        radius: [0, '90%'],
        nodeClick: 'rootToNode',
        label: { rotate: 'radial', fontSize: 9, color: tc.tooltipText },
        itemStyle: { borderColor: tc.isWarm ? '#EAE3D6' : '#0f1117', borderWidth: 1 },
        levels: [
          {},
          { r0: '0%', r: '18%', label: { show: true, fontSize: 10, color: tc.tooltipText } },
          { r0: '18%', r: '52%', label: { rotate: 'tangential', fontSize: 9, color: tc.tooltipText } },
          { r0: '52%', r: '90%', label: { show: false } }
        ]
      }]
    }, true);
    return;
  }

  State.charts.treemap.setOption({
    backgroundColor: 'transparent',
    tooltip,
    series: [{
      type: 'treemap',
      data,
      roam: true,
      nodeClick: 'zoomToNode',
      visibleMin: 300,
      breadcrumb: {
        show: true, top: 6, left: 'center',
        itemStyle: { color: tc.tooltipBoxBg, borderColor: tc.splitLine, borderWidth: 1 },
        textStyle: { color: tc.tooltipText, fontSize: 11, fontFamily: 'Inter' }
      },
      // levels[0] = virtual root ECharts (tidak dirender); indeks depth data bergeser +1
      levels: [
        {},
        { itemStyle: { borderColor: tc.isWarm ? '#EAE3D6' : '#0f1117', borderWidth: 3, gapWidth: 2 } },
        {
          itemStyle: { borderColor: tc.isWarm ? '#EAE3D6' : '#0f1117', borderWidth: 2, gapWidth: 1.5 },
          upperLabel: {
            show: true, height: 26,
            color: tc.tooltipText, fontWeight: '700', fontSize: 11, fontFamily: 'Inter',
            backgroundColor: tc.isWarm ? 'rgba(255,255,255,0.85)' : 'rgba(15,17,23,0.75)'
          }
        },
        {
          itemStyle: { borderColor: tc.isWarm ? 'rgba(56,46,38,0.15)' : 'rgba(15,17,23,0.5)', borderWidth: 0.5, gapWidth: 0.5 },
          label: {
            show: true,
            minMargin: 4,
            formatter: p => {
              const v = p.value;
              const rect = p.rect || {};
              // Prefiks jenis daerah hanya di tooltip; di ubin ia memakan ruang nama
              const nm = String(p.name).replace(/^(Kab\.|Kabupaten|Kota)\s+/i, '');
              if (rect.width < 30 || rect.height < 15) return '';
              return v && v[1] !== undefined ? `{n|${nm}}\n{v|${fmtID(v[1],2)}%}` : nm;
            },
            rich: {
              n: { color: tc.tooltipText, fontSize: 10, fontFamily: 'Inter', lineHeight: 13 },
              v: { color: 'var(--accent)', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: '600', lineHeight: 13 }
            }
          }
        }
      ]
    }]
  }, true);
}

function setHierarchyCrumb(parts) {
  const el = id('hierarchy-crumb');
  if (!el) return;
  const clean = (parts || []).filter(Boolean);
  el.textContent = clean.length ? clean.join('  /  ') : 'Indonesia';
}

function handleTreeClick(p) {
  const path = (p.treePathInfo || []).map(x => x.name).filter(Boolean);
  setHierarchyCrumb(path.length ? path : [p.name || 'Indonesia']);
  if (p.data?.raw) onRegionClick(p.data.raw);
}

function treemapTooltipFmt(p) {
  const tc = getThemeColors();
  const v = p.value || [];
  const pop = v[0] || 0;
  const kem = v[1] !== undefined ? v[1] + '%' : '-';
  const hasKids = !!(p.data && p.data.children && p.data.children.length);
  const level = p.name === 'Indonesia' ? 'Nasional' : (hasKids ? 'Provinsi' : (p.data?.raw?.jenis || 'Kabupaten / Kota'));
  return `
    <div style="line-height:1.6">
      <div style="font-size:10px;color:${tc.axisLabel};text-transform:uppercase;font-weight:700">${level}</div>
      <div style="font-size:14px;font-weight:800;color:${tc.tooltipText};margin-bottom:6px">${p.name}</div>
      <div style="background:${tc.tooltipBoxBg};border-radius:8px;padding:8px;font-size:12px;font-family:monospace">
        <div>Populasi: <b style="color:${tc.tooltipText}">${fmtNum(pop)}</b> jiwa</div>
        <div>Kemandirian: <b style="color:var(--accent)">${kem}</b></div>
      </div>
      <div style="font-size:10px;color:${tc.axisLabel};margin-top:6px">${hasKids ? 'Klik → drill-down (breadcrumb)' : 'Klik → detail APBD'}</div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// 7d. SHIFT CHART (2024 vs 2025)
// ─────────────────────────────────────────────
function renderShift() {
  const container = id('shift-chart');
  if (!State.charts.shift) {
    State.charts.shift = echarts.init(container, null, { renderer: 'canvas' });
  }

  const pal = getPalette();
  const tc = getThemeColors();
  const scope = State.shiftScope;

  let pool = State.filtered.filter(d => d.pendidikan_2024_realisasi !== null);
  let title = `Rata-Rata Nasional (${pool.length} Kab/Kota)`;

  if (scope === 'CLUSTER_0') { pool = pool.filter(d=>d.cluster===0); title=`K0: Metropolitan Mandiri (${pool.length} Daerah)`; }
  else if (scope === 'CLUSTER_1') { pool = pool.filter(d=>d.cluster===1); title=`K1: Tertinggal & Bergantung (${pool.length} Daerah)`; }
  else if (scope === 'CLUSTER_2') { pool = pool.filter(d=>d.cluster===2); title=`K2: Berkembang / Transisi (${pool.length} Daerah)`; }
  else if (scope === 'CLUSTER_3') { pool = pool.filter(d=>d.cluster===3); title=`K3: Akselerasi Belanja Modal (${pool.length} Daerah)`; }
  else if (scope === 'SELECTED' && State.selectedRegion) {
    pool = [State.selectedRegion];
    title = `${State.selectedRegion.nama_asli} (${State.selectedRegion.provinsi})`;
  }

  const avg = k => pool.length ? +((pool.reduce((s,d)=>s+(d[k]||0),0)/pool.length).toFixed(2)) : 0;

  const cats   = ['Pendidikan','Kesehatan','Ekonomi','Perumahan','Fungsi Lain'];
  const k24    = ['pendidikan_2024_realisasi','kesehatan_2024_realisasi','ekonomi_2024_realisasi','perumahan_2024_realisasi','fungsi_lain_2024_realisasi'];
  const k25    = ['pendidikan_2025_anggaran','kesehatan_2025_anggaran','ekonomi_2025_anggaran','perumahan_2025_anggaran','fungsi_lain_2025_anggaran'];
  const val24  = k24.map(avg);
  const val25  = k25.map(avg);
  const deltas = val25.map((v,i) => +(v-val24[i]).toFixed(2));

  // Update delta scorecard panel
  renderDeltaCards(cats, val24, val25, deltas);

  State.charts.shift.setOption({
    backgroundColor: 'transparent',
    title: {
      text: title,
      textStyle: { color: tc.titleText, fontSize: 12, fontWeight: '600', fontFamily: 'Inter' },
      left: 10, top: 6
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type:'shadow', shadowStyle:{ color: tc.isWarm ? 'rgba(56,46,38,0.05)' : 'rgba(255,255,255,0.03)' } },
      formatter: params => shiftTooltipFmt(params, deltas, pal),
      backgroundColor: tc.tooltipBg,
      borderColor: tc.tooltipBorder,
      textStyle: { color: tc.tooltipText, fontFamily: 'Inter', fontSize: 12 },
      extraCssText: `border-radius:10px;padding:12px 14px;box-shadow:${tc.tooltipShadow};`
    },
    legend: {
      data: ['2024 (Realisasi)','2025 (Anggaran)'],
      right: 10, top: 6,
      textStyle: { color: tc.legendText, fontSize: 11 }
    },
    grid: { left:'5%', right:'5%', top:'16%', bottom:'8%', containLabel:true },
    xAxis: {
      type:'category', data: cats,
      axisLine: { lineStyle:{color: tc.axisLine} },
      axisTick: { show:false },
      axisLabel: { color: tc.axisLabel, fontSize: 11, fontFamily: 'Inter' }
    },
    yAxis: {
      type:'value',
      name:'Proporsi Belanja (%)',
      nameTextStyle: { color: tc.axisLabel, fontSize: 11 },
      axisLine: { lineStyle:{color: tc.axisLine} },
      splitLine: { lineStyle:{color: tc.splitLine, type:'dashed'} },
      axisLabel: { color: tc.axisLabel, formatter:'{value}%', fontFamily:'JetBrains Mono', fontSize:10 }
    },
    series: [
      {
        name:'2024 (Realisasi)',
        type:'bar', barGap:'12%', barMaxWidth:32,
        itemStyle: { color:pal.bar24, borderRadius:[4,4,0,0] },
        label: { show:true, position:'top', color: tc.axisLabel, fontSize:10, fontFamily:'JetBrains Mono', formatter: p=>fmtID(p.value,2)+'%' },
        data: val24
      },
      {
        name:'2025 (Anggaran)',
        type:'bar', barMaxWidth:32,
        itemStyle: { color:pal.bar25, borderRadius:[4,4,0,0] },
        label: { show:true, position:'top', color: tc.axisLabel, fontSize:10, fontFamily:'JetBrains Mono', formatter: p=>fmtID(p.value,2)+'%' },
        data: val25
      }
    ]
  }, true);
}

function shiftTooltipFmt(params, deltas, pal) {
  if (!params?.length) return '';
  const tc = getThemeColors();
  const i = params[0].dataIndex;
  const cat = params[0].name;
  const v24 = params[0]?.value ?? '-';
  const v25 = params[1]?.value ?? '-';
  const d = deltas[i];
  const sign = d > 0 ? `+${fmtID(d,2)}` : fmtID(d,2);
  const col = d > 0 ? '#10b981' : (d < 0 ? '#ef4444' : '#6b7280');
  return `
    <div style="min-width:220px;line-height:1.6">
      <div style="font-size:14px;font-weight:800;color:${tc.tooltipText};border-bottom:1px solid ${tc.splitLine};padding-bottom:6px;margin-bottom:8px">${cat}</div>
      <div style="font-size:11px;font-family:monospace">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:${tc.axisLabel};display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:${pal.bar24}"></span>2024 Realisasi:</span> <b style="color:${pal.bar24}">${fmtID(v24,2)}%</b>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="color:${tc.axisLabel};display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:${pal.bar25}"></span>2025 Anggaran:</span> <b style="color:${pal.bar25}">${fmtID(v25,2)}%</b>
        </div>
        <div style="background:${tc.tooltipBoxBg};border-radius:8px;padding:6px 8px;display:flex;justify-content:space-between">
          <span style="color:${tc.axisLabel}">Pergeseran Kebijakan:</span>
          <b style="color:${col}">${sign} pp</b>
        </div>
      </div>
    </div>
  `;
}

function renderDeltaCards(cats, val24, val25, deltas) {
  const wrap = id('delta-cards');
  if (!wrap) return;
  wrap.innerHTML = cats.map((cat, i) => {
    const d = deltas[i];
    const sign = d > 0 ? `+${fmtID(d,2)}` : fmtID(d,2);
    const col = d > 0 ? 'delta-up' : (d < 0 ? 'delta-dn' : 'delta-ne');
    const bg = d > 0 ? 'rgba(52,211,153,0.08)' : (d < 0 ? 'rgba(248,113,113,0.08)' : 'var(--bg-elevated)');
    const icon = d > 0 ? '↑' : (d < 0 ? '↓' : '→');
    return `
      <div class="flex items-center justify-between p-2.5 rounded-lg" style="background:${bg}">
        <div>
          <div class="text-xs font-semibold" style="color:var(--text-primary)">${cat}</div>
          <div class="text-[11px] font-mono" style="color:var(--text-muted)">${fmtID(val24[i],2)}% → ${fmtID(val25[i],2)}%</div>
        </div>
        <div class="${col} font-mono font-bold text-sm">${icon} ${sign} pp</div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// 8. REGION CLICK HANDLER
// ═══════════════════════════════════════════════════════════════
function onRegionClick(d) {
  State.selectedRegion = d;
  State.shiftScope = 'SELECTED';

  // Activate "Daerah Terpilih" scope button
  document.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
  const selBtn = id('selected-region-btn');
  if (selBtn) {
    selBtn.dataset.scope = 'SELECTED';
    selBtn.textContent = d.nama_asli;
    id('selected-region-btn-wrap').classList.remove('hidden');
    selBtn.classList.add('active');
  }

  updateSpotlight(d);
  renderShift();

  // Smooth scroll to shift section on mobile
  if (window.innerWidth < 1024) {
    id('section-shift')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }
}

// ═══════════════════════════════════════════════════════════════
// 9. EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════
function setupEventListeners() {
  // ── Sync initial theme UI state
  const initialWarm = isWarmTheme();
  const btnLabel = id('theme-btn-label');
  if (btnLabel) btnLabel.textContent = initialWarm ? 'Mode Gelap' : 'Tema Terang';
  const iconDark = id('theme-icon-dark');
  const iconLight = id('theme-icon-light');
  if (iconDark && iconLight) {
    if (initialWarm) {
      iconDark.classList.add('hidden');
      iconLight.classList.remove('hidden');
    } else {
      iconDark.classList.remove('hidden');
      iconLight.classList.add('hidden');
    }
  }
  const optDark = id('theme-opt-dark');
  const optWarm = id('theme-opt-warm');
  if (optDark && optWarm && initialWarm) {
    optDark.style.border = '1px solid var(--border)';
    optDark.style.background = 'var(--bg-elevated)';
    optDark.style.color = 'var(--text-muted)';
    const dTag = optDark.querySelector('span.font-mono');
    if (dTag) { dTag.textContent = 'OLED'; dTag.classList.add('opacity-60'); dTag.style.color = ''; }

    optWarm.style.border = '1px solid var(--accent)';
    optWarm.style.background = 'var(--accent-dim)';
    optWarm.style.color = 'var(--text-primary)';
    const wTag = optWarm.querySelector('span.font-mono');
    if (wTag) { wTag.textContent = 'Aktif'; wTag.classList.remove('opacity-60'); wTag.style.color = 'var(--accent)'; }
  }

  // ── Theme toggle listeners (Navbar & Sidebar)
  id('btn-theme-toggle')?.addEventListener('click', () => {
    const isWarm = document.documentElement.getAttribute('data-theme') === 'warm-sand';
    setTheme(isWarm ? 'dark' : 'warm-sand');
  });
  id('theme-opt-dark')?.addEventListener('click', () => setTheme('dark'));
  id('theme-opt-warm')?.addEventListener('click', () => setTheme('warm-sand'));

  // ── Filter sidebar open/close
  id('btn-open-filter').addEventListener('click', () => {
    id('filter-sidebar').classList.add('open');
    id('filter-overlay').classList.add('visible');
  });
  const closeFilter = () => {
    id('filter-sidebar').classList.remove('open');
    id('filter-overlay').classList.remove('visible');
  };
  id('btn-close-filter').addEventListener('click', closeFilter);
  id('filter-overlay').addEventListener('click', closeFilter);

  // ── Type filter buttons
  document.querySelectorAll('.filter-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filters.type = btn.dataset.filterType;
      applyFilters();
    });
  });

  // ── Province filter
  id('filter-provinsi').addEventListener('change', e => {
    State.filters.provinsi = e.target.value;
    applyFilters();
  });

  // ── Cluster checkboxes
  document.querySelectorAll('.cluster-filter-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const allCb = document.querySelector('[data-cluster="ALL"]');
      const individualCbs = document.querySelectorAll('.cluster-filter-check:not([data-cluster="ALL"])');
      if (cb.dataset.cluster === 'ALL') {
        if (cb.checked) {
          individualCbs.forEach(x => x.checked = false);
          State.filters.clusters = 'ALL';
        }
      } else {
        allCb.checked = false;
        const checked = [...individualCbs].filter(x => x.checked).map(x => +x.dataset.cluster);
        State.filters.clusters = checked.length ? new Set(checked) : 'ALL';
        if (!checked.length) allCb.checked = true;
      }
      applyFilters();
    });
  });

  // ── Kemandirian range
  const kemUpdate = () => {
    const min = Math.min(+id('kem-min').value||0, +id('kem-max').value||State.kemCeil);
    const max = Math.max(+id('kem-min').value||0, +id('kem-max').value||State.kemCeil);
    State.filters.kemMin = min;
    State.filters.kemMax = max;
    setTxt('kem-range-display', `${min} – ${max}%`);
    applyFilters();
  };
  id('kem-min').addEventListener('change', kemUpdate);
  id('kem-max').addEventListener('change', kemUpdate);

  // ── Kategori desentralisasi
  id('filter-kategori').addEventListener('change', e => {
    State.filters.kategori = e.target.value;
    applyFilters();
  });

  // ── Palette radio
  document.querySelectorAll('input[name="palette"]').forEach(r => {
    r.addEventListener('change', () => {
      State.palette = r.value;
      renderAll();
    });
  });

  // ── Reset all filters
  id('btn-reset-all').addEventListener('click', resetAllFilters);
  id('btn-reset-all-filters').addEventListener('click', resetAllFilters);

  // ── Map metric switch buttons
  document.querySelectorAll('[data-metric]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-metric]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.mapMetric = btn.dataset.metric;
      renderMap();
    });
  });

  // ── Map mode: gradasi vs klaster vs bubble
  id('btn-map-continuous')?.addEventListener('click', () => setMapMode('continuous'));
  id('btn-map-cluster')?.addEventListener('click', () => setMapMode('cluster'));
  id('btn-map-bubble')?.addEventListener('click', () => setMapMode('bubble'));
  id('btn-map-overlay')?.addEventListener('click', () => setMapMode('overlay'));

  // ── PCA view modes
  id('btn-pca-scatter')?.addEventListener('click', () => setPcaMode('scatter'));
  id('btn-pca-biplot')?.addEventListener('click', () => setPcaMode('biplot'));
  id('btn-pca-radar')?.addEventListener('click', () => setPcaMode('radar'));
  id('btn-pca-parallel')?.addEventListener('click', () => setPcaMode('parallel'));
  id('btn-pca-heatmap')?.addEventListener('click', () => setPcaMode('heatmap'));

  // ── Hierarchy view modes: Treemap vs Sunburst
  id('btn-tree-treemap')?.addEventListener('click', () => {
    State.treeMode = 'treemap';
    id('btn-tree-treemap')?.classList.add('active');
    id('btn-tree-sunburst')?.classList.remove('active');
    setHierarchyCrumb(['Indonesia']);
    renderTreemap();
  });
  id('btn-tree-sunburst')?.addEventListener('click', () => {
    State.treeMode = 'sunburst';
    id('btn-tree-sunburst')?.classList.add('active');
    id('btn-tree-treemap')?.classList.remove('active');
    setHierarchyCrumb(['Indonesia']);
    renderTreemap();
  });

  // ── Map zoom
  id('btn-zi').addEventListener('click', () => zoomMap(1.3));
  id('btn-zo').addEventListener('click', () => zoomMap(0.77));
  id('btn-zr').addEventListener('click', () => State.charts.map?.dispatchAction({ type:'restore' }));

  // ── Scatter brush clear
  id('btn-reset-brush').addEventListener('click', clearBrush);
  id('btn-clear-brush').addEventListener('click', clearBrush);

  // ── Treemap root
  id('btn-treemap-root').addEventListener('click', () => {
    setHierarchyCrumb(['Indonesia']);
    renderTreemap();
  });

  // ── Shift scope buttons
  document.querySelectorAll('.scope-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.shiftScope = btn.dataset.scope;
      if (btn.dataset.scope !== 'SELECTED') State.selectedRegion = null;
      renderShift();
    });
  });

  // ── Responsive resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      Object.values(State.charts).forEach(c => c?.resize());
    }, 120);
  });
}

function zoomMap(factor) {
  if (!State.charts.map) return;
  const opt = State.charts.map.getOption();
  const geoZ = opt.geo?.[0]?.zoom;
  const serZ = opt.series?.[0]?.zoom;
  const cur = geoZ || serZ || 1.2;
  const next = Math.max(0.9, Math.min(20, cur * factor));
  if (opt.geo?.[0]) {
    State.charts.map.setOption({ geo: [{ zoom: next }] });
  } else {
    State.charts.map.setOption({ series: [{ id: 'map-main', zoom: next }] });
  }
}

function setPcaMode(mode) {
  State.pcaMode = mode;
  const map = {
    scatter: 'btn-pca-scatter',
    biplot: 'btn-pca-biplot',
    radar: 'btn-pca-radar',
    parallel: 'btn-pca-parallel',
    heatmap: 'btn-pca-heatmap'
  };
  Object.values(map).forEach(i => id(i)?.classList.toggle('active', i === map[mode]));
  renderScatter();
}

function setMapMode(mode) {
  State.mapMode = mode;
  const ids = ['btn-map-continuous', 'btn-map-cluster', 'btn-map-bubble', 'btn-map-overlay'];
  const map = {
    continuous: 'btn-map-continuous',
    cluster: 'btn-map-cluster',
    bubble: 'btn-map-bubble',
    overlay: 'btn-map-overlay'
  };
  ids.forEach(i => id(i)?.classList.toggle('active', i === map[mode]));
  renderMap();
}

// ═══════════════════════════════════════════════════════════════
// 10. NAV DOTS (Scroll-spy)
// ═══════════════════════════════════════════════════════════════
function setupNavDots() {
  const sections = ['hero', 'section-map', 'section-pca', 'section-treemap', 'section-shift'];
  const dots = document.querySelectorAll('.nav-dot');

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      id(sections[i])?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target.id);
        if (idx !== -1) {
          dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => { const el = id(s); if(el) observer.observe(el); });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', boot);
