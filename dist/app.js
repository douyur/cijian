'use strict';

const { levels, levelOrder, scenarios, sources, builtIn, detect, normalize, scenarioLabel } = globalThis.Cijian;
const catalogDate = '2026-11-25';
const svg = {
  scan: '<path d="M7 3H4a1 1 0 0 0-1 1v3m14-4h3a1 1 0 0 1 1 1v3M3 17v3a1 1 0 0 0 1 1h3m14-4v3a1 1 0 0 1-1 1h-3M3 12h18"/>',
  book: '<path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1 0-4h13M8 7h7m-7 4h5"/>',
  history: '<path d="M3 12a9 9 0 1 1 2.5 6.2M3 12V7m0 5h5m4-5v5l3 2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 1.5-2.9 2-2.9 4m0 3h.01"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 4v4m8 2v4m-6 2v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  music: '<path d="M10 17V4l10-2v13M10 17a3 3 0 1 1-3-3h3m10 1a3 3 0 1 1-3-3h3"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/><path d="M9 8h6"/>',
  bag: '<path d="M4 8h16l1 13H3L4 8Zm4 0V6a4 4 0 0 1 8 0v2"/>',
  edit: '<path d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 5l3 3M8 16l1-4 9-9 3 3-9 9z"/>',
  sparkle: '<path d="M10 3c1 5 2 6 7 7-5 1-6 2-7 7-1-5-2-6-7-7 5-1 6-2 7-7Zm8 12v6m-3-3h6"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  trash: '<path d="M4 6h16M9 6V3h6v3m3 0-1 15H7L6 6m4 4v7m4-7v7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  report: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 17v-3m3 3v-6m3 6v-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12m0-12L6 18"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m5 18 5-5 3 3 3-4 4 6"/>',
  link: '<path d="M10 13l4-4m-6 6-1 1a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0m2 8a3 3 0 0 0 4 0l4-4a3 3 0 0 0-4-4l-1 1"/>',
  replace: '<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>',
  undo: '<path d="m9 5-5 5 5 5m-5-5h10a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="m15 5 5 5-5 5m5-5H10a5 5 0 0 0 0 10h3"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/>',
  'eye-off': '<path d="M3 3l18 18M10.5 6.1A11 11 0 0 1 12 6c6.5 0 10 6 10 6a15 15 0 0 1-3.2 3.5m-3 1.8A10.7 10.7 0 0 1 12 18C5.5 18 2 12 2 12a15 15 0 0 1 3.7-3.9m4.5 2.1a2.5 2.5 0 0 0 3.5 3.5"/>'
};

