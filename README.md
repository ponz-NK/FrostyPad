# ❄️ FrostyPad

<p align="center">
  <img src="https://img.shields.io/badge/Electron-v34.0.0-blue?style=for-the-badge&logo=electron" alt="Electron Version">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows" alt="Platform">
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License">
</p>

<p align="center">
  <strong>WindowsデスクトップをiPad風の美しいUIに。</strong><br>
  直感的な操作と高度なカスタマイズ性を備えた、次世代のエレガント・アプリケーションランチャー。
</p>

---

## 🌟 概要

**FrostyPad** は、Windows上での作業体験を劇的に変える、Electron製のアプリケーションランチャーです。iPadOSの洗練されたデザイン言語をデスクトップに持ち込み、グラスモーフィズム（すりガラス効果）を多用した透明感のあるUIを提供します。

単なるランチャーとしての機能に留まらず、直感的なドラッグ＆ドロップによるフォルダ作成や、詳細な外観カスタマイズにより、あなただけの機能美溢れるホーム画面を構築できます。

---

## ✨ 主な機能

### 🎨 iOS風のエレガントなデザイン
バックドロップフィルターによる美しい**グラスモーフィズム**を採用。アイコンの角丸や滑らかなアニメーション（編集モード時の「ぷるぷる」震える挙動など）により、iPadを操作しているかのような心地よさを実現しました。

### 👆 直感的なアプリ整理 (D&D)
アイコンをドラッグして重ねるだけで、自動的に**フォルダを作成**できます。フォルダ内へのアプリ追加や並べ替え、取り出しもすべてマウス操作だけで完結します。

### 📱 One Row Mode (1行モード)
デスクトップの端に配置しても邪魔にならない、横スクロール型のコンパクトな表示モードを搭載。ドックのような感覚でアプリにアクセス可能です。

### ⚙️ 自由自在なカスタマイズ
独立した専用の設定ウィンドウから、以下の要素をミリ単位で調整可能です。
- **アイコン:** サイズ、間隔（ギャップ）、名前の表示/非表示。
- **背景:** ローカル画像やURLを指定可能。配置パターンの微調整も対応。
- **ウィンドウ:** 余白（パディング）、サイズのロック、起動位置の指定。

### 🖱️ コンテキストメニュー
アイコンを右クリックすることで、登録パスの変更、アイコン画像の差し替え、アプリ名の変更が簡単に行えます。

---

## 🛠 技術スタック

軽量さと拡張性を両立させるため、モダンなWeb技術をベースに構築されています。

- **Runtime:** Electron v34.0.0
- **Language:** Vanilla JavaScript (フレームワーク非依存の純粋なJS)
- **Styling:** HTML5 / CSS3 (Flexbox, Grid, CSS Animation)
- **Data:** JSON-based (apps.json, settings.json)

---

## 🚀 開発・実行方法

### 必須要件
- [Node.js](https://nodejs.org/) (LTS推奨)
- npm

### セットアップ
```bash
# 1. リポジトリのクローン
git clone [repository-url]

# 2. プロジェクトディレクトリへ移動
cd FrostyPad

# 3. 依存関係のインストール
npm install

# 4. アプリケーションの起動
npm start
