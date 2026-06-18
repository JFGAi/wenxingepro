/* ============================================================
   问心阁 · 收费版块预留接口
   ============================================================
   当前为「限免模式」（FREE_MODE = true）：
   所有付费点直接放行，界面上以「限免」徽标提示用户。

   ▶ 未来正式收费时的接入步骤：
   1. 将 FREE_MODE 改为 false；
   2. 实现 fetchEntitlements()：启动时调用后端
      GET /api/v1/entitlement/status，把已购权益写入本地缓存；
   3. 实现 openCheckout() 中的 TODO：调用后端
      POST /api/v1/payment/create 创建订单 → 打开收银台 →
      轮询 GET /api/v1/payment/status → 成功后调用 grant()；
   4. grant() 同时上报后端，保证换设备可恢复。

   页面侧只需调用 Premium.require(productId, fn)：
   已解锁（或限免）直接执行 fn，未解锁自动弹出收银台。
   ============================================================ */
(function () {
  'use strict';

  const Premium = {
    /* 收费总开关：true = 限免期，一切免费 */
    FREE_MODE: true,

    /* 商品目录（价格单位：元）。上线后可改为从后端拉取 */
    products: {
      member:     { name: '问心会员（年）', price: 28,  desc: '全部深解不限次 · 专属长明灯 · 会员标识' },
      deep_qian:  { name: '签文深解',       price: 6,   desc: '就你所问之事，逐句拆解签意，附行动建议' },
      deep_meng:  { name: '梦境深释',       price: 6,   desc: '结合梦境细节深入解析，附安心指引' },
      deep_bazi:  { name: '命局深读',       price: 12,  desc: '结合四柱、十神、五行与大运，整理一份克制的命盘笔记' },
      lamp_long:  { name: '长明灯',         price: 19.9, desc: '灯墙置顶常驻，一年长明' },
      extra_qian: { name: '加签一次',       price: 3,   desc: '当日免费次数用完后加签' }
    },

    /* 查询是否已解锁 */
    isUnlocked(productId) {
      if (this.FREE_MODE) return true;
      const ents = WXG.Store.get('entitlements', {});
      return !!ents[productId];
    },

    /* 发放权益（支付成功回调中使用） */
    grant(productId) {
      const ents = WXG.Store.get('entitlements', {});
      ents[productId] = { at: new Date().toISOString() };
      WXG.Store.set('entitlements', ents);
      /* TODO（接入后端时）: POST /api/v1/entitlement/grant 同步到服务端 */
    },

    /* 统一入口：已解锁直接执行，否则走收银台 */
    require(productId, onGranted) {
      if (this.isUnlocked(productId)) {
        if (this.FREE_MODE) this._freeNotice(productId, onGranted);
        else onGranted();
        return;
      }
      this.openCheckout(productId, onGranted);
    },

    /* 限免提示（轻量，不打断；记住「不再提示」） */
    _freeNotice(productId, onGranted) {
      const seen = WXG.Store.get('free_notice_seen', {});
      if (seen[productId]) { onGranted(); return; }
      const p = this.products[productId];
      WXG.modal({
        title: '限时免费',
        body: '「' + p.name + '」原价 <span class="price">¥' + p.price + '</span>' +
              '<span class="now">限免期间 ¥0</span><br>' + p.desc,
        okText: '免费领取',
        onOk: () => {
          seen[productId] = true;
          WXG.Store.set('free_notice_seen', seen);
          onGranted();
        }
      });
    },

    /* 收银台（正式收费后启用） */
    openCheckout(productId, onSuccess) {
      const p = this.products[productId];
      /* TODO: 接入支付后端 ——
         1. const order = await fetch(API + '/payment/create', {productId})
         2. 打开 order.checkout_url（或展示收款二维码）
         3. 轮询 /payment/status 直至 paid
         4. this.grant(productId); onSuccess();
      */
      WXG.modal({
        title: p.name,
        body: '支付功能即将上线，当前为体验期。<br>价格：¥' + p.price,
        okText: '我知道了'
      });
    }
  };

  window.Premium = Premium;
})();
