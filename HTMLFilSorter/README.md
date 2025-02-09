# HTMLFilSorter.js

**HTMLFilSorter.js** は、指定したテーブルの特定列に対してフィルター／ソート機能を付与する軽量 JavaScript ライブラリです。  
内部で使用するプロパティや関数には接頭辞 `hfs_` を付与しており、他のライブラリとの干渉を最小限に抑えています。

<a href="https://ko-ishizaki.github.io/HTMLFilSorter/" onclick="window.open(this.href); return false;">サンプルはこちら</a>

## 特徴

- **フィルター機能**  
  ユニークな値の一覧からチェックボックスで絞り込みが可能です。
- **ソート機能**  
  昇順／降順のソートをトグル操作で実行できます。  
  同じソートを再選択すると初期順に戻ります。
- **ドロップダウン UI**  
  フィルター用のテキストボックス、チェックボックスのスクロール領域、ソートボタン、Select All / Clear All ボタンが含まれます。
- **複数列・複数テーブル対応**  
  テーブル内の異なる列や、複数のテーブルに対して独立したインスタンスを生成可能です。

## インストール

### 1. ダウンロード

1. `HTMLFilSorter.js` をプロジェクト内に配置します。

### 2. HTML に読み込み

```html
<script src="path/to/HTMLFilSorter.js"></script>
```

# 使い方

## 基本的な使い方

対象テーブルの特定の列にフィルター／ソート機能を付与するには、次のように新しいインスタンスを生成します。

```js
new HTMLFilSorter({
  table: '#sampleTable',    // 対象のテーブル（セレクタまたは DOM 要素）
  filterColumn: 0           // 対象の列番号（0 から始まるインデックス、デフォルトは 0）
});
```

## 複数の列に適用する場合

同一テーブル内の他の列や、別のテーブルに対しても個別にインスタンスを生成できます。  
例えば、同じテーブル内の 0 列目、1 列目、2 列目に対して別々の機能を適用する場合は、以下のように記述します。

```js
// 0 列目（例: 商品名）
new HTMLFilSorter({
  table: '#sampleTable',
  filterColumn: 0
});

// 1 列目（例: 価格）
new HTMLFilSorter({
  table: '#sampleTable',
  filterColumn: 1
});

// 2 列目（例: 在庫数）
new HTMLFilSorter({
  table: '#sampleTable',
  filterColumn: 2
});
```
