(function (root) {
  'use strict';

  const scopes = { all: '所有违禁词', high: '禁用词', sensitive: '敏感词' };
  const formats = {
    pinyin: '拼音', partial: '部分拼音', initials: '拼音缩写', homophone: '同音字',
    first: '首字加星号', mask: '全星号', emoji: 'Emoji 表情', english: '英文',
    decorated: '火星文', separated: '符号分割'
  };
  const { pinyin, traditional } = root.CijianReplacementData;
  const preferred = {
    '全': '泉', '网': '往', '最': '醉', '优': '悠', '首': '手', '保': '宝', '证': '正', '绝': '决',
    '加': '家', '微': '薇', '信': '芯', '限': '线', '独': '读', '很': '狠', '零': '灵', '无': '吾',
    '安': '氨', '顶': '鼎', '国': '帼', '好': '郝', '返': '反', '现': '线', '转': '啭', '评': '平',
    '治': '智', '快': '块', '疗': '聊', '包': '苞', '售': '受', '效': '笑', '价': '架', '强': '墙',
    '虚': '需', '权': '泉', '免': '勉', '洗': '禧', '赞': '暂', '钱': '前',
    '红': '鸿', '调': '条', '消': '萧', '党': '挡', '降': '酱', '原': '元', '超': '抄', '史': '使'
  };
  const stylized = { '全': '銓', '第': '苐', '一': '壹', '我': '莪', '最': '嘬', '好': '恏', '用': '甪', '微': '嶶', '有': '宥', '加': '迦', '发': '髮', '点': '嚸', '红': '葒', '上': '丄', '下': '丅', '不': '吥', '大': '夶', '人': '亻' };
  const english = {
    '第一': 'number one', '第1': 'number one', '第壹': 'number one', '最': 'most', '最好': 'best', '最强': 'strongest', '顶级': 'top-tier', '唯一': 'only one', '领先': 'leading', '首创': 'first of its kind', '微信': 'WeChat', '微信号': 'WeChat ID', '微信群': 'WeChat group', '微 信': 'WeChat', '企业微信': 'WeCom', '私信': 'direct message', '二维码': 'QR code', '根治': 'complete cure', '无副作用': 'no side effects', '抗癌': 'anti-cancer', '治疗': 'treatment', '纯天然': 'all natural', '零添加': 'no additives', '稳赚': 'guaranteed profit', '保本': 'principal protected', '免费': 'free', '限时': 'limited-time', '限量': 'limited quantity', '原价': 'original price', '包邮': 'free shipping', '返现': 'cashback',
    '全网第一': 'number one online', '全网第1': 'number one online', '全国第一': 'number one nationwide', '全球第一': 'world number one', '行业第一': 'industry number one', '业内第一': 'industry number one', '销量第一': 'best-selling', '销量冠军': 'sales leader', '世界第一': 'world number one', '市场第一': 'market leader', '市占率第一': 'highest market share', '排名第一': 'ranked first', '国家级': 'national-level', '最高级': 'highest grade', '世界级': 'world-class', '顶级品牌': 'top-tier brand', '顶级产品': 'top-tier product', '史上最强': 'strongest ever', '行业唯一': 'only one in its industry', '全球唯一': 'the only one worldwide', '全网唯一': 'the only one online', '绝无仅有': 'unique', '前所未有': 'unprecedented', '全网最低价': 'lowest price online', '史上最低价': 'lowest price ever', '全网最便宜': 'cheapest online', '最高品质': 'highest quality', '无与伦比': 'unparalleled', '史无前例': 'unprecedented', '最佳': 'best', '最佳选择': 'best choice', '最高标准': 'highest standard',
    '保证有效': 'guaranteed effective', '保证见效': 'guaranteed results', '百分百有效': '100% effective', '100%有效': '100% effective', '效果立竿见影': 'immediate results', '永久有效': 'permanently effective', '无效退款': 'money-back guarantee', '永不反弹': 'no rebound', '包治百病': 'cures all illnesses', '绝对安全': 'absolutely safe', '完全无害': 'completely harmless', '零风险': 'zero risk', '零副作用': 'no side effects', '没有任何副作用': 'no side effects', '100%安全': '100% safe', '稳赚不赔': 'guaranteed profit', '保本保收益': 'principal and returns guaranteed', '保本保息': 'principal and interest guaranteed', '无风险高收益': 'high return with no risk', '保证高回报': 'guaranteed high return',
    '独家配方': 'exclusive formula', '专利配方': 'patented formula', '权威认证': 'authoritative certification', '专家推荐': 'expert recommended', '官方指定': 'officially designated', '官方认证': 'officially certified', '国际认证': 'internationally certified', '临床验证': 'clinically validated', '明星同款': 'celebrity style', '加微信': 'connect on WeChat', '加我微信': 'add me on WeChat', '微信转账': 'WeChat transfer', '私下交易': 'off-platform transaction', '线下转账': 'offline transfer', '快速减肥': 'rapid weight loss', '快速瘦身': 'rapid slimming', '治疗失眠': 'treats insomnia', '降血压': 'lowers blood pressure', '降血糖': 'lowers blood sugar', '增强免疫力': 'boosts immunity', '限时特惠': 'limited-time offer', '限量抢购': 'limited stock sale', '即将涨价': 'price increase soon', '仅限今天': 'today only', '卖完即止': 'while stocks last', '买一送一': 'buy one get one free', '免费试用': 'free trial', '免费领取': 'claim for free', '好评返现': 'cashback for positive reviews', '好评免单': 'free order for a positive review', '拍下返现': 'cashback upon ordering', '零元购': 'zero-cost purchase', '赔本清仓': 'clearance at a loss', '转发领红包': 'share to claim a reward', '点击即中奖': 'click to win'
  };
  const emojis = {
    '排名与领先': '🏆', '绝对化用语': '⭐', '效果承诺': '✨', '安全承诺': '🛡️', '收益承诺': '💰',
    '资质与宣传依据': '📜', '外部引导': '💬', '医疗与功效': '🩺', '促销用语': '🎁', '广告与营销引导': '🎁',
    '直播与交易引导': '🎥', '种草与互动': '❤️', '种草夸大宣传': '⭐', '交易与售后': '🛍️', '价格比较': '🏷️', '视频号互动与交易': '🎁', '成分与品质': '🧪', '受限品类': '⚠️'
  };
  const fallbackReadings = new Map();
  for (const [character, reading] of Object.entries(pinyin)) {
    if (!fallbackReadings.has(reading)) fallbackReadings.set(reading, []);
    fallbackReadings.get(reading).push(character);
  }

  function syllables(word) {
    const characters = [...word];
    return characters.map((character, index) => {
      if (character === '行' && characters[index + 1] === '业') return 'hang';
      if (character === '便' && characters[index + 1] === '宜') return 'pian';
      return pinyin[character] || character;
    });
  }

  function phoneticVariant(word) {
    const characters = [...word];
    const index = characters.findIndex(character => Object.hasOwn(preferred, character));
    if (index >= 0) {
      characters[index] = preferred[characters[index]];
      return characters.join('');
    }
    for (const [index, character] of characters.entries()) {
      const replacement = fallbackReadings.get(pinyin[character])?.find(candidate => candidate !== character);
      if (!replacement) continue;
      characters[index] = replacement;
      return characters.join('');
    }
    return word;
  }

  function phoneticText(word, mode) {
    const characters = [...word];
    const readings = syllables(word);
    if (mode === 'partial') {
      const index = characters.findIndex(character => Object.hasOwn(pinyin, character));
      if (index >= 0) characters[index] = readings[index];
      return characters.join('');
    }
    if (mode === 'initials') return readings.map(reading => reading[0]).join('').toLowerCase();
    return readings.reduce((output, reading, index) => {
      const spacing = index > 0 && (Object.hasOwn(pinyin, characters[index]) || Object.hasOwn(pinyin, characters[index - 1]));
      return output + (spacing ? ' ' : '') + reading;
    }, '');
  }

  function convert(hit, mode) {
    const characters = [...hit.word];
    switch (mode) {
      case 'delete': return '';
      case 'pinyin':
      case 'partial':
      case 'initials': return phoneticText(hit.word, mode);
      case 'homophone': return phoneticVariant(hit.word);
      case 'first': return characters.length === 1 ? '*' : characters[0] + '*'.repeat(characters.length - 1);
      case 'mask': return '*'.repeat(characters.length);
      case 'emoji': return emojis[hit.category] ?? null;
      case 'english': return english[hit.word] ?? null;
      case 'decorated': {
        const variant = characters.map(character => stylized[character] || traditional[character] || character).join('');
        return variant === hit.word ? phoneticVariant(variant) : variant;
      }
      case 'separated': return characters.length > 1 ? characters.join('·') : null;
      default: throw new RangeError('Unknown replacement format');
    }
  }

  function previewHits(text, scenario, aliases = [], custom = []) {
    let index = 0;
    const hits = root.Cijian.detect(text, scenario, custom).filter(hit => {
      while (index < aliases.length && aliases[index].end <= hit.start) index++;
      return index === aliases.length || aliases[index].start >= hit.end;
    });
    return [...hits, ...aliases].sort((left, right) => left.start - right.start);
  }

  function systemHits(text, scenario, scope = 'all', aliases = []) {
    return previewHits(text, scenario, aliases).filter(hit => scope === 'all' || (scope === 'high' ? hit.level === 'high' : hit.level !== 'high'));
  }

  function applyEdits(text, edits, aliases) {
    let offset = 0;
    let shift = 0;
    const pieces = [];
    const applied = [];
    const updatedAliases = [];
    for (const edit of edits.sort((left, right) => left.start - right.start || right.end - left.end)) {
      if (edit.start < offset || edit.replacement === text.slice(edit.start, edit.end)) continue;
      if (edit.origin) {
        const start = edit.start + shift;
        updatedAliases.push({ ...edit.origin, start, end: start + edit.replacement.length });
      }
      pieces.push(text.slice(offset, edit.start), edit.replacement);
      offset = edit.end;
      shift += edit.replacement.length - (edit.end - edit.start);
      applied.push(edit);
    }
    pieces.push(text.slice(offset));

    let index = 0;
    shift = 0;
    for (const alias of aliases) {
      while (index < applied.length && applied[index].end <= alias.start) {
        const edit = applied[index++];
        shift += edit.replacement.length - (edit.end - edit.start);
      }
      if (index === applied.length || applied[index].start >= alias.end) {
        updatedAliases.push({ ...alias, start: alias.start + shift, end: alias.end + shift });
      }
    }
    return {
      text: pieces.join(''), changed: applied.length, aliases: updatedAliases.sort((left, right) => left.start - right.start),
      appliedTerms: new Set(applied.map(edit => edit.term).filter(Boolean))
    };
  }

  function quick(text, scenario, scope, mode, aliases = []) {
    let skipped = 0;
    const edits = [];
    for (const hit of systemHits(text, scenario, scope, aliases)) {
      const replacement = convert(hit, mode);
      if (replacement === null || replacement === hit.word || replacement === text.slice(hit.start, hit.end)) {
        skipped++;
        continue;
      }
      edits.push({ start: hit.start, end: hit.end, replacement, origin: mode === 'delete' ? null : hit });
    }
    return { ...applyEdits(text, edits, aliases), skipped };
  }

  function literal(text, pairs, aliases = []) {
    const terms = new Map(pairs);
    const expressions = [...terms.keys()].filter(Boolean).sort((a, b) => b.length - a.length)
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const edits = [];
    if (expressions.length) {
      for (const match of text.matchAll(new RegExp(expressions.join('|'), 'gu'))) {
        edits.push({ start: match.index, end: match.index + match[0].length, replacement: terms.get(match[0]), term: match[0] });
      }
    }
    for (const alias of aliases) {
      const term = terms.has(alias.matched) ? alias.matched : alias.word;
      const replacement = terms.get(term);
      if (replacement !== undefined) edits.push({ start: alias.start, end: alias.end, replacement, term });
    }
    return { ...applyEdits(text, edits, aliases), skipped: 0 };
  }

  root.CijianReplacement = { scopes, formats, previewHits, systemHits, quick, literal };
})(globalThis);
