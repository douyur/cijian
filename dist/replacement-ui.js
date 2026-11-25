'use strict';

function setupReplacement() {
  const engine = globalThis.CijianReplacement;
  const dialog = get('replacement-dialog');
  const preview = get('replacement-text');
  const status = get('replacement-status');
  const mappings = get('replacement-mappings');
  const picker = get('replacement-picker');
  const pickerToggle = get('replacement-picker-toggle');
  const pickerSearch = get('replacement-picker-search');
  const customFeedback = get('custom-replacement-feedback');
  const defaultFormat = { scope: 'all', mode: 'partial' };
  let currentMode = 'quick';
  let revisions = [];
  let revisionIndex = 0;

  function radioGroup(container, name, choices, initial) {
    for (const [value, label] of Object.entries(choices)) {
      const item = element('label', 'replacement-option');
      const radio = element('input');
      radio.type = 'radio';
      radio.name = name;
      radio.value = value;
      radio.checked = value === initial;
      item.append(radio, label);
      get(container).append(item);
    }
  }

  function currentRevision() {
    return revisions[revisionIndex];
  }

  function selectFormat({ scope, mode }) {
    get('replacement-scope').querySelector(`[value="${scope}"]`).checked = true;
    get('replacement-formats').querySelector(`[value="${mode}"]`).checked = true;
  }

  function updateRunButton() {
    const revision = currentRevision();
    get('replacement-run').disabled = !(currentMode === 'quick' ? revision.base : revision.text);
  }

  function renderRevision(message = '') {
    const revision = currentRevision();
    preview.value = revision.text;
    get('replacement-undo').disabled = revisionIndex === 0;
    get('replacement-redo').disabled = revisionIndex === revisions.length - 1;
    get('replacement-copy').disabled = !preview.value;
    get('replacement-apply').disabled = preview.value === input.value;
    get('replacement-delete').disabled = !engine.systemHits(revision.base, scenario, 'all', revision.baseAliases).length;
    updateRunButton();
    status.textContent = message || `当前文案 ${[...preview.value].length.toLocaleString('zh-CN')} 字`;
    if (!picker.hidden) renderPicker();
  }

  function switchMode(mode) {
    currentMode = mode;
    for (const option of ['quick', 'custom']) {
      const active = mode === option;
      get(`${option}-tab`).setAttribute('aria-pressed', String(active));
      get(`${option}-replacement`).hidden = !active;
    }
    if (mode !== 'custom') togglePicker(false);
    updateRunButton();
  }

  function addMapping(word = '', replacement = '', focus = true) {
    if (mappings.children.length >= 30) return;
    const row = element('div', 'replacement-mapping');
    const original = element('input', 'mapping-word');
    original.setAttribute('aria-label', '原词');
    original.placeholder = '输入原词';
    original.maxLength = 120;
    original.value = word;
    const target = element('input', 'mapping-target');
    target.setAttribute('aria-label', '替换为');
    target.placeholder = '留空即删除';
    target.maxLength = 240;
    target.value = replacement;
    const remove = button('', 'secondary mapping-remove', () => {
      row.remove();
      customFeedback.textContent = '';
      get('replacement-add').disabled = false;
      if (!mappings.children.length) addMapping();
      else get('replacement-add').focus();
    }, 'trash');
    remove.setAttribute('aria-label', '移除此条替换规则');
    row.append(original, target, remove);
    mappings.append(row);
    get('replacement-add').disabled = mappings.children.length >= 30;
    if (focus) original.focus();
    return row;
  }

  function reportCustomIssue(message, field) {
    customFeedback.textContent = message;
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
    return null;
  }

  function chooseTerm(word) {
    const rows = [...mappings.children];
    const existing = rows.find(row => row.querySelector('.mapping-word').value === word);
    const unused = rows.find(row => !row.querySelector('.mapping-word').value && !row.querySelector('.mapping-target').value);
    const row = existing ?? unused ?? addMapping(word, '', false);
    if (!row) {
      reportCustomIssue('已添加 30 条规则。移除一条后即可继续添加。');
      return;
    }
    const field = row.querySelector('.mapping-word');
    field.value = word;
    field.setAttribute('aria-invalid', 'false');
    customFeedback.textContent = '';
    togglePicker(false);
    row.querySelector('.mapping-target').focus();
  }

  function renderPicker() {
    const revision = currentRevision();
    const terms = new Map();
    for (const hit of engine.previewHits(revision.text, scenario, revision.aliases, custom)) {
      if (terms.has(hit.matched)) continue;
      terms.set(hit.matched, revision.text.slice(hit.start, hit.end));
    }
    const query = normalize(pickerSearch.value.trim()).value;
    const matches = [...terms].filter(([word, display]) => normalize(word).value.includes(query) || normalize(display).value.includes(query));
    get('replacement-picker-terms').replaceChildren(...matches.slice(0, 24).map(([word, display]) => {
      const choice = button(word, 'secondary replacement-term-choice', () => chooseTerm(word));
      if (word !== display) choice.title = `预览中为 ${display}`;
      return choice;
    }));
    get('replacement-picker-count').textContent = matches.length > 24 ? `匹配 ${matches.length} 个词，显示前 24 个。`
      : matches.length ? '' : query ? '没有匹配的命中词。' : '预览里没有检测到命中词，可直接输入原词。';
  }

  function togglePicker(open) {
    picker.hidden = !open;
    pickerToggle.setAttribute('aria-expanded', String(open));
    if (open) {
      pickerSearch.value = '';
      renderPicker();
      pickerSearch.focus();
    }
  }

  function customPairs(revision) {
    const terms = new Set();
    const pairs = [];
    for (const row of mappings.children) {
      const originalField = row.querySelector('.mapping-word');
      const replacementField = row.querySelector('.mapping-target');
      const original = originalField.value;
      const replacement = replacementField.value;
      originalField.setAttribute('aria-invalid', 'false');
      replacementField.setAttribute('aria-invalid', 'false');
      if (!original && !replacement) continue;
      if (!original.trim()) return reportCustomIssue('请填写要替换的原词。', originalField);
      if (terms.has(original)) return reportCustomIssue(`「${original}」有多条替换规则，请保留一条。`, originalField);
      if (original === replacement && !revision.aliases.some(alias =>
        (alias.word === original || alias.matched === original) && revision.text.slice(alias.start, alias.end) !== original
      )) return reportCustomIssue('替换文字与原词相同。', replacementField);
      terms.add(original);
      pairs.push([original, replacement]);
    }
    if (!pairs.length) return reportCustomIssue('请先填写原词，或从命中词中选择。', mappings.children[0]?.querySelector('.mapping-word'));
    return pairs;
  }

  function savePreview(revision, message) {
    if ([...revision.text].length > maxCharacters) {
      status.textContent = `处理后的文案超过 ${maxCharacters.toLocaleString('zh-CN')} 字，请缩小替换范围。`;
      return;
    }
    revisions = [...revisions.slice(0, revisionIndex + 1), revision].slice(-40);
    revisionIndex = revisions.length - 1;
    renderRevision(message);
  }

  function runQuickReplacement() {
    const revision = currentRevision();
    const scope = document.querySelector('[name="replacement-scope"]:checked').value;
    const mode = document.querySelector('[name="replacement-format"]:checked').value;
    const result = engine.quick(revision.base, scenario, scope, mode, revision.baseAliases);
    const skipped = result.skipped ? `，${result.skipped} 处保留原文` : '';
    if (result.text === revision.text) {
      status.textContent = result.changed
        ? `预览已使用此形式${skipped}。`
        : result.skipped ? `这 ${result.skipped} 处暂无对应的替换形式。` : '所选范围没有命中词。';
      return;
    }
    const message = result.changed
      ? `已替换 ${result.changed} 处${skipped}。`
      : '所选范围或形式没有可替换的命中，预览已恢复原文。';
    savePreview({ ...revision, text: result.text, aliases: result.aliases, format: result.changed ? { scope, mode } : null }, message);
  }

  function runCustomReplacement() {
    customFeedback.textContent = '';
    const revision = currentRevision();
    const pairs = customPairs(revision);
    if (!pairs) return;
    const result = engine.literal(revision.text, pairs, revision.aliases);
    if (result.changed) {
      const unused = pairs.length - result.appliedTerms.size;
      const summary = unused ? `，${unused} 条规则未产生改动` : '';
      savePreview({ text: result.text, base: result.text, aliases: result.aliases, baseAliases: result.aliases, format: null }, `已替换 ${result.changed} 处${summary}。`);
    } else {
      reportCustomIssue('当前预览里没有找到可替换的原词。');
    }
  }

  function deleteMatches(scope) {
    const revision = currentRevision();
    const result = engine.quick(revision.base, scenario, scope, 'delete', revision.baseAliases);
    if (!result.changed) {
      status.textContent = '所选范围没有可删除的命中词。';
      return;
    }
    const format = revision.format;
    const next = format ? engine.quick(result.text, scenario, format.scope, format.mode, result.aliases) : result;
    savePreview({ text: next.text, base: result.text, aliases: next.aliases, baseAliases: result.aliases, format }, `已删除 ${result.changed} 处。`);
  }

  function restoreRevision(index, message) {
    revisionIndex = index;
    selectFormat(currentRevision().format || defaultFormat);
    renderRevision(message);
  }

  function open() {
    revisions = [{ text: input.value, base: input.value, aliases: [], baseAliases: [], format: null }];
    revisionIndex = 0;
    customFeedback.textContent = '';
    selectFormat(defaultFormat);
    mappings.replaceChildren();
    addMapping('', '', false);
    switchMode('quick');
    renderRevision();
    dialog.showModal();
  }

  radioGroup('replacement-scope', 'replacement-scope', engine.scopes, defaultFormat.scope);
  radioGroup('replacement-formats', 'replacement-format', engine.formats, defaultFormat.mode);
  get('open-replacement').addEventListener('click', open);
  get('close-replacement').addEventListener('click', () => dialog.close());
  get('quick-tab').addEventListener('click', () => switchMode('quick'));
  get('custom-tab').addEventListener('click', () => switchMode('custom'));
  get('replacement-add').addEventListener('click', () => addMapping());
  pickerToggle.addEventListener('click', () => togglePicker(picker.hidden));
  pickerSearch.addEventListener('input', renderPicker);
  picker.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    togglePicker(false);
    pickerToggle.focus();
  });
  mappings.addEventListener('input', event => {
    event.target.setAttribute('aria-invalid', 'false');
    customFeedback.textContent = '';
  });
  mappings.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing || event.target.tagName !== 'INPUT') return;
    event.preventDefault();
    get('replacement-run').click();
  });
  get('replacement-run').addEventListener('click', () => {
    try {
      if (currentMode === 'custom') runCustomReplacement();
      else runQuickReplacement();
    } catch (error) {
      if (currentMode === 'custom') reportCustomIssue(error.message);
      else status.textContent = error.message;
    }
  });
  get('replacement-delete').addEventListener('change', event => {
    const scope = event.target.value;
    if (!scope) return;
    event.target.value = '';
    deleteMatches(scope);
  });
  get('replacement-undo').addEventListener('click', () => {
    if (revisionIndex > 0) restoreRevision(revisionIndex - 1, '已撤销上一步。');
  });
  get('replacement-redo').addEventListener('click', () => {
    if (revisionIndex < revisions.length - 1) restoreRevision(revisionIndex + 1, '已重做上一步。');
  });
  get('replacement-copy').addEventListener('click', async () => {
    const revision = currentRevision();
    const copied = await writeClipboard(preview);
    if (!dialog.open || currentRevision() !== revision) return;
    status.textContent = copied ? '已复制预览文案。' : '已选中文案，可使用系统复制快捷键。';
  });
  get('replacement-apply').addEventListener('click', () => {
    input.value = preview.value;
    showingSample = false;
    ignored.clear();
    if (input.value.trim()) runScan({ record: Boolean(historyId), preserveFilter: true });
    else resetResults();
    dialog.close();
    notify(input.value.trim() ? '已应用替换并重新检测' : '已应用替换，当前文案已清空');
  });
}
