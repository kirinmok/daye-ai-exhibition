/**
 * 萬用 PS2 搖桿橋接器 v2.1 — Web Serial 版（穩定修正）
 * =============================================
 * 在你的遊戲 HTML 裡加一行就能用 PS2 搖桿控制：
 *   <script src="joystick.js"></script>
 *
 * 條件：
 *   1. Arduino UNO 已燒錄統一韌體
 *   2. 使用 Chrome 或 Edge 瀏覽器
 *   3. 用 localhost 開網頁（不能用 file://）
 *   4. 點「連線搖桿」按鈕
 *
 * 搖桿對應：方向鍵 + Space/Enter/W/S/A/D/Esc
 */
(function () {
  'use strict';

  const BAUD_RATE = 115200;
  const AXIS_THRESHOLD = 0.4;

  const BUTTON_MAP = {
    cross:'Space', circle:'Enter', triangle:'KeyW', square:'KeyS',
    l1:'KeyA', r1:'KeyR', l2:'KeyQ', r2:'KeyR', start:'Escape',
  };
  const AXIS_KEYS = { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight' };

  const state = {
    jx:0, jy:0, rx:0, ry:0,
    buttons: { cross:0,circle:0,square:0,triangle:0,l1:0,r1:0,l2:0,r2:0,start:0,du:0,dr:0,dd:0,dl:0 },
    connected: false, onUpdate: null,
  };

  const activeKeys = new Set();
  let port = null, reader = null, badge = null, connectBtn = null;

  // ── 鍵盤模擬 ──
  const KEY_NAMES = {ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',Space:' ',Enter:'Enter',Escape:'Escape',KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyQ:'q',KeyE:'e'};
  function fireKey(code, type) {
    const ev = new KeyboardEvent(type, { code, key:KEY_NAMES[code]||code, bubbles:true, cancelable:true });
    document.dispatchEvent(ev); window.dispatchEvent(ev);
  }
  function pressKey(c) { if(!activeKeys.has(c)){activeKeys.add(c);fireKey(c,'keydown');} }
  function releaseKey(c) { if(activeKeys.has(c)){activeKeys.delete(c);fireKey(c,'keyup');} }
  function releaseAll() { for(const c of[...activeKeys])releaseKey(c); }

  // ── 搖桿資料處理 ──
  function handleData(d) {
    state.jx=d.jx||0; state.jy=d.jy||0; state.rx=d.rx||0; state.ry=d.ry||0;
    for(const k of Object.keys(state.buttons)) if(k in d) state.buttons[k]=d[k];

    (state.jx<-AXIS_THRESHOLD||state.buttons.dl)?pressKey(AXIS_KEYS.left):releaseKey(AXIS_KEYS.left);
    (state.jx>AXIS_THRESHOLD||state.buttons.dr)?pressKey(AXIS_KEYS.right):releaseKey(AXIS_KEYS.right);
    (state.jy>AXIS_THRESHOLD||state.buttons.du)?pressKey(AXIS_KEYS.up):releaseKey(AXIS_KEYS.up);
    (state.jy<-AXIS_THRESHOLD||state.buttons.dd)?pressKey(AXIS_KEYS.down):releaseKey(AXIS_KEYS.down);

    for(const[btn,code]of Object.entries(BUTTON_MAP)) state.buttons[btn]?pressKey(code):releaseKey(code);
    if(typeof state.onUpdate==='function') state.onUpdate(state);
  }

  // ── Web Serial 連線（穩定版）──
  async function connectSerial() {
    // 檢查瀏覽器支援
    if (!('serial' in navigator)) {
      alert('你的瀏覽器不支援 Web Serial！\n請用 Chrome 或 Edge 瀏覽器開啟。\n\n注意：必須用 localhost 開網頁，不能直接開檔案。');
      return;
    }

    try {
      // 選擇裝置
      // 只顯示 Arduino 裝置（原廠 0x2341 + CH340 0x1A86）
      port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x2341 }, // Arduino 原廠
          { usbVendorId: 0x1A86 }, // CH340（副廠 UNO/Nano）
          { usbVendorId: 0x10C4 }, // CP2102（部分副廠）
          { usbVendorId: 0x0403 }, // FTDI（部分副廠）
        ]
      });
      console.log('[搖桿] 已選擇裝置');
    } catch (e) {
      if (e.name === 'NotFoundError') return; // 使用者取消
      alert('選擇裝置失敗：' + e.message);
      return;
    }

    try {
      // 開啟連線
      await port.open({ baudRate: BAUD_RATE });
      console.log('[搖桿] Serial Port 已開啟');
    } catch (e) {
      alert('開啟 Serial Port 失敗：' + e.message + '\n\n可能原因：\n1. 其他程式正在使用這個 Port\n2. 關掉 Arduino IDE 的 Serial Monitor\n3. 重新整理頁面再試一次');
      port = null;
      return;
    }

    // 成功連線
    state.connected = true;
    updateUI(true);
    console.log('[搖桿] ✓ 連線成功！');

    // 開始讀取資料
    readLoop();
  }

  async function readLoop() {
    let lineBuffer = '';
    const textDecoder = new TextDecoder();

    try {
      while (port && port.readable) {
        reader = port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!value) continue;

            // 把 Uint8Array 轉成文字
            lineBuffer += textDecoder.decode(value, { stream: true });

            // 按行切割
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop(); // 保留不完整的最後一行

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                try {
                  const data = JSON.parse(trimmed);
                  if (!data.status) handleData(data);
                } catch (e) { /* JSON 解析失敗，跳過 */ }
              }
            }
          }
        } finally {
          reader.releaseLock();
          reader = null;
        }
      }
    } catch (e) {
      console.log('[搖桿] 讀取結束:', e.message);
    }

    // 斷線清理
    state.connected = false;
    updateUI(false);
    releaseAll();

    if (port) {
      try { await port.close(); } catch (e) { /* 略 */ }
      port = null;
    }
    console.log('[搖桿] 已斷線');
  }

  async function disconnect() {
    if (reader) {
      try { await reader.cancel(); } catch (e) { /* 略 */ }
    }
  }

  // ── UI ──
  function createUI() {
    // 狀態燈
    badge = document.createElement('div');
    Object.assign(badge.style, {
      position:'fixed', bottom:'10px', left:'10px',
      padding:'6px 14px', borderRadius:'20px',
      fontSize:'12px', fontFamily:'monospace', fontWeight:'bold',
      zIndex:'99999', pointerEvents:'none',
      transition:'all 0.3s', opacity:'0.85',
    });
    document.body.appendChild(badge);

    // 連線按鈕
    connectBtn = document.createElement('button');
    Object.assign(connectBtn.style, {
      position:'fixed', bottom:'10px', right:'10px',
      padding:'10px 22px', borderRadius:'25px',
      fontSize:'14px', fontFamily:'monospace', fontWeight:'bold',
      zIndex:'99999', cursor:'pointer',
      transition:'all 0.3s',
    });
    connectBtn.addEventListener('click', () => {
      if (state.connected) {
        disconnect();
      } else {
        connectSerial();
      }
    });
    document.body.appendChild(connectBtn);
    updateUI(false);
  }

  function updateUI(on) {
    if (badge) {
      badge.textContent = on ? '🎮 搖桿已連線' : '🎮 搖桿未連線';
      badge.style.background = on ? 'rgba(0,80,0,0.9)' : 'rgba(60,0,0,0.9)';
      badge.style.color = on ? '#0f0' : '#f66';
      badge.style.border = on ? '1px solid #0f04' : '1px solid #f004';
    }
    if (connectBtn) {
      connectBtn.textContent = on ? '🎮 斷開搖桿' : '🎮 連線搖桿';
      connectBtn.style.background = on ? 'rgba(80,0,0,0.9)' : 'rgba(245,200,66,0.9)';
      connectBtn.style.color = on ? '#f66' : '#000';
      connectBtn.style.border = on ? '2px solid #f66' : '2px solid #f5c842';
    }
  }

  // ── 啟動 ──
  window.joystick = state;
  window.joystick.connect = connectSerial;
  window.joystick.disconnect = disconnect;
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', createUI)
    : createUI();
})();
