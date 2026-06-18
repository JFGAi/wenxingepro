/* ============================================================
   问心阁 · 命盘模块
   依赖 lunar-javascript 输出八字，本站只做结构整理与温和解读。
   ============================================================ */
(function () {
  'use strict';

  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const WUXING = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
    己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
    子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
    午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
  };
  const YINYANG = {
    甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
    乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴'
  };
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const HIDE_GAN = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
    辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'],
    未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'], 酉: ['辛'],
    戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
  };
  const HIDE_WEIGHT = [0.65, 0.25, 0.1];
  const ELEMENT_COPY = {
    木: '木主生发、规划、学习与舒展。',
    火: '火主表达、热度、灵感与被看见。',
    土: '土主承载、秩序、稳定与责任。',
    金: '金主边界、判断、效率与取舍。',
    水: '水主流动、洞察、学习与弹性。'
  };
  const ELEMENT_TONE = {
    木: '向上生长的力量明显，适合把模糊愿望拆成可以持续推进的计划。',
    火: '表达和行动的火候较足，适合把想法拿出来照光，但也要留意节奏。',
    土: '承载和收束的气比较重，适合经营长期秩序，也容易替太多事负责。',
    金: '判断和边界感突出，适合做取舍、定标准，但别让锋芒替你说完所有话。',
    水: '感知和变通能力较强，适合学习、连接与流动，也要防止想太多而迟迟不落地。'
  };

  function call(obj, name, fallback) {
    try {
      return obj && typeof obj[name] === 'function' ? obj[name]() : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function arr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return String(v).split(',').filter(Boolean);
  }

  function tenGod(dayGan, otherGan) {
    if (!dayGan || !otherGan) return '';
    if (dayGan === otherGan) return '比肩';
    const me = WUXING[dayGan];
    const other = WUXING[otherGan];
    const same = YINYANG[dayGan] === YINYANG[otherGan];
    if (me === other) return same ? '比肩' : '劫财';
    if (SHENG[other] === me) return same ? '偏印' : '正印';
    if (SHENG[me] === other) return same ? '食神' : '伤官';
    if (KE[other] === me) return same ? '七杀' : '正官';
    if (KE[me] === other) return same ? '偏财' : '正财';
    return '';
  }

  function pillar(label, gz, ec) {
    const map = {
      year: ['getYearShiShenGan', 'getYearHideGan', 'getYearShiShenZhi', 'getYearDiShi', 'getYearNaYin'],
      month: ['getMonthShiShenGan', 'getMonthHideGan', 'getMonthShiShenZhi', 'getMonthDiShi', 'getMonthNaYin'],
      day: ['getDayShiShenGan', 'getDayHideGan', 'getDayShiShenZhi', 'getDayDiShi', 'getDayNaYin'],
      time: ['getTimeShiShenGan', 'getTimeHideGan', 'getTimeShiShenZhi', 'getTimeDiShi', 'getTimeNaYin']
    }[label];
    const gan = gz ? gz[0] : '';
    const zhi = gz ? gz[1] : '';
    return {
      label,
      gz,
      gan,
      zhi,
      ganElement: WUXING[gan],
      zhiElement: WUXING[zhi],
      shishenGan: label === 'day' ? '日主' : call(ec, map[0], ''),
      hideGan: arr(call(ec, map[1], HIDE_GAN[zhi] || [])),
      shishenZhi: arr(call(ec, map[2], [])),
      dishi: call(ec, map[3], ''),
      nayin: call(ec, map[4], '')
    };
  }

  function scoreElements(pillars) {
    const score = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach((p, index) => {
      if (p.ganElement) score[p.ganElement] += index === 1 ? 1.25 : 1;
      p.hideGan.forEach((g, i) => {
        const el = WUXING[g];
        if (el) score[el] += (HIDE_WEIGHT[i] || 0.08) * (index === 1 ? 1.4 : 1);
      });
    });
    const values = Object.entries(score).map(([el, value]) => ({ el, value: Math.round(value * 100) / 100 }));
    values.sort((a, b) => b.value - a.value);
    const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
    return { values, total };
  }

  function buildDaYun(ec, genderCode, lunar) {
    try {
      const yun = ec.getYun(genderCode, 2);
      const steps = yun.getDaYun(9).filter(d => call(d, 'getGanZhi', '')).map(d => ({
        startAge: call(d, 'getStartAge', ''),
        endAge: call(d, 'getEndAge', ''),
        startYear: call(d, 'getStartYear', ''),
        endYear: call(d, 'getEndYear', ''),
        gz: call(d, 'getGanZhi', ''),
        xun: call(d, 'getXun', '')
      }));
      const start = [call(yun, 'getStartYear', 0), call(yun, 'getStartMonth', 0), call(yun, 'getStartDay', 0)];
      const solar = call(yun, 'getStartSolar', null);
      return {
        startText: start[0] + '岁' + (start[1] ? start[1] + '个月' : '') + (start[2] ? start[2] + '天' : ''),
        startSolar: solar && typeof solar.toYmd === 'function' ? solar.toYmd() : '',
        steps
      };
    } catch (e) {
      return { startText: '', startSolar: '', steps: [] };
    }
  }

  function parseDateParts(value) {
    const parts = String(value || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) throw new Error('请选择完整日期');
    return parts;
  }

  function parseTimeParts(value) {
    const parts = String(value || '00:00').split(':').map(Number);
    return [parts[0] || 0, parts[1] || 0];
  }

  function calculate(input) {
    if (typeof Solar === 'undefined' || typeof Lunar === 'undefined') {
      throw new Error('历法库未加载，请联网后刷新再试。');
    }
    const [year, month, day] = parseDateParts(input.date);
    const [hour, minute] = parseTimeParts(input.time);
    const genderCode = input.gender === 'female' ? 0 : 1;
    const lunar = input.calendar === 'lunar'
      ? Lunar.fromYmdHms(year, input.leap ? -month : month, day, hour, minute, 0)
      : Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();
    const solar = lunar.getSolar();
    const ec = lunar.getEightChar();
    ec.setSect(2);

    const pillars = [
      pillar('year', ec.getYear(), ec),
      pillar('month', ec.getMonth(), ec),
      pillar('day', ec.getDay(), ec),
      pillar('time', ec.getTime(), ec)
    ];
    const dayMaster = pillars[2].gan;
    const dayElement = WUXING[dayMaster];
    const score = scoreElements(pillars);
    const daYun = buildDaYun(ec, genderCode, lunar);
    const yearGan = pillars[0].gan;
    const forward = (YINYANG[yearGan] === '阳' && genderCode === 1) || (YINYANG[yearGan] === '阴' && genderCode === 0);

    return {
      input,
      solarText: solar.toYmd() + ' ' + String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'),
      lunarText: lunar.toString(),
      zodiac: call(lunar, 'getYearShengXiao', ''),
      jieQi: call(lunar, 'getJieQi', ''),
      eightText: ec.toString(),
      pillars,
      dayMaster,
      dayElement,
      score,
      forward,
      daYun,
      taiYuan: call(ec, 'getTaiYuan', ''),
      mingGong: call(ec, 'getMingGong', ''),
      shenGong: call(ec, 'getShenGong', '')
    };
  }

  function summary(result) {
    const high = result.score.values[0];
    const low = result.score.values[result.score.values.length - 1];
    const dayRatio = result.score.values.find(v => v.el === result.dayElement).value / result.score.total;
    const strength = dayRatio >= 0.25 ? '日主有根有气' : (dayRatio <= 0.15 ? '日主偏清，需要借力' : '日主气势中和');
    return [
      '日主为' + result.dayMaster + result.dayElement + '。' + (ELEMENT_COPY[result.dayElement] || ''),
      '五行中' + high.el + '气最显，' + low.el + '气较少。' + (ELEMENT_TONE[high.el] || ''),
      strength + '。这不是吉凶判断，更像一张性格与节奏的地图：旺处可用，弱处可养。',
      '大运按经典规则为' + (result.forward ? '顺排' : '逆排') + '，起运约 ' + (result.daYun.startText || '待校验') + (result.daYun.startSolar ? '，交运日约 ' + result.daYun.startSolar : '') + '。'
    ];
  }

  function renderPillarTable(result) {
    const names = ['年柱', '月柱', '日柱', '时柱'];
    const cells = fn => result.pillars.map(fn).join('');
    return '<div class="bazi-table-wrap"><table class="bazi-table">' +
      '<thead><tr><th></th>' + names.map(n => '<th>' + n + '</th>').join('') + '</tr></thead>' +
      '<tbody>' +
      '<tr><td>干支</td>' + cells(p => '<td><b>' + p.gz + '</b><small>' + p.nayin + '</small></td>') + '</tr>' +
      '<tr><td>天干</td>' + cells(p => '<td>' + p.gan + ' · ' + p.ganElement + '<small>' + p.shishenGan + '</small></td>') + '</tr>' +
      '<tr><td>地支</td>' + cells(p => '<td>' + p.zhi + ' · ' + p.zhiElement + '<small>' + p.dishi + '</small></td>') + '</tr>' +
      '<tr><td>藏干</td>' + cells(p => '<td><small>' + p.hideGan.map((g, i) => g + (p.shishenZhi[i] ? ' ' + p.shishenZhi[i] : '')).join('<br>') + '</small></td>') + '</tr>' +
      '</tbody></table></div>';
  }

  function renderElementBars(result) {
    const max = Math.max.apply(null, result.score.values.map(v => v.value)) || 1;
    return '<div class="element-bars">' + result.score.values.map(v =>
      '<div class="element-row"><span>' + v.el + '</span><div><i style="width:' + Math.round(v.value / max * 100) + '%"></i></div><em>' + v.value + '</em></div>'
    ).join('') + '</div>';
  }

  function renderDaYun(result) {
    if (!result.daYun.steps.length) {
      return '<p class="muted">大运数据暂未取到，可刷新或稍后再试。</p>';
    }
    return '<div class="dayun-grid">' + result.daYun.steps.slice(0, 8).map(step =>
      '<div class="dayun-cell"><b>' + step.gz + '</b><span>' + step.startAge + '-' + step.endAge + '岁</span><small>' + step.startYear + '-' + step.endYear + '</small></div>'
    ).join('') + '</div>';
  }

  function render(result) {
    const name = result.input.name ? esc(result.input.name) : '此命盘';
    return '<div class="bazi-result-head">' +
      '<div><span>命盘</span><h2>' + name + '</h2><p>' + result.solarText + ' · ' + result.lunarText + '</p></div>' +
      '<div class="day-master"><small>日主</small><b>' + result.dayMaster + '</b><span>' + result.dayElement + '</span></div>' +
      '</div>' +
      '<div class="bazi-meta">' +
        '<span>四柱：' + result.eightText + '</span>' +
        '<span>生肖：' + result.zodiac + '</span>' +
        '<span>胎元：' + result.taiYuan + '</span>' +
        '<span>命宫：' + result.mingGong + '</span>' +
      '</div>' +
      renderPillarTable(result) +
      '<div class="bazi-two-col">' +
        '<section><h3>五行气势</h3>' + renderElementBars(result) + '</section>' +
        '<section><h3>初读</h3><div class="reading-list">' + summary(result).map(t => '<p>' + t + '</p>').join('') + '</div></section>' +
      '</div>' +
      '<section class="bazi-section"><h3>大运</h3>' + renderDaYun(result) + '</section>' +
      '<section class="bazi-section"><h3>校准</h3><p class="muted">若要继续深读，最好用 3 件已经发生的事校准：一次迁动、一次关系变化、一次事业或学业转折。命理只作文化参考，不替代现实判断。</p></section>';
  }

  function renderDeep(result) {
    const high = result.score.values[0].el;
    const low = result.score.values[result.score.values.length - 1].el;
    return '<div class="jie"><b>命局深读：</b>' +
      '此盘以' + result.dayMaster + result.dayElement + '为日主，先看月令与五行分布，再看十神是否形成稳定的流通。' +
      high + '气较显，说明人生议题里常有与「' + ELEMENT_COPY[high].replace('。', '') + '」有关的牵引；' +
      low + '气较少，不必理解成缺陷，更适合当作要主动经营的能力。' +
      '<br><br>建议把这张盘当成一份长期观察笔记：先记录大运交接、流年冲合与现实事件的对应，再决定哪些判断值得保留。重大健康、投资、婚姻与法律问题，仍以专业意见和真实信息为准。</div>';
  }

  window.WXG_BAZI = { calculate, render, renderDeep, summary, tenGod };
})();
