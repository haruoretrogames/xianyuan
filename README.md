# 仙緣對決｜哈魯歐的仙劍卡牌桌遊

《仙劍奇俠傳》同人卡牌桌遊的網頁版，可以跟電腦對戰。規則依照 **V0.4 試玩規則書**（2026.11.22）。

- 2 人對戰，每人 3 名角色，共 40 張卡牌
- 輪流選角（A→B→B→A→A→B），點卡牌可看大圖
- 電腦難度：簡單／普通／困難
- 規則版本可切換：V0.4、V0.3、平衡建議版
- 手機、電腦瀏覽器都能玩，不需要安裝

> 本作品為同人桌遊試玩設計。技能效果與數值為桌遊改編，並非原作數據。

## 檔案結構

```
xianyuan-duel/
├── index.html          遊戲主頁
├── css/style.css       畫面樣式
├── js/engine.js        規則引擎與電腦 AI（不含畫面）
├── js/ui.js            畫面與操作
├── img/logo.webp       首頁標題 LOGO
├── cards/              20 張卡牌圖（WebP）
├── tools/simulate.js   平衡模擬器（Node.js）
└── README.md
```

## 本機遊玩

直接用瀏覽器打開 `index.html` 就能玩。

## 用 GitHub Pages 架成網站

1. 在 GitHub 建立新的 repository，例如 `xianyuan-duel`。
2. 先把壓縮檔解壓縮。在 repository 頁面按 **Add file → Upload files**，把解壓後資料夾**裡面的所有檔案和資料夾**拖進去，再按 **Commit changes**。（GitHub 不會自動解壓縮 zip 檔。）
3. 到 **Settings → Pages**，在 **Build and deployment** 的 Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾選 `/ (root)`，按 **Save**。
4. 等一兩分鐘，網址會是：`https://你的帳號.github.io/xianyuan-duel/`

## 修改規則數值

所有數值都在 `js/engine.js`：

- **角色**：`RULESETS.v03.c` 是 V0.3／V0.4 共用的角色數值（`hp` 為生命上限，`v` 為技能主要數值，`x` 為附加數值）。
- **牌堆張數**：`RULESETS.v04.deck`。
- **卡牌效果文字**：`CARDS`。

## 平衡模擬器

需要先安裝 [Node.js](https://nodejs.org/)。讓兩個電腦 AI 互打，統計先手勝率與各角色勝率：

```bash
node tools/simulate.js v04 2000
```

第一個參數是規則版本（`v04`、`v03`、`bal`），第二個是局數。電腦只會看眼前一步，結果僅供參考，仍需真人試玩確認。