const sample = '最近换季，我把这款轻盈面霜加进了日常护肤清单。\n\n它是全网第一，采用独家配方，质地清爽、绝对安全。每天早晚使用，保证有效，轻松应对换季干燥。\n\n现在下单可享限时特惠，想了解更多使用心得，也可以加微信交流。\n\n每个人肤质不同，欢迎在评论区分享你的真实体验。';
const maxCharacters = 20000;
const pageSize = 40;
const labels = { check: '文案检测', dictionary: '词库管理', history: '检测历史' };
const reportLevels = { high: '禁用词', medium: '敏感词', low: '提示' };
const formatter = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' });
const get = id => document.getElementById(id);
const input = get('text');
const mirror = get('mirror');
const results = get('results');
const storagePrefix = 'cijian.v1.';

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(storagePrefix + key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function storeList(key, value) {
  try {
    localStorage.setItem(storagePrefix + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

let custom = readList('dictionary');
let history = readList('history');
let scenario = Object.keys(scenarios).filter(key => key !== 'general');
let dictionaryScope = 'all';
let ignored = new Set();
let matches = [];
let lastText = null;
let filter = 'all';
let visibleCount = pageSize;
let focusedHit = null;
let showingSample = false;
let historyId = null;
let toastTimeout;
let sourceType = 'text';
let sourceRequest = null;
const sourceDrafts = Object.fromEntries(Object.keys(CijianSources.definitions).map(key => [key, {
  text: '', ran: false, sample: false, historyId: null, file: null, url: '', pending: false, ignored: new Set()
}]));

function icon(name) {
  const span = document.createElement('span');
  span.dataset.icon = name;
  drawIcon(span);
  return span;
}

function drawIcon(span) {
  span.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${svg[span.dataset.icon] || ''}</svg>`;
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function button(label, className, action, iconName) {
  const node = element('button', className);
  node.type = 'button';
  if (iconName) node.append(icon(iconName));
  node.append(label);
  node.addEventListener('click', action);
  return node;
}

function notify(message) {
  get('toast').textContent = message;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { get('toast').textContent = ''; }, 2600);
}

function route() {
  const requested = location.hash.slice(1);
  const page = Object.hasOwn(labels, requested) ? requested : 'check';
  for (const key of Object.keys(labels)) get(`${key}-page`).hidden = key !== page;
  document.querySelectorAll('.top-nav [data-page]').forEach(node => {
    const active = node.dataset.page === page;
    if (active) node.setAttribute('aria-current', 'page');
    else node.removeAttribute('aria-current');
  });
  document.title = `词检 · ${labels[page]}`;
  if (page === 'dictionary') renderDictionary();
  if (page === 'history') renderHistory();
}

function navigate(page) {
  const hash = page === 'check' ? '' : `#${page}`;
  if (location.hash !== hash) window.history.pushState(null, '', hash || location.pathname + location.search);
  route();
  window.scrollTo(0, 0);
}

function renderScenarios() {
  const bar = get('scenarios');
  bar.replaceChildren();
  for (const [id, entry] of Object.entries(scenarios)) {
    const item = button(entry.label, 'scenario-button', () => {
      if (id === 'general') return;
      scenario = scenario.includes(id) ? scenario.filter(key => key !== id) : [...scenario, id];
      historyId = null;
      ignored.clear();
      for (const option of bar.children) option.setAttribute('aria-pressed', String(option.dataset.scenario === 'general' || scenario.includes(option.dataset.scenario)));
      if (input.value.trim()) runScan();
    }, entry.icon);
    item.dataset.scenario = id;
    item.setAttribute('aria-pressed', String(id === 'general' || scenario.includes(id)));
    if (id === 'general') {
      item.classList.add('required');
      item.setAttribute('aria-disabled', 'true');
      item.setAttribute('aria-label', '通用词库，始终启用');
    }
    bar.append(item);
  }
}

function scrollMirror() {
  mirror.scrollTop = input.scrollTop;
  mirror.scrollLeft = input.scrollLeft;
}

function renderEditor() {
  const text = input.value;
  const fragment = document.createDocumentFragment();
  let offset = 0;
  if (lastText === text) {
    for (const hit of matches.filter(isActive)) {
      fragment.append(text.slice(offset, hit.start));
      const mark = element('mark', `risk-${hit.level}${hit === focusedHit ? ' focused' : ''}`, hit.matched);
      mark.id = `highlight-${hit.start}`;
      fragment.append(mark);
      offset = hit.end;
    }
  }
  fragment.append(text.slice(offset));
  if (text.endsWith('\n')) fragment.append(element('span', 'end-marker', '\u200b'));
  mirror.replaceChildren(fragment);
  scrollMirror();
  get('character-count').textContent = `${[...text].length.toLocaleString('zh-CN')} / ${maxCharacters.toLocaleString('zh-CN')} 字`;
  const mode = get('editor-mode');
  mode.replaceChildren();
  if (showingSample) mode.append(icon('sparkle'), '示例文案');
  else if (lastText === text) mode.append(icon('check'), '已检测当前文案');
  else mode.append(icon('lock'), '本地处理');
  get('copy').disabled = !text;
  get('scan').disabled = Boolean(sourceRequest) || (!text.trim() && !hasSource());
  get('clear').disabled = !text && !hasSource();
  get('open-replacement').disabled = !text.trim();
  renderReview();
}

function hitKey(hit) {
  return `${hit.start}:${hit.end}:${hit.word}`;
}

function isActive(hit) {
  return !ignored.has(hitKey(hit));
}

function renderReview() {
  const review = get('review-text');
  const status = get('review-status');
  status.className = 'review-status';
  if (lastText === null) {
    review.replaceChildren(element('span', 'review-placeholder', '开始检测后，命中内容会在这里高亮显示。'));
    status.replaceChildren(icon('info'), '等待检测');
    return;
  }
  const fragment = document.createDocumentFragment();
  let offset = 0;
  const active = matches.filter(isActive);
  for (const hit of active) {
    fragment.append(lastText.slice(offset, hit.start));
    const mark = element('mark', `risk-${hit.level}${focusedHit === hit ? ' focused' : ''}`, hit.matched);
    mark.id = `review-${hit.start}`;
    mark.title = `${levels[hit.level]} · ${hit.category}`;
    fragment.append(mark);
    offset = hit.end;
  }
  fragment.append(lastText.slice(offset));
  review.replaceChildren(fragment);
  status.classList.add(active.length ? 'has-hits' : 'clear');
  const ignoredCount = matches.length - active.length;
  const message = active.length ? `存在 ${active.length} 处风险词` : '当前没有需要处理的命中';
  status.replaceChildren(icon(active.length ? 'info' : 'check'), message + (ignoredCount ? ` · 已忽略 ${ignoredCount} 处` : ''));
}

function reportFilters(counts) {
  const tabs = element('div', 'filter-bar');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', '按风险级别筛选');
  for (const [key, label] of Object.entries({ all: '全部', ...reportLevels })) {
    const tab = button(label, 'filter-tab', () => changeFilter(key));
    tab.append(element('span', 'filter-count', counts[key]));
    tab.dataset.filter = key;
    tab.setAttribute('aria-pressed', String(filter === key));
    tabs.append(tab);
  }
  return tabs;
}

function changeFilter(next) {
  filter = next;
  visibleCount = pageSize;
  renderResults();
  results.querySelector(`.filter-tab[data-filter="${next}"]`)?.focus({ preventScroll: true });
}

function emptyState(title, subtitle, iconName = 'scan') {
  const box = element('div', 'empty');
  box.append(icon(iconName), element('strong', '', title), element('p', '', subtitle));
  return box;
}

function renderResults() {
  get('export').disabled = lastText === null;
  const description = get('results-description');
  if (lastText === null) {
    description.textContent = '查看命中内容与修改建议';
    results.replaceChildren(emptyState('等待检测', '输入文案后，点击「开始检测」。'));
    return;
  }
  const active = matches.filter(isActive);
  const count = { all: active.length, high: 0, medium: 0, low: 0 };
  for (const hit of active) count[hit.level]++;
  description.textContent = `已检查 · ${scenarioLabel(scenario)}`;
  const list = element('div', 'results-list');
  list.setAttribute('aria-label', '风险命中列表');
  const filtered = matches.filter(hit => filter === 'all' || filter === hit.level)
    .sort((a, b) => levelOrder[a.level] - levelOrder[b.level] || a.start - b.start);
  for (const hit of filtered.slice(0, visibleCount)) list.append(renderHit(hit));
  if (filtered.length > visibleCount) {
    const more = button(`显示更多（剩余 ${filtered.length - visibleCount} 处）`, 'secondary report-more', () => {
      const previousCount = visibleCount;
      visibleCount += pageSize;
      renderResults();
      results.querySelectorAll('.term-button')[previousCount]?.focus();
    });
    list.append(more);
  }
  if (!filtered.length) {
    list.append(matches.length
      ? emptyState('此级别没有命中', '切换「全部」可查看其他命中。', 'check')
      : emptyState('未发现词库命中', '可结合发布场景与语境继续核对。', 'check'));
  }
  const words = element('div', 'rule-summary');
  for (const [group, label, className] of [['high', '禁用词参考', 'risk-high'], ['sensitive', '敏感词参考', 'risk-medium']]) {
    const unique = [...new Set(active.filter(hit => group === 'high' ? hit.level === 'high' : hit.level !== 'high').map(hit => hit.word))];
    const line = element('p', className);
    const shown = unique.slice(0, 20).join('、');
    line.append(element('strong', '', label + ' '), shown || '无');
    if (unique.length > 20) line.append(` 等 ${unique.length} 项`);
    words.append(line);
  }
  results.replaceChildren(words, reportFilters(count), list);
}

function renderHit(hit) {
  const active = isActive(hit);
  const row = element('article', `report-row risk-${hit.level}${focusedHit === hit ? ' selected' : ''}${active ? '' : ' ignored'}`);
  const line = element('div', 'report-line');
  const keyword = element('div', 'report-keyword');
  const term = button(hit.matched, 'term-button', () => locate(hit, row));
  term.title = '定位到原文';
  const reference = `第 ${hit.line} 行 · 第 ${hit.column} 字`;
  term.setAttribute('aria-label', `${hit.matched}，定位到${reference}`);
  keyword.append(element('span', 'risk-badge', reportLevels[hit.level]), term);
  const origin = hit.scope === 'custom' ? '自定义词库' : scenarios[hit.scope]?.label || '通用词库';
  const library = element('p', 'report-library');
  library.append(element('span', 'report-label', '所属'), origin);
  const explanation = element('p', 'report-explanation');
  explanation.append(element('span', 'report-label', '解释'), hit.detail);

  const extra = element('div', 'report-extra');
  extra.id = `report-extra-${hit.start}`;
  extra.hidden = true;
  const meta = element('div', 'report-extra-meta');
  meta.append(element('span', '', hit.category), element('span', '', reference));
  if (sources[hit.source]) meta.append(ruleSource(hit.source, '查看依据'));
  extra.append(meta);

  const actions = element('div', 'report-actions');
  const expand = button('', 'report-icon-button report-expand', () => {
    extra.hidden = !extra.hidden;
    expand.setAttribute('aria-expanded', String(!extra.hidden));
  }, 'chevron');
  expand.title = '命中详情';
  expand.setAttribute('aria-label', `${hit.matched}的命中详情`);
  expand.setAttribute('aria-controls', extra.id);
  expand.setAttribute('aria-expanded', 'false');
  const toggle = button('', 'report-icon-button', () => {
    if (active) ignored.add(hitKey(hit));
    else ignored.delete(hitKey(hit));
    renderEditor();
    renderResults();
    results.querySelector(`[data-hit-offset="${hit.start}"]`)?.focus({ preventScroll: true });
  }, active ? 'eye-off' : 'eye');
  toggle.title = active ? '忽略此处' : '恢复此处';
  toggle.setAttribute('aria-label', `${toggle.title}命中 ${hit.matched}`);
  toggle.dataset.hitOffset = hit.start;
  actions.append(expand, toggle);
  if (hit.suggestion && active) {
    const suggestion = element('div', 'risk-suggestion');
    const copy = element('span', '', '建议换为 ');
    copy.append(element('b', '', `「${hit.suggestion}」`));
    const apply = button('应用', 'apply', () => applySuggestion(hit), 'check');
    apply.setAttribute('aria-label', `应用建议，将${hit.matched}替换为${hit.suggestion}`);
    suggestion.append(copy, apply);
    extra.append(suggestion);
  }
  line.append(keyword, library, explanation, actions);
  row.append(line, extra);
  return row;
}

function locate(hit, row) {
  focusedHit = hit;
  renderEditor();
  results.querySelector('.selected')?.classList.remove('selected');
  row.classList.add('selected');
  const offset = get(`highlight-${hit.start}`)?.offsetTop;
  const reviewMark = get(`review-${hit.start}`);
  const review = get('review-text');
  if (reviewMark) {
    const delta = reviewMark.getBoundingClientRect().top - review.getBoundingClientRect().top;
    if (delta < 0 || delta > review.clientHeight - 30) review.scrollTop += delta - 30;
  }
  input.focus({ preventScroll: true });
  input.setSelectionRange(hit.start, hit.end);
  if (offset !== undefined && (offset < input.scrollTop + 10 || offset > input.scrollTop + input.clientHeight - 40)) {
    input.scrollTop = Math.max(0, offset - input.clientHeight / 3);
  }
  scrollMirror();
}

function applySuggestion(hit) {
  if (lastText !== input.value) return;
  const updated = input.value.slice(0, hit.start) + hit.suggestion + input.value.slice(hit.end);
  if ([...updated].length > maxCharacters) {
    notify('替换后会超过 20,000 字，请先缩短文案。');
    return;
  }
  input.value = updated;
  showingSample = false;
  ignored.clear();
  runScan({ record: Boolean(historyId), preserveFilter: true });
  input.focus({ preventScroll: true });
  input.setSelectionRange(hit.start, hit.start + hit.suggestion.length);
  notify('已应用修改并重新检测');
}

function runScan({ record = false, preserveFilter = false } = {}) {
  if (!input.value.trim()) return;
  lastText = input.value;
  matches = detect(lastText, scenario, custom);
  focusedHit = null;
  visibleCount = pageSize;
  if (!preserveFilter) filter = 'all';
  if (record) {
    historyId ||= `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const entry = { id: historyId, when: Date.now(), text: lastText, scenario, sourceType, total: matches.filter(isActive).length };
    history = [entry, ...history.filter(item => item.id !== entry.id)].slice(0, 20);
    if (!storeList('history', history)) notify('检测完成，浏览器存储不可用，历史只在本次会话保留。');
  }
  renderEditor();
  renderResults();
}

function resetResults() {
  lastText = null;
  matches = [];
  focusedHit = null;
  historyId = null;
  ignored.clear();
  renderEditor();
  renderResults();
}

function loadExample() {
  showingSample = true;
  historyId = null;
  ignored.clear();
  input.value = sample;
  input.setSelectionRange(0, 0);
  input.scrollTop = 0;
  runScan();
}

function enforceLength() {
  if (input.value.length <= maxCharacters) return;
  const characters = [...input.value];
  if (characters.length <= maxCharacters) return;
  input.value = characters.slice(0, maxCharacters).join('');
  notify('已保留前 20,000 字');
}

function hasSource() {
  const draft = sourceDrafts[sourceType];
  return Boolean(draft.file || draft.url.trim());
}

function cancelSourceRequest() {
  sourceRequest?.abort();
  sourceRequest = null;
}

function renderSourcePicker() {
  const options = get('source-options');
  options.hidden = sourceType === 'text';
  get('example').hidden = sourceType !== 'text';
  get('import').hidden = sourceType !== 'text';
  for (const tab of get('source-tabs').children) tab.setAttribute('aria-pressed', String(tab.dataset.sourceType === sourceType));
  if (options.hidden) return;
  const definition = CijianSources.definitions[sourceType];
  const draft = sourceDrafts[sourceType];
  const usesUrl = sourceType === 'video' || sourceType === 'website';
  get('source-url-label').hidden = !usesUrl;
  get('source-url-label').textContent = sourceType === 'video' ? '视频直链' : '网页地址';
  get('source-url').hidden = !usesUrl;
  get('source-url').placeholder = sourceType === 'video' ? 'https://example.com/视频.mp4' : 'https://example.com/文章';
  get('source-url').value = draft.url;
  get('source-file').accept = definition.accept;
  get('source-file-label').textContent = definition.picker;
  get('source-file-name').textContent = draft.file?.name || '';
  get('source-hint').textContent = definition.hint;
  get('source-progress').textContent = '';
}

function switchSource(next) {
  if (sourceType === next) return;
  cancelSourceRequest();
  Object.assign(sourceDrafts[sourceType], {
    text: input.value, ran: lastText !== null, sample: showingSample, historyId, ignored
  });
  sourceType = next;
  const draft = sourceDrafts[next];
  input.value = draft.text;
  input.setSelectionRange(0, 0);
  input.scrollTop = 0;
  showingSample = draft.sample;
  historyId = draft.historyId;
  ignored = new Set(draft.ignored);
  get('scan-label').textContent = '开始检测';
  renderSourcePicker();
  if (draft.ran && input.value.trim()) runScan();
  else resetResults();
}

function clearSource() {
  cancelSourceRequest();
  const draft = sourceDrafts[sourceType];
  Object.assign(draft, { url: '', file: null, pending: false });
  get('source-file').value = '';
  get('scan-label').textContent = '开始检测';
  renderSourcePicker();
}

function sourceChanged(file, url) {
  cancelSourceRequest();
  const draft = sourceDrafts[sourceType];
  Object.assign(draft, { file, url, pending: Boolean(file || url.trim()) });
  get('scan-label').textContent = '开始检测';
  get('source-file-name').textContent = file?.name || '';
  get('source-progress').textContent = '';
  if (file) get('source-url').value = '';
  input.value = '';
  resetResults();
}

async function beginDetection() {
  if (sourceRequest) return;
  const draft = sourceDrafts[sourceType];
  if (sourceType === 'text' || !draft.pending || !hasSource()) {
    if (input.value.trim()) runScan({ record: true });
    return;
  }
  const request = new AbortController();
  sourceRequest = request;
  const progress = get('source-progress');
  const report = message => { if (sourceRequest === request) progress.textContent = message; };
  report('正在读取内容…');
  get('scan-label').textContent = '正在检测';
  renderEditor();
  try {
    const content = await CijianSources.extract(sourceType, {
      file: draft.file, url: draft.url, report, signal: request.signal, limit: maxCharacters
    });
    if (sourceRequest !== request) return;
    if (!content.trim() || content.includes('\u0000')) throw new Error('未提取到可检测的文字。');
    showingSample = false;
    draft.pending = false;
    input.value = content.trim();
    enforceLength();
    runScan({ record: true });
    report('已提取文字并生成检测报告。');
  } catch (error) {
    report(error?.message || '读取失败，请更换文件后重试。');
  } finally {
    if (sourceRequest === request) {
      sourceRequest = null;
      get('scan-label').textContent = '开始检测';
      renderEditor();
    }
  }
}

function setupSources() {
  for (const [id, definition] of Object.entries(CijianSources.definitions)) {
    const tab = button(definition.label, 'source-tab', () => switchSource(id), definition.icon);
    tab.dataset.sourceType = id;
    get('source-tabs').append(tab);
  }
  get('choose-source').addEventListener('click', () => get('source-file').click());
  get('source-file').addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) sourceChanged(file, '');
    event.target.value = '';
  });
  get('source-url').addEventListener('input', event => sourceChanged(null, event.target.value));
  get('source-url').addEventListener('keydown', event => {
    if (event.key === 'Enter') beginDetection();
  });
  renderSourcePicker();
}

async function writeClipboard(field) {
  try {
    await navigator.clipboard.writeText(field.value);
  } catch {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const previousFocus = document.activeElement;
    field.focus({ preventScroll: true });
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Allow manual copy when blocked. */ }
    if (!copied) return false;
    field.setSelectionRange(start, end);
    if (previousFocus !== field) previousFocus?.focus({ preventScroll: true });
  }
  return true;
}

async function copyText() {
  notify(await writeClipboard(input) ? '已复制文案' : '已选中文案，请使用系统复制快捷键。');
}

async function importText(file) {
  if (!file) return;
  if (!/\.txt$/i.test(file.name)) { notify('请选择 TXT 文件'); return; }
  if (file.size > 160000) { notify('请导入 160 KB 以内的 TXT 文件'); return; }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = CijianSources.decodeText(bytes);
    if (!text.trim() || text.includes('\u0000')) { notify('TXT 文件为空或编码无法读取'); return; }
    showingSample = false;
    input.value = text;
    enforceLength();
    input.setSelectionRange(0, 0);
    input.scrollTop = 0;
    resetResults();
    input.focus();
  } catch {
    notify('读取失败，请将 TXT 保存为 UTF-8 后重试。');
  }
}

function exportReport() {
  if (lastText === null) return;
  const date = new Date();
  const active = matches.filter(isActive);
  const report = [
    '词检检测报告', `检测词库：${scenarioLabel(scenario)}`, `导出时间：${formatter.format(date)}`,
    `风险命中：${active.length} 处`, '', '命中明细',
    ...active.map(hit => `第 ${hit.line} 行，第 ${hit.column} 字 | ${levels[hit.level]} | ${hit.matched} | ${hit.category} | ${hit.detail}${hit.suggestion ? ` 建议换为：${hit.suggestion}` : ''}${sources[hit.source] ? ` 规则来源：${sources[hit.source][1]}` : ''}`),
    '', '原始文案', lastText
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff', report], { type: 'text/plain;charset=utf-8' }));
  const link = element('a');
  link.href = url;
  link.download = `词检报告-${date.toISOString().slice(0, 10)}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  notify('已导出检测报告');
}

function ruleSource(id, label) {
  const [name, url] = sources[id];
  const link = element('a', 'rule-source', label || name);
  link.href = url;
  link.title = name;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function ruleRow(rule, remove) {
  const row = element('div', `rule-row risk-${rule.level}`);
  const description = rule.scope === 'custom'
    ? rule.suggestion || '需人工确认'
    : `${rule.category} · ${scenarios[rule.scope]?.label || '所有场景'}`;
  row.append(element('strong', '', rule.word), element('span', 'risk-badge', levels[rule.level]), element('span', 'muted', description));
  if (remove) row.append(button('移除', 'secondary', remove));
  else if (sources[rule.source]) row.append(ruleSource(rule.source));
  return row;
}

function renderDictionary() {
  const scopes = { all: { label: '全部词库', icon: 'book' }, ...scenarios };
  get('dictionary-scopes').replaceChildren(...Object.entries(scopes).map(([id, scope]) => {
    const tab = button(scope.label, 'scenario-button', () => {
      dictionaryScope = id;
      for (const option of get('dictionary-scopes').children) option.setAttribute('aria-pressed', String(option.dataset.scope === id));
      renderBuiltIn();
    }, scope.icon);
    tab.dataset.scope = id;
    tab.setAttribute('aria-pressed', String(id === dictionaryScope));
    return tab;
  }));
  const list = get('custom-list');
  list.replaceChildren();
  for (const rule of custom) {
    list.append(ruleRow(rule, () => {
      custom = custom.filter(item => item !== rule);
      persistDictionary();
      notify('已移除自定义词');
    }));
  }
  if (!custom.length) list.append(emptyState('还没有自定义词', '添加你希望额外标记的表达。', 'book'));
  renderBuiltIn();
}

function renderBuiltIn() {
  const term = normalize(get('rule-search').value.trim()).value;
  const rows = builtIn.filter(rule => (dictionaryScope === 'all' || rule.scope === (dictionaryScope === 'general' ? 'all' : dictionaryScope))
    && normalize(rule.word + rule.category + (scenarios[rule.scope]?.label || '通用词库')).value.includes(term));
  get('rule-count').textContent = `${rows.length} 条`;
  get('rules-list').replaceChildren(...(rows.length ? rows.map(rule => ruleRow(rule)) : [emptyState('没有匹配规则', '试试其他词条或分类。', 'book')]));
}

function persistDictionary() {
  const saved = storeList('dictionary', custom);
  renderDictionary();
  if (lastText !== null) runScan();
  return saved;
}

function renderHistory() {
  get('clear-history').disabled = !history.length;
  const list = get('history-list');
  list.replaceChildren();
  for (const item of history) {
    const row = element('div', 'rule-row history-row');
    const desc = `${scenarioLabel(item.scenario)} · ${item.total} 处命中 · ${formatter.format(item.when)}`;
    const controls = element('div');
    controls.append(button('打开', 'secondary', () => openHistory(item)), button('删除', 'secondary', () => {
      history = history.filter(entry => entry.id !== item.id);
      if (historyId === item.id) historyId = null;
      if (!storeList('history', history)) notify('浏览器未能写入历史记录。');
      renderHistory();
    }));
    row.append(element('strong', 'history-title', item.text.trim().replace(/\s+/g, ' ')), element('span', 'muted', desc), controls);
    list.append(row);
  }
  if (!history.length) list.append(emptyState('还没有检测记录', '手动检测后的文案会显示在这里。', 'history'));
}

function openHistory(item) {
  switchSource(Object.hasOwn(CijianSources.definitions, item.sourceType) ? item.sourceType : 'text');
  scenario = (Array.isArray(item.scenario) ? item.scenario : [item.scenario])
    .filter(key => key !== 'general' && Object.hasOwn(scenarios, key));
  showingSample = false;
  ignored.clear();
  clearSource();
  historyId = item.id;
  input.value = item.text;
  input.setSelectionRange(0, 0);
  input.scrollTop = 0;
  renderScenarios();
  runScan();
  navigate('check');
}

document.querySelectorAll('[data-icon]').forEach(drawIcon);
document.querySelectorAll('[data-page]').forEach(node => node.addEventListener('click', () => navigate(node.dataset.page)));
window.addEventListener('popstate', route);
window.addEventListener('hashchange', route);
document.querySelectorAll('[data-help]').forEach(node => node.addEventListener('click', () => get('help').showModal()));
get('close-help').addEventListener('click', () => get('help').close());
input.addEventListener('scroll', scrollMirror);
input.addEventListener('input', event => {
  if (!event.isComposing) enforceLength();
  if (sourceRequest) {
    cancelSourceRequest();
    get('scan-label').textContent = '开始检测';
    get('source-progress').textContent = '';
  }
  sourceDrafts[sourceType].pending = false;
  showingSample = false;
  resetResults();
});
input.addEventListener('compositionend', () => { enforceLength(); renderEditor(); });
input.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    beginDetection();
  }
});
get('example').addEventListener('click', loadExample);
get('clear').addEventListener('click', () => {
  clearSource();
  input.value = '';
  showingSample = false;
  resetResults();
  input.focus();
});
get('import').addEventListener('click', () => get('file-input').click());
get('file-input').addEventListener('change', event => {
  importText(event.target.files[0]);
  event.target.value = '';
});
get('scan').addEventListener('click', beginDetection);
get('copy').addEventListener('click', copyText);
get('export').addEventListener('click', exportReport);
get('rule-search').addEventListener('input', renderBuiltIn);
get('word-form').addEventListener('submit', event => {
  event.preventDefault();
  const word = get('custom-word').value.trim();
  const key = normalize(word).value;
  if (!key.trim()) { notify('请输入有效的检测词'); return; }
  if (custom.some(rule => normalize(rule.word).value === key)) { notify('这个自定义词已存在'); return; }
  const suggestion = get('custom-suggestion').value.trim();
  if (suggestion && key === normalize(suggestion).value) { notify('替换建议需要和检测词不同'); return; }
  custom.push({ word, scope: 'custom', level: get('custom-level').value, category: '自定义词', detail: '命中你添加的审核规则。', suggestion });
  const saved = persistDictionary();
  event.target.reset();
  notify(saved ? '已添加自定义词' : '已添加词条，本次会话有效。');
});
get('clear-history').addEventListener('click', () => {
  if (!window.confirm('清空当前浏览器保存的检测历史？')) return;
  history = [];
  historyId = null;
  const saved = storeList('history', history);
  renderHistory();
  notify(saved ? '已清空检测历史' : '浏览器未能写入历史记录。');
});

setupSources();
setupReplacement();
get('catalog-meta').textContent = `${builtIn.length} 条 · 词库整理于 ${catalogDate}`;
renderScenarios();
resetResults();
route();
