// 仙緣對決｜連線模組
// 正式連線：PeerJS（WebRTC 點對點，用 PeerJS 公共伺服器配對）
// 本機測試：網址加上 ?net=local，用同一個瀏覽器的兩個分頁互連（BroadcastChannel）

const NET_PREFIX = 'xianyuan-duel-v1-';      // 避免和其他使用 PeerJS 的網站撞房號
const NET_PROTO = 1;                         // 雙方程式版本不同時拒絕連線
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const Net = {
  kind: /[?&]net=local\b/.test(location.search) ? 'local' : 'peer',
  role: null,        // 'host' | 'guest'
  code: null,
  peer: null, conn: null, bc: null, me: null,
  open: false,
  lastSeen: 0, pingTimer: null,
  // 由畫面程式設定的回呼
  onOpen: null, onData: null, onClose: null, onStatus: null,

  newCode() {
    let c = '';
    for (let i = 0; i < 5; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return c;
  },
  status(msg, bad) { if (this.onStatus) this.onStatus(msg, bad); },

  available() {
    if (this.kind === 'local') return typeof BroadcastChannel !== 'undefined';
    return typeof Peer !== 'undefined';
  },

  // ---------- 建立房間 ----------
  host(retry = 0) {
    this.reset();
    this.role = 'host';
    this.code = this.newCode();
    if (this.kind === 'local') {
      this.me = 'H';
      this.bc = new BroadcastChannel('xyd-' + this.code);
      this.bc.onmessage = e => this.onLocal(e.data);
      setTimeout(() => this.status('ready'), 50);
      return;
    }
    this.status('正在建立房間…');
    this.peer = new Peer(NET_PREFIX + this.code, { debug: 1 });
    this.peer.on('open', () => this.status('ready'));
    this.peer.on('connection', c => {
      if (this.conn && this.open) {           // 房間已滿
        c.on('open', () => { c.send({ t: 'full' }); setTimeout(() => c.close(), 400); });
        return;
      }
      this.attach(c);
    });
    this.peer.on('disconnected', () => { if (this.peer && !this.peer.destroyed) this.peer.reconnect(); });
    this.peer.on('error', e => {
      if (e.type === 'unavailable-id' && retry < 3) return this.host(retry + 1);
      this.status(this.errText(e), true);
    });
  },

  // ---------- 加入房間 ----------
  join(code) {
    this.reset();
    this.role = 'guest';
    this.code = code;
    if (this.kind === 'local') {
      this.me = 'G';
      this.bc = new BroadcastChannel('xyd-' + code);
      this.bc.onmessage = e => this.onLocal(e.data);
      this.bc.postMessage({ from: 'G', sys: 'join' });
      this.joinTimer = setTimeout(() => { if (!this.open) this.status('找不到這個房間，請確認代碼。', true); }, 2500);
      return;
    }
    this.status('連線中…');
    this.peer = new Peer({ debug: 1 });
    this.peer.on('open', () => {
      const c = this.peer.connect(NET_PREFIX + code, { reliable: true, serialization: 'json' });
      this.attach(c);
      this.joinTimer = setTimeout(() => {
        if (!this.open) this.status('連線逾時。可能是網路擋住了直連，請換個網路（例如手機熱點）再試。', true);
      }, 15000);
    });
    this.peer.on('error', e => this.status(this.errText(e), true));
  },

  attach(c) {
    this.conn = c;
    c.on('open', () => this.opened());
    c.on('data', d => this.receive(d));
    c.on('close', () => this.closed());
    c.on('error', () => this.closed());
  },

  onLocal(m) {
    if (!m || m.from === this.me) return;
    if (m.sys === 'join' && this.role === 'host') {
      if (this.open) return;
      this.bc.postMessage({ from: 'H', sys: 'accept' });
      this.opened();
    } else if (m.sys === 'accept' && this.role === 'guest') {
      this.opened();
    } else if (m.sys === 'bye') {
      this.closed();
    } else if (m.data !== undefined) {
      this.receive(m.data);
    }
  },

  opened() {
    if (this.open) return;
    this.open = true;
    clearTimeout(this.joinTimer);
    this.lastSeen = Date.now();
    this.send({ t: 'hello', proto: NET_PROTO });
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      this.send({ t: 'ping' });
      if (Date.now() - this.lastSeen > 20000) this.closed();
    }, 4000);
    if (this.onOpen) this.onOpen();
  },

  receive(d) {
    this.lastSeen = Date.now();
    if (!d || d.t === 'ping') return;
    if (d.t === 'full') { this.status('這個房間已經有兩位玩家了。', true); this.close(); return; }
    if (d.t === 'hello') {
      if (d.proto !== NET_PROTO) { this.status('雙方的遊戲版本不同，請兩邊都重新整理網頁。', true); this.close(); }
      return;
    }
    if (this.onData) this.onData(d);
  },

  send(d) {
    if (!this.open) return;
    try {
      if (this.kind === 'local') this.bc.postMessage({ from: this.me, data: d });
      else this.conn.send(d);
    } catch (e) { /* 連線剛斷時忽略 */ }
  },

  closed() {
    if (!this.open) return;
    this.open = false;
    clearInterval(this.pingTimer);
    if (this.onClose) this.onClose();
  },

  close() {
    const wasOpen = this.open;
    this.open = false;
    clearInterval(this.pingTimer);
    clearTimeout(this.joinTimer);
    try { if (this.bc) { if (wasOpen) this.bc.postMessage({ from: this.me, sys: 'bye' }); this.bc.close(); } } catch (e) {}
    try { if (this.conn) this.conn.close(); } catch (e) {}
    try { if (this.peer) this.peer.destroy(); } catch (e) {}
    this.bc = this.conn = this.peer = null;
  },

  reset() { this.close(); this.role = null; this.code = null; },

  errText(e) {
    const t = e && e.type;
    if (t === 'peer-unavailable') return '找不到這個房間，請確認代碼，或請對方重新建立房間。';
    if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed')
      return '連不上配對伺服器，請檢查網路後再試一次。';
    if (t === 'browser-incompatible') return '這個瀏覽器不支援連線對戰，請改用新版 Chrome、Safari 或 Edge。';
    return '連線發生錯誤（' + (t || '未知') + '），請再試一次。';
  },
};
