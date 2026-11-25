(function (root) {
  'use strict';

  const definitions = {
    text: { label: '查文字', icon: 'edit' },
    image: { label: '查图片', icon: 'image', accept: 'image/png,image/jpeg,image/webp,.bmp', picker: '选择图片', hint: '支持 JPG、PNG、WebP、BMP。首次会联网加载识别模型，图片在浏览器内处理。' },
    video: { label: '查视频', icon: 'video', accept: 'video/mp4,video/webm,video/quicktime,.srt,.vtt', picker: '选择视频或字幕', hint: '检测视频画面文字或字幕文件。输入视频直链需允许跨域读取。视频按间隔抽帧，口播可通过 SRT 或 VTT 字幕检测。' },
    website: { label: '查网址', icon: 'link', accept: '.html,.htm,.txt', picker: '导入网页文件', hint: '可读取允许跨域访问的网页。遇到限制时，导入保存的 HTML 或将网页正文粘贴到下方。' },
    document: { label: '查文档', icon: 'report', accept: '.txt,.docx,.pdf', picker: '选择文档', hint: '支持 TXT、DOCX 与有文字层的 PDF。扫描版可将页面转为图片，在「查图片」识别。' }
  };
  const cdn = 'https://cdn.jsdelivr.net/npm/';
  const ocrScript = `${cdn}tesseract.js@6.0.1/dist/tesseract.min.js`;
  const wordScript = `${cdn}mammoth@1.9.1/mammoth.browser.min.js`;
  const pdfBase = `${cdn}pdfjs-dist@4.10.38/`;
  const assets = new Map();

  function loadScript(url, globalName) {
    if (root[globalName]) return Promise.resolve(root[globalName]);
    if (!assets.has(url)) {
      assets.set(url, new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.crossOrigin = 'anonymous';
        const timeout = setTimeout(fail, 25000);
        function fail() {
          clearTimeout(timeout);
          assets.delete(url);
          script.remove();
          reject(new Error('处理组件加载失败，请检查网络后重试。'));
        }
        script.addEventListener('error', fail, { once: true });
        script.addEventListener('load', () => {
          clearTimeout(timeout);
          if (root[globalName]) resolve(root[globalName]);
          else fail();
        }, { once: true });
        document.head.append(script);
      }));
    }
    return assets.get(url);
  }

  function decodeText(bytes, charset) {
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
    if (charset) {
      try { return new TextDecoder(charset, { fatal: true }).decode(bytes); }
      catch { /* Try the usual Chinese encodings below. */ }
    }
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { return new TextDecoder('gb18030', { fatal: true }).decode(bytes); }
  }

  function cleanOcr(text) {
    return text.replace(/(?<=\p{Script=Han})[ \t]+(?=\p{Script=Han})/gu, '').trim();
  }

  function subtitleText(text) {
    const captions = [];
    for (const block of text.trim().split(/\r?\n[ \t]*\r?\n/)) {
      if (/^(?:WEBVTT|STYLE|REGION|NOTE)(?:\s|$)/i.test(block)) continue;
      const lines = block.split(/\r?\n/);
      const index = lines.findIndex(line => /^\s*\d{1,3}:\d{2}(?::\d{2})?[.,]\d{3}\s+-->/.test(line));
      if (index >= 0) captions.push(lines.slice(index + 1).join('\n').replace(/<[^>]+>/g, '').trim());
    }
    return captions.filter(Boolean).join('\n');
  }

  function webText(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const content = template.content;
    const title = content.querySelector('title')?.textContent.trim();
    content.querySelectorAll('script,style,noscript,iframe,object,embed,template,nav,footer,[hidden],[aria-hidden="true"],title').forEach(node => node.remove());
    const body = content.querySelector('main, article, [role="main"]') || content;
    body.querySelectorAll('br, h1, h2, h3, h4, p, li, blockquote, section, div, tr').forEach(node => node.after('\n'));
    const text = body.textContent.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
    return title && !text.startsWith(title) ? `${title}\n\n${text}`.trim() : text;
  }

  async function readResponse(response, maxBytes) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('没有收到可读取的内容。');
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) throw new Error('来源文件过大，请缩小文件后重试。');
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    return new Blob(chunks, { type: response.headers.get('content-type') || '' });
  }

  async function fetchSource(address, signal, limit) {
    let url;
    try { url = new URL(address); } catch { throw new Error('请输入完整的网址。'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('请输入不含账号密码的 HTTP 或 HTTPS 网址。');
    let response;
    try {
      response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]) });
    } catch (error) {
      if (signal.aborted) throw error;
      throw new Error('当前浏览器无法读取这个链接。可下载源文件后导入。');
    }
    if (!response.ok) throw new Error(`来源服务器返回 ${response.status}，可下载源文件后导入。`);
    return readResponse(response, limit);
  }

  function abortable(operation, signal) {
    return new Promise((resolve, reject) => {
      const abort = () => reject(signal.reason);
      signal.addEventListener('abort', abort, { once: true });
      operation.then(resolve, reject).then(() => signal.removeEventListener('abort', abort));
      if (signal.aborted) abort();
    });
  }

  async function waitForRecognition(operation, signal, errorMessage) {
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(new Error(errorMessage)), 60000);
    try {
      return await abortable(operation, AbortSignal.any([signal, deadline.signal]));
    } finally {
      clearTimeout(timer);
    }
  }

  async function withOcr(report, signal, job) {
    report('正在加载中文文字识别组件…');
    const tesseract = await abortable(loadScript(ocrScript, 'Tesseract'), signal);
    signal.throwIfAborted();
    const failure = new AbortController();
    const workSignal = AbortSignal.any([signal, failure.signal]);
    const initialization = tesseract.createWorker(['chi_sim', 'eng'], 1, {
      workerPath: `${cdn}tesseract.js@6.0.1/dist/worker.min.js`,
      corePath: `${cdn}tesseract.js-core@6.0.0`,
      logger: state => {
        if (state.status === 'loading language traineddata' && !signal.aborted) report(`正在加载识别模型 ${Math.round(state.progress * 100)}%`);
      },
      errorHandler: cause => failure.abort(new Error('文字识别组件运行失败，请检查网络或更换文件后重试。', { cause }))
    });
    let worker;
    try {
      worker = await waitForRecognition(initialization, workSignal, '文字识别模型加载超时，请检查网络后重试。');
    } catch (error) {
      initialization.then(lateWorker => lateWorker.terminate()).catch(() => {});
      throw error;
    }
    const recognize = image => {
      workSignal.throwIfAborted();
      return waitForRecognition(worker.recognize(image), workSignal, '画面识别超时，请改用更清晰或更小的文件。');
    };
    try {
      return await job(recognize);
    } finally {
      await worker.terminate().catch(() => {});
    }
  }

  function mediaEvent(video, name, signal, start) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(failed, 12000);
      function cleanup() {
        clearTimeout(timeout);
        video.removeEventListener(name, done);
        video.removeEventListener('error', failed);
        signal.removeEventListener('abort', aborted);
      }
      function done() { cleanup(); resolve(); }
      function failed() { cleanup(); reject(new Error('无法读取视频，请确认当前浏览器支持文件的编码。')); }
      function aborted() { cleanup(); reject(signal.reason); }
      video.addEventListener(name, done, { once: true });
      video.addEventListener('error', failed, { once: true });
      signal.addEventListener('abort', aborted, { once: true });
      if (signal.aborted) { aborted(); return; }
      start();
    });
  }

  async function videoText(file, report, signal) {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    try {
      await mediaEvent(video, 'loadeddata', signal, () => { video.src = url; });
      if (!Number.isFinite(video.duration) || !video.videoWidth) throw new Error('这个文件没有可读取的视频画面。可导入字幕检测。');
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * ratio);
      canvas.height = Math.round(video.videoHeight * ratio);
      const context = canvas.getContext('2d');
      const samples = Math.min(30, Math.max(1, Math.ceil(video.duration / 2)));
      return await withOcr(report, signal, async recognize => {
        const sections = [];
        let previous = '';
        for (let frame = 0; frame < samples; frame++) {
          signal.throwIfAborted();
          const time = (frame + 0.5) * video.duration / samples;
          if (Math.abs(video.currentTime - time) > 0.005) {
            await mediaEvent(video, 'seeked', signal, () => { video.currentTime = time; });
          }
          report(`正在识别第 ${frame + 1} / ${samples} 个画面`);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const { data } = await recognize(canvas);
          const text = cleanOcr(data.text);
          if (text && text !== previous) {
            const seconds = Math.floor(time);
            const timestamp = [Math.floor(seconds / 60), seconds % 60].map(number => String(number).padStart(2, '0')).join(':');
            sections.push(`[${timestamp}] ${text}`);
          }
          previous = text;
        }
        return sections.join('\n\n');
      });
    } finally {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
    }
  }

  async function pdfText(file, report, signal, limit) {
    const pdf = await abortable(import(`${pdfBase}build/pdf.mjs`), signal);
    pdf.GlobalWorkerOptions.workerSrc = `${pdfBase}build/pdf.worker.mjs`;
    const data = await file.arrayBuffer();
    signal.throwIfAborted();
    const loading = pdf.getDocument({
      data,
      cMapUrl: `${pdfBase}cmaps/`,
      standardFontDataUrl: `${pdfBase}standard_fonts/`,
      isEvalSupported: false,
      useSystemFonts: true
    });
    try {
      const document = await abortable(loading.promise, signal);
      const pages = [];
      let length = 0;
      for (let pageNumber = 1; pageNumber <= Math.min(100, document.numPages) && length <= limit; pageNumber++) {
        signal.throwIfAborted();
        report(`正在读取 PDF 第 ${pageNumber} 页`);
        const page = await abortable(document.getPage(pageNumber), signal);
        const layer = await abortable(page.getTextContent(), signal);
        const text = layer.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : '')).join('').trim();
        if (text) pages.push(text);
        length += text.length;
        page.cleanup();
      }
      if (!pages.length) throw new Error('这个 PDF 暂未读到文字层。扫描件请使用图片检测。');
      return pages.join('\n\n');
    } finally {
      await loading.destroy();
    }
  }

  async function extract(type, { file, url, report, signal, limit }) {
    if (type === 'website') {
      const source = file || await fetchSource(url, signal, 3000000);
      if (source.size > 3000000) throw new Error('网页文件不能超过 3 MB。');
      const bytes = new Uint8Array(await source.arrayBuffer());
      const contentType = source.type || '';
      if (!file && contentType && !/^text\/(html|plain)\b|^application\/xhtml\+xml\b/i.test(contentType)) throw new Error('链接返回的内容不是 HTML 或纯文本。');
      const charset = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType)?.[1]
        || /charset\s*=\s*["']?([\w-]+)/i.exec(new TextDecoder().decode(bytes.subarray(0, 2048)))?.[1];
      return /\.txt$/i.test(file?.name || '') || /^text\/plain/i.test(contentType) ? decodeText(bytes, charset) : webText(decodeText(bytes, charset));
    }
    if (type === 'image') {
      if (file.size > 10000000) throw new Error('图片不能超过 10 MB。');
      return withOcr(report, signal, async recognize => {
        report('正在识别图片文字…');
        const { data } = await recognize(file);
        return cleanOcr(data.text);
      });
    }
    if (type === 'video') {
      if (/\.(srt|vtt)$/i.test(file?.name || '')) {
        if (file.size > 3000000) throw new Error('字幕文件不能超过 3 MB。');
        return subtitleText(decodeText(new Uint8Array(await file.arrayBuffer())));
      }
      const media = file || await fetchSource(url, signal, 100000000);
      if (media.size > 100000000) throw new Error('视频文件不能超过 100 MB。');
      return videoText(media, report, signal);
    }
    if (file.size > 20000000) throw new Error('文档不能超过 20 MB。');
    if (/\.txt$/i.test(file.name)) return decodeText(new Uint8Array(await file.arrayBuffer()));
    report('正在加载文档处理组件…');
    if (/\.docx$/i.test(file.name)) {
      const mammoth = await loadScript(wordScript, 'mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return result.value;
    }
    if (/\.pdf$/i.test(file.name)) return pdfText(file, report, signal, limit);
    throw new Error('请选择 TXT、DOCX 或 PDF 文档。');
  }

  root.CijianSources = { definitions, decodeText, subtitleText, cleanOcr, extract };
})(globalThis);
