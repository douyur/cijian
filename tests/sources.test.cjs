const assert = require('node:assert/strict');
const test = require('node:test');

require('../dist/rules.js');
require('../dist/sources.js');

const { detect } = globalThis.Cijian;
const { extract } = globalThis.CijianSources;

function checkSource(type, options) {
  return extract(type, {
    signal: new AbortController().signal,
    limit: 20000,
    report() {},
    ...options
  });
}

test('text detection and UTF-8/UTF-16 TXT extraction', async () => {
  assert.deepEqual(detect('第一与微信', []).map(hit => hit.word), ['第一', '微信']);
  for (const file of [
    new File(['保证有效'], 'draft.txt'),
    new File([Buffer.from('\ufeff保证有效', 'utf16le')], 'draft.txt')
  ]) {
    const text = await checkSource('document', { file });
    assert.equal(text, '保证有效');
    assert.equal(detect(text, [])[0].word, '保证有效');
  }
});

test('SRT and VTT files lead to the same detector', async () => {
  for (const [name, data] of [
    ['clip.srt', '1\n00:00:01,000 --> 00:00:02,000\n第一'],
    ['clip.vtt', 'WEBVTT\n\nNOTE Ignore this\n\n00:01.000 --> 00:02.000\n<b>第一</b>']
  ]) {
    const text = await checkSource('video', { file: new File([data], name) });
    assert.equal(text, '第一');
    assert.equal(detect(text, [])[0].word, '第一');
  }
});

test('website extraction handles a readable response, status errors, and a local TXT fallback', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    if (url.pathname === '/blocked') return new Response('', { status: 403 });
    return new Response('全网第一', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  });
  assert.equal(await checkSource('website', { url: 'https://example.test/public' }), '全网第一');
  await assert.rejects(checkSource('website', { url: 'https://example.test/blocked' }), /403/);
  await assert.rejects(checkSource('website', { url: 'file:///draft.txt' }), /HTTP/);
  assert.equal(fetch.mock.callCount(), 2);
  assert.equal(await checkSource('website', { file: new File(['限时特惠'], 'page.txt') }), '限时特惠');
});

test('image extraction passes the file through OCR, normalizes text, and releases the worker', async t => {
  const input = new File(['fake image'], 'poster.png', { type: 'image/png' });
  const recognize = t.mock.fn(async file => {
    assert.equal(file, input);
    return { data: { text: '  全 网 第 一  ' } };
  });
  const terminate = t.mock.fn(async () => {});
  const worker = async languages => {
    assert.deepEqual(languages, ['chi_sim', 'eng']);
    return { recognize, terminate };
  };
  Object.defineProperty(globalThis, 'Tesseract', { value: { createWorker: worker }, configurable: true });
  t.after(() => delete globalThis.Tesseract);
  const text = await checkSource('image', { file: input });
  assert.equal(detect(text, [])[0].word, '全网第一');
  assert.equal(terminate.mock.callCount(), 1);
});

test('OCR startup failure stops the request even when the library leaves its promise pending', async t => {
  const createWorker = (_languages, _mode, { errorHandler }) => {
    queueMicrotask(() => errorHandler(new Error('model could not be downloaded')));
    return new Promise(() => {});
  };
  Object.defineProperty(globalThis, 'Tesseract', { value: { createWorker }, configurable: true });
  t.after(() => delete globalThis.Tesseract);
  await assert.rejects(checkSource('image', { file: new File(['fake image'], 'poster.png') }), /识别组件运行失败/);
});

test('cancelling recognition rejects the request and stops a worker that starts late', async t => {
  const terminate = t.mock.fn(async () => {});
  const { promise: ready, resolve: workerStarted } = Promise.withResolvers();
  const { promise: called, resolve: showAttempt } = Promise.withResolvers();
  const createWorker = () => { showAttempt(); return ready; };
  Object.defineProperty(globalThis, 'Tesseract', { value: { createWorker }, configurable: true });
  t.after(() => delete globalThis.Tesseract);
  const cancel = new AbortController();
  const extraction = checkSource('image', { file: new File(['fake image'], 'poster.png'), signal: cancel.signal });
  await called;
  cancel.abort();
  await assert.rejects(extraction, { name: 'AbortError' });
  workerStarted({ terminate });
  await Promise.resolve();
  assert.equal(terminate.mock.callCount(), 1);
});

test('video frame flow skips adjacent duplicate OCR text and closes the media and OCR handles', async t => {
  class Video extends EventTarget {
    duration = 5;
    videoWidth = 1600;
    videoHeight = 900;
    time = 0;
    reset = false;

    set src(_value) { queueMicrotask(() => this.dispatchEvent(new Event('loadeddata'))); }
    get currentTime() { return this.time; }
    set currentTime(value) {
      this.time = value;
      queueMicrotask(() => this.dispatchEvent(new Event('seeked')));
    }
    removeAttribute() {}
    load() { this.reset = true; }
  }
  const video = new Video();
  const drawImage = t.mock.fn();
  const canvas = { getContext: () => ({ drawImage }) };
  const frames = ['保 证 有 效', '保 证 有 效', '微 信'];
  const terminate = t.mock.fn(async () => {});
  const recognize = t.mock.fn(async () => ({ data: { text: frames.shift() } }));
  globalThis.document = { createElement: tag => tag === 'video' ? video : canvas };
  globalThis.Tesseract = { createWorker: async () => ({ recognize, terminate }) };
  t.after(() => { delete globalThis.document; delete globalThis.Tesseract; });
  const text = await checkSource('video', { file: new File(['fake video'], 'clip.mp4') });
  assert.equal(text, '[00:00] 保证有效\n\n[00:04] 微信');
  assert.equal(canvas.width, 1280);
  assert.equal(drawImage.mock.callCount(), 3);
  assert.equal(terminate.mock.callCount(), 1);
  assert.equal(video.reset, true);
});

test('DOCX extraction receives data and rejects unsupported formats', async t => {
  globalThis.mammoth = {
    async extractRawText({ arrayBuffer }) {
      assert.equal(new TextDecoder().decode(arrayBuffer), 'test document bytes');
      return { value: '保证有效' };
    }
  };
  t.after(() => delete globalThis.mammoth);
  assert.equal(await checkSource('document', { file: new File(['test document bytes'], 'draft.docx') }), '保证有效');
  await assert.rejects(checkSource('document', { file: new File(['legacy'], 'draft.doc') }), /TXT、DOCX 或 PDF/);
});
