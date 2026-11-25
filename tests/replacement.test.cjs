const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const assets = join(__dirname, '..', 'dist');
const read = name => readFileSync(join(assets, name), 'utf8');
const sample = '全网第一，微信。';
const expected = {
  pinyin: ['quan wang di yi', 'wei xin'],
  partial: ['quan网第一', 'wei信'],
  initials: ['qwdy', 'wx'],
  homophone: ['泉网第一', '薇信'],
  first: ['全***', '微*'],
  mask: ['****', '**'],
  emoji: ['🏆', '💬'],
  english: ['number one online', 'WeChat'],
  decorated: ['銓網苐壹', '嶶信'],
  separated: ['全·网·第·一', '微·信']
};

function harness(text = sample) {
  const elements = new Map();
  const radios = [];
  let clipboard = '';
  let scans = 0;
  let cleared = 0;
  let activeElement;

  class Control {
    constructor(tag, className = '') {
      this.tag = tag;
      this.tagName = tag.toUpperCase();
      this.className = className;
      this.children = [];
      this.attributes = {};
      this.handlers = {};
      this.value = '';
      if (tag === 'input') radios.push(this);
    }

    append(...children) {
      for (const child of children.filter(item => typeof item === 'object')) child.parent = this;
      this.children.push(...children.filter(item => typeof item === 'object'));
    }

    replaceChildren(...children) { this.children = []; this.append(...children); }
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
    focus() { activeElement = this; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(event, handler) { this.handlers[event] = handler; }
    click() { if (!this.disabled) return this.handlers.click?.(); }
    change(value) { this.value = value; this.handlers.change({ target: this }); }
    querySelector(query) {
      return query.startsWith('.')
        ? this.children.find(child => child.className.split(' ').includes(query.slice(1)))
        : this.children.flatMap(child => child.children).find(child => child.value === query.match(/"([^"]+)"/)[1]);
    }

    set checked(value) {
      if (value) {
        for (const radio of radios.filter(radio => this.name && radio.name === this.name)) radio.isChecked = false;
      }
      this.isChecked = value;
    }

    get checked() { return this.isChecked; }
  }

  for (const [, tag, id] of read('index.html').matchAll(/<([a-z][\w-]*)[^>]*?\bid="([\w-]+)"/g)) elements.set(id, new Control(tag));
  const get = id => elements.get(id);
  const input = get('text');
  input.value = text;
  const prepare = vm.createContext({
    get, input, scenario: [], custom: [], maxCharacters: 20000, historyId: 'test-entry', showingSample: true, ignored: new Set(),
    element: (tag, className) => new Control(tag, className),
    button: (label, className, handler) => {
      const button = new Control('button', className);
      button.textContent = label;
      button.addEventListener('click', handler);
      return button;
    },
    document: { querySelector: query => radios.find(radio => radio.name === query.match(/"([^"]+)"/)[1] && radio.checked) },
    writeClipboard: async field => { clipboard = field.value; return true; },
    resetResults: () => { cleared++; }, runScan: () => { scans++; }, notify() {}
  });
  for (const file of ['rules.js', 'replacement-data.js', 'replacement.js', 'replacement-ui.js']) vm.runInContext(read(file), prepare, { filename: file });
  vm.runInContext('const { normalize } = Cijian; setupReplacement();', prepare);

  return {
    get, input, engine: prepare.CijianReplacement, open: () => get('open-replacement').click(),
    preview: () => get('replacement-text').value, status: () => get('replacement-status').textContent,
    click: id => get(id).click(), mappings: () => get('replacement-mappings').children,
    selected: name => radios.find(radio => radio.name === name && radio.checked)?.value,
    select: (name, value) => { radios.find(radio => radio.name === name && radio.value === value).checked = true; },
    get clipboard() { return clipboard; }, get scans() { return scans; }, get cleared() { return cleared; },
    get activeElement() { return activeElement; }
  };
}

test('all ten quick formats and all three scopes switch within the same open preview', () => {
  const ui = harness();
  ui.open();
  assert.deepEqual(Object.keys(ui.engine.formats), Object.keys(expected));
  assert.deepEqual(Object.keys(ui.engine.scopes), ['all', 'high', 'sensitive']);
  assert.equal(ui.selected('replacement-format'), 'partial');
  assert.equal(ui.selected('replacement-scope'), 'all');

  for (const [mode, [high, sensitive]] of Object.entries(expected)) {
    ui.select('replacement-format', mode);
    for (const [scope, output] of [
      ['all', `${high}，${sensitive}。`], ['high', `${high}，微信。`], ['sensitive', `全网第一，${sensitive}。`]
    ]) {
      ui.select('replacement-scope', scope);
      ui.click('replacement-run');
      assert.equal(ui.preview(), output, `${mode} / ${scope}`);
      assert.equal(ui.input.value, sample);
    }
  }
});

test('palette changes preserve reversible history and restore the selected format', () => {
  const ui = harness();
  ui.open();
  ui.click('replacement-run');
  const pinyin = ui.preview();
  ui.select('replacement-format', 'mask');
  ui.click('replacement-run');
  const masked = ui.preview();
  assert.equal(masked, '****，**。');
  ui.click('replacement-run');
  assert.match(ui.status(), /已使用此形式/);
  ui.click('replacement-undo');
  assert.equal(ui.preview(), pinyin);
  assert.equal(ui.selected('replacement-format'), 'partial');
  ui.click('replacement-redo');
  assert.equal(ui.preview(), masked);
  assert.equal(ui.selected('replacement-format'), 'mask');
  ui.click('replacement-undo');
  ui.select('replacement-format', 'english');
  ui.click('replacement-run');
  assert.equal(ui.get('replacement-redo').disabled, true);
});

test('all deletion scopes work after masking, and repeated scoped deletion stays cumulative', () => {
  const ui = harness();
  for (const [scope, output] of [['all', '，。'], ['high', '，**。'], ['sensitive', '****，。']]) {
    ui.open();
    ui.select('replacement-format', 'mask');
    ui.click('replacement-run');
    assert.equal(ui.get('replacement-delete').disabled, false);
    ui.get('replacement-delete').change(scope);
    assert.equal(ui.preview(), output);
    assert.equal(ui.get('replacement-delete').value, '');
    ui.click('replacement-undo');
    assert.equal(ui.preview(), '****，**。');
    ui.click('replacement-redo');
    assert.equal(ui.preview(), output);
    ui.click('close-replacement');
  }
  ui.open();
  ui.get('replacement-delete').change('high');
  ui.get('replacement-delete').change('sensitive');
  assert.equal(ui.preview(), '，。');
  assert.equal(ui.get('replacement-delete').disabled, true);
});

test('custom rules can be added, removed, validated, replaced and deleted', () => {
  const ui = harness();
  ui.open();
  ui.click('custom-tab');
  assert.equal(ui.get('quick-replacement').hidden, true);
  ui.click('replacement-run');
  assert.match(ui.get('custom-replacement-feedback').textContent, /填写原词/);
  const first = ui.mappings()[0];
  first.querySelector('.mapping-target').value = '人气款';
  ui.click('replacement-run');
  assert.match(ui.get('custom-replacement-feedback').textContent, /填写要替换的原词/);
  assert.equal(first.querySelector('.mapping-word').attributes['aria-invalid'], 'true');
  first.querySelector('.mapping-word').value = '全网第一';
  ui.click('replacement-add');
  const second = ui.mappings()[1];
  assert.equal(ui.activeElement, second.querySelector('.mapping-word'));
  second.querySelector('.mapping-word').value = '全网第一';
  ui.click('replacement-run');
  assert.match(ui.get('custom-replacement-feedback').textContent, /有多条/);
  second.querySelector('.mapping-remove').click();
  assert.equal(ui.mappings().length, 1);
  ui.click('replacement-add');
  ui.mappings()[1].querySelector('.mapping-word').value = '微信';
  ui.click('replacement-run');
  assert.equal(ui.preview(), '人气款，。');
  ui.click('quick-tab');
  ui.select('replacement-format', 'mask');
  ui.click('replacement-run');
  assert.equal(ui.preview(), '人气款，。');
});

test('custom selection can find the original term after symbol separation', () => {
  const ui = harness();
  ui.open();
  ui.select('replacement-format', 'separated');
  ui.click('replacement-run');
  assert.equal(ui.preview(), '全·网·第·一，微·信。');
  ui.click('custom-tab');
  ui.click('replacement-picker-toggle');
  assert.equal(ui.get('replacement-picker').hidden, false);
  const search = ui.get('replacement-picker-search');
  assert.equal(ui.activeElement, search);
  search.value = '全·网';
  search.handlers.input();
  const terms = ui.get('replacement-picker-terms');
  assert.deepEqual(terms.children.map(choice => choice.textContent), ['全网第一']);
  terms.children[0].click();
  assert.equal(ui.get('replacement-picker').hidden, true);
  const [row] = ui.mappings();
  assert.equal(row.querySelector('.mapping-word').value, '全网第一');
  const target = row.querySelector('.mapping-target');
  assert.equal(ui.activeElement, target);
  target.value = '人气款';
  const mappings = ui.get('replacement-mappings');
  mappings.handlers.keydown({ key: 'Enter', isComposing: true, target });
  assert.equal(ui.preview(), '全·网·第·一，微·信。');
  mappings.handlers.keydown({ key: 'Enter', target, preventDefault() {} });
  assert.equal(ui.preview(), '人气款，微·信。');
  ui.click('replacement-undo');
  assert.equal(ui.preview(), '全·网·第·一，微·信。');
  ui.click('replacement-redo');
  assert.equal(ui.preview(), '人气款，微·信。');
  ui.get('replacement-delete').change('sensitive');
  assert.equal(ui.preview(), '人气款，。');
});

test('custom replacements affect only the selected original when outputs look alike', () => {
  const ui = harness('第一与全网第一，微信。🏆');
  ui.open();
  ui.select('replacement-format', 'emoji');
  ui.click('replacement-run');
  assert.equal(ui.preview(), '🏆与🏆，💬。🏆');
  ui.click('custom-tab');
  const [row] = ui.mappings();
  row.querySelector('.mapping-word').value = '全网第一';
  row.querySelector('.mapping-target').value = '人气款';
  ui.click('replacement-run');
  assert.equal(ui.preview(), '🏆与人气款，💬。🏆');
  ui.click('replacement-add');
  ui.mappings()[1].querySelector('.mapping-word').value = '微信';
  ui.click('replacement-run');
  assert.equal(ui.preview(), '🏆与人气款，。🏆');
  assert.match(ui.status(), /1 条规则未产生改动/);
});

test('custom picker escapes back to its trigger and same-value edits stay unchanged', () => {
  const ui = harness();
  ui.open();
  ui.click('custom-tab');
  const [row] = ui.mappings();
  row.querySelector('.mapping-word').value = '微信';
  row.querySelector('.mapping-target').value = '微信';
  ui.click('replacement-run');
  assert.equal(ui.preview(), sample);
  assert.match(ui.get('custom-replacement-feedback').textContent, /与原词相同/);
  ui.click('replacement-picker-toggle');
  const picker = ui.get('replacement-picker');
  let stopped = false;
  picker.handlers.keydown({ key: 'Escape', preventDefault() {}, stopPropagation() { stopped = true; } });
  assert.equal(stopped, true);
  assert.equal(picker.hidden, true);
  assert.equal(ui.activeElement, ui.get('replacement-picker-toggle'));
  assert.equal(ui.get('replacement-dialog').open, true);
});

test('a previously transformed term can be restored without changing other terms', () => {
  const ui = harness();
  ui.open();
  ui.select('replacement-format', 'mask');
  ui.click('replacement-run');
  ui.click('custom-tab');
  const [row] = ui.mappings();
  row.querySelector('.mapping-word').value = '微信';
  row.querySelector('.mapping-target').value = '微信';
  ui.click('replacement-run');
  assert.equal(ui.preview(), '****，微信。');
  assert.equal(ui.get('custom-replacement-feedback').textContent, '');
});

test('copy, close without applying, reopen, and apply with recheck', async () => {
  const ui = harness();
  ui.open();
  assert.equal(ui.get('replacement-apply').disabled, true);
  ui.click('replacement-run');
  await ui.click('replacement-copy');
  assert.equal(ui.clipboard, ui.preview());
  ui.click('close-replacement');
  assert.equal(ui.get('replacement-dialog').open, false);
  assert.equal(ui.input.value, sample);
  ui.open();
  assert.equal(ui.preview(), sample);
  ui.click('replacement-run');
  const output = ui.preview();
  ui.click('replacement-apply');
  assert.equal(ui.input.value, output);
  assert.equal(ui.get('replacement-dialog').open, false);
  assert.equal(ui.scans, 1);
  const empty = harness('微信');
  empty.open();
  empty.get('replacement-delete').change('all');
  assert.equal(empty.get('replacement-copy').disabled, true);
  empty.click('replacement-apply');
  assert.equal(empty.input.value, '');
  assert.equal(empty.cleared, 1);
});

test('missing formats and a too-long preview stay recoverable', () => {
  const ui = harness('临床有效率');
  ui.open();
  ui.select('replacement-format', 'english');
  ui.click('replacement-run');
  assert.equal(ui.preview(), '临床有效率');

  const singleScope = harness('全网第一');
  singleScope.open();
  singleScope.click('replacement-run');
  singleScope.select('replacement-scope', 'sensitive');
  singleScope.click('replacement-run');
  assert.equal(singleScope.preview(), '全网第一');
  assert.equal(singleScope.get('replacement-apply').disabled, true);
  assert.match(ui.status(), /暂无对应的替换形式/);
  ui.select('replacement-format', 'mask');
  ui.click('replacement-run');
  assert.equal(ui.preview(), '*****');
  ui.select('replacement-format', 'english');
  ui.click('replacement-run');
  assert.equal(ui.preview(), '临床有效率');

  const long = harness('微信'.repeat(10000));
  long.open();
  long.select('replacement-format', 'pinyin');
  long.click('replacement-run');
  assert.match(long.status(), /超过/);
  assert.equal(long.preview(), long.input.value);
  long.select('replacement-format', 'mask');
  long.click('replacement-run');
  assert.equal(long.preview(), '**'.repeat(10000));
});

test('copy fallback uses the selected preview when clipboard access fails', async () => {
  const source = read('app.js');
  const copyFunction = source.slice(source.indexOf('async function writeClipboard('), source.indexOf('async function copyText('));
  const previous = { focus() { document.activeElement = this; } };
  const field = {
    value: '待复制预览', selectionStart: 1, selectionEnd: 2,
    focus() { document.activeElement = this; },
    select() { this.setSelectionRange(0, this.value.length); },
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  };
  let permit = true;
  const document = {
    activeElement: previous,
    execCommand(action) {
      assert.equal(action, 'copy');
      assert.equal(this.activeElement, field);
      assert.equal(field.selectionStart, 0);
      assert.equal(field.selectionEnd, field.value.length);
      return permit;
    }
  };
  const context = vm.createContext({ document, navigator: { clipboard: { async writeText() { throw new Error('Clipboard blocked'); } } } });
  vm.runInContext(copyFunction, context);
  assert.equal(await context.writeClipboard(field), true);
  assert.equal(document.activeElement, previous);
  assert.deepEqual([field.selectionStart, field.selectionEnd], [1, 2]);
  permit = false;
  assert.equal(await context.writeClipboard(field), false);
  assert.equal(document.activeElement, field);
  assert.deepEqual([field.selectionStart, field.selectionEnd], [0, field.value.length]);
});
