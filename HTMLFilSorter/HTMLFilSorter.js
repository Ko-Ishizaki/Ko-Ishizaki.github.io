(function(window, document) {
  "use strict";

  /**
   * HTMLFilSorter コンストラクタ
   * @param {Object} options - 設定オブジェクト
   *   options.table: テーブルのセレクタ文字列または DOM 要素（必須）
   *   options.filterColumn: フィルタ／ソート対象の列番号（0始まり、デフォルトは 0）
   */
  function HTMLFilSorter(options) {
    if (!options || !options.table) {
      console.error("HTMLFilSorter: 'table' オプションは必須です。");
      return;
    }
    // テーブル要素の取得（セレクタ文字列の場合は querySelector で）
    if (typeof options.table === 'string') {
      this._hfs_tableElement = document.querySelector(options.table);
    } else {
      this._hfs_tableElement = options.table;
    }
    if (!this._hfs_tableElement) {
      console.error("HTMLFilSorter: テーブル要素が見つかりません。");
      return;
    }
    this._hfs_filterColumnIndex = (typeof options.filterColumn === 'number') ? options.filterColumn : 0;
    this._hfs_dropdownElement = null;      // 表示中のドロップダウン要素
    this._hfs_uniqueFilterValues = [];       // 対象列のユニークな値一覧
    this._hfs_selectedFilterValues = [];     // 選択中のフィルター値
    this._hfs_currentSortOrder = '';         // '', 'asc', 'desc'
    this._hfs_defaultRowOrder = [];          // ページ読み込み時の元の行順序
    this._hfs_headerCell = null;             // 対象列の th 要素

    this._hfs_initialize();
  }

  // 初期化（初期行順の保存、ヘッダーセルの取得、フィルターアイコンの生成）
  HTMLFilSorter.prototype._hfs_initialize = function() {
    // tbody 内の元の行順序を保存
    var tbody = this._hfs_tableElement.tBodies[0];
    for (var i = 0; i < tbody.rows.length; i++) {
      this._hfs_defaultRowOrder.push(tbody.rows[i]);
    }
    // ヘッダー行から対象列の th 要素を取得（thead がない場合は最初の tr）
    var headerRow;
    if (this._hfs_tableElement.tHead) {
      headerRow = this._hfs_tableElement.tHead.rows[0];
    } else {
      headerRow = this._hfs_tableElement.querySelector('tr');
    }
    if (!headerRow || headerRow.cells.length <= this._hfs_filterColumnIndex) {
      console.error("HTMLFilSorter: filterColumn のインデックスがヘッダーセル数を超えています。");
      return;
    }
    this._hfs_headerCell = headerRow.cells[this._hfs_filterColumnIndex];

    // ヘッダー内にフィルター用アイコン（クラス名 hfs-filter-icon）がなければ作成
    var filterIcon = this._hfs_headerCell.querySelector('.hfs-filter-icon');
    if (!filterIcon) {
      filterIcon = document.createElement('span');
      filterIcon.className = 'hfs-filter-icon';
      filterIcon.textContent = '▼';
      this._hfs_headerCell.appendChild(filterIcon);
    }
    var self = this;
    filterIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      self.toggleDropdown();
    });

    // 対象列のユニークな値を初期化
    this._hfs_initUniqueFilterValues();
  };

  // 対象列（filterColumn）の全セルから重複しない値を抽出
  HTMLFilSorter.prototype._hfs_initUniqueFilterValues = function() {
    var tbody = this._hfs_tableElement.tBodies[0];
    var values = [];
    for (var i = 0; i < tbody.rows.length; i++) {
      var cellText = tbody.rows[i].cells[this._hfs_filterColumnIndex].textContent.trim();
      if (values.indexOf(cellText) === -1) {
        values.push(cellText);
      }
    }
    this._hfs_uniqueFilterValues = values.sort();
  };

  // ドロップダウンの作成と表示
  HTMLFilSorter.prototype._hfs_createDropdown = function() {
    var self = this;
    // 既に表示中の場合は削除
    if (this._hfs_dropdownElement) {
      this._hfs_dropdownElement.parentNode.removeChild(this._hfs_dropdownElement);
    }
    this._hfs_dropdownElement = document.createElement('div');
    this._hfs_dropdownElement.className = 'hfs-dropdown';

    // ★ ソートオプション部の作成
    var sortSection = document.createElement('div');
    sortSection.className = 'hfs-sort-options';

    var sortAscButton = document.createElement('button');
    sortAscButton.textContent = '昇順';
    sortAscButton.className = 'hfs-sort-button';
    sortAscButton.setAttribute('data-sort', 'asc');
    sortAscButton.addEventListener('click', function(e) {
      e.stopPropagation();
      self.sortTable('asc');
      self._hfs_updateDropdownSortIndicators();
    });

    var sortDescButton = document.createElement('button');
    sortDescButton.textContent = '降順';
    sortDescButton.className = 'hfs-sort-button';
    sortDescButton.setAttribute('data-sort', 'desc');
    sortDescButton.addEventListener('click', function(e) {
      e.stopPropagation();
      self.sortTable('desc');
      self._hfs_updateDropdownSortIndicators();
    });

    sortSection.appendChild(sortAscButton);
    sortSection.appendChild(sortDescButton);
    this._hfs_dropdownElement.appendChild(sortSection);

    // 仕切り線
    var divider = document.createElement('hr');
    this._hfs_dropdownElement.appendChild(divider);

    // フィルター用テキスト入力欄（チェックボックス絞り込み用）
    var filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.placeholder = '絞り込み...';
    filterInput.className = 'hfs-filter-input';
    filterInput.addEventListener('keyup', function() {
      var query = this.value.toLowerCase();
      var items = checkboxContainer.getElementsByClassName('hfs-filter-item');
      for (var i = 0; i < items.length; i++) {
        var label = items[i].getElementsByTagName('label')[0];
        items[i].style.display = (label.textContent.toLowerCase().indexOf(query) !== -1) ? '' : 'none';
      }
    });
    this._hfs_dropdownElement.appendChild(filterInput);

    // 「Select All」「Clear All」ボタン
    var controlDiv = document.createElement('div');
    controlDiv.className = 'hfs-control-buttons';
    controlDiv.style.textAlign = 'center';
    controlDiv.style.marginBottom = '8px';

    var selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = 'Select All';
    selectAllBtn.className = 'hfs-select-all';
    selectAllBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(function(cb) {
        cb.checked = true;
      });
      self.applyFilters();
      return false;
    });

    var clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = 'Clear All';
    clearAllBtn.className = 'hfs-clear-all';
    clearAllBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(function(cb) {
        cb.checked = false;
      });
      self.applyFilters();
      return false;
    });

    controlDiv.appendChild(selectAllBtn);
    controlDiv.appendChild(clearAllBtn);
    this._hfs_dropdownElement.appendChild(controlDiv);

    // チェックボックスリストをまとめるコンテナ（スクロール領域）
    var checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'hfs-checkbox-container';

    for (var i = 0; i < this._hfs_uniqueFilterValues.length; i++) {
      var itemDiv = document.createElement('div');
      itemDiv.className = 'hfs-filter-item';

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = this._hfs_uniqueFilterValues[i];
      checkbox.addEventListener('change', function() {
        self.applyFilters();
      });
      if (this._hfs_selectedFilterValues.indexOf(this._hfs_uniqueFilterValues[i]) !== -1) {
        checkbox.checked = true;
      }
      var label = document.createElement('label');
      label.textContent = this._hfs_uniqueFilterValues[i];

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(label);
      checkboxContainer.appendChild(itemDiv);
    }
    this._hfs_dropdownElement.appendChild(checkboxContainer);

    // ヘッダーセルの位置情報からドロップダウンの表示位置を設定
    var rect = this._hfs_headerCell.getBoundingClientRect();
    this._hfs_dropdownElement.style.position = 'absolute';
    this._hfs_dropdownElement.style.top = (rect.bottom + window.scrollY) + 'px';
    this._hfs_dropdownElement.style.left = (rect.left + window.scrollX) + 'px';

    document.body.appendChild(this._hfs_dropdownElement);
    this._hfs_updateDropdownSortIndicators();

    // ドロップダウン外のクリックで自動的に閉じる
    setTimeout(function() {
      document.addEventListener('click', function outsideClickHandler(e) {
        if (self._hfs_dropdownElement &&
            !self._hfs_dropdownElement.contains(e.target) &&
            e.target !== self._hfs_headerCell &&
            !self._hfs_headerCell.contains(e.target)) {
          self.hideDropdown();
          document.removeEventListener('click', outsideClickHandler);
        }
      });
    }, 0);
  };

  // ドロップダウンの表示／非表示を切り替え
  HTMLFilSorter.prototype.toggleDropdown = function() {
    if (this._hfs_dropdownElement) {
      this.hideDropdown();
    } else {
      this._hfs_createDropdown();
    }
  };

  // ドロップダウンを閉じる
  HTMLFilSorter.prototype.hideDropdown = function() {
    if (this._hfs_dropdownElement) {
      this._hfs_dropdownElement.parentNode.removeChild(this._hfs_dropdownElement);
      this._hfs_dropdownElement = null;
    }
  };

  // チェックボックスの状態に合わせてテーブル行をフィルタリング
  HTMLFilSorter.prototype.applyFilters = function() {
    var self = this;
    this._hfs_selectedFilterValues = [];
    if (this._hfs_dropdownElement) {
      var checkboxes = this._hfs_dropdownElement.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(function(cb) {
        if (cb.checked) {
          self._hfs_selectedFilterValues.push(cb.value);
        }
      });
    }
    var tbody = this._hfs_tableElement.tBodies[0];
    for (var i = 0; i < tbody.rows.length; i++) {
      var cellText = tbody.rows[i].cells[this._hfs_filterColumnIndex].textContent.trim();
      if (self._hfs_selectedFilterValues.length > 0) {
        tbody.rows[i].style.display = (self._hfs_selectedFilterValues.indexOf(cellText) !== -1) ? "" : "none";
      } else {
        tbody.rows[i].style.display = "";
      }
    }
  };

  // 対象列のテーブル行をソート（同じ順序が再選択された場合は初期順に戻す）
  HTMLFilSorter.prototype.sortTable = function(order) {
    var tbody = this._hfs_tableElement.tBodies[0];
    var self = this;
    if (this._hfs_currentSortOrder === order) {
      this._hfs_currentSortOrder = '';
      for (var i = 0; i < this._hfs_defaultRowOrder.length; i++) {
        tbody.appendChild(this._hfs_defaultRowOrder[i]);
      }
      this._hfs_updateDropdownSortIndicators();
      return;
    }
    this._hfs_currentSortOrder = order;
    var rows = Array.from(tbody.rows);
    rows.sort(function(a, b) {
      var textA = a.cells[self._hfs_filterColumnIndex].textContent.trim();
      var textB = b.cells[self._hfs_filterColumnIndex].textContent.trim();
      if (order === 'asc') {
        return textA.localeCompare(textB, 'ja');
      } else {
        return textB.localeCompare(textA, 'ja');
      }
    });
    rows.forEach(function(row) {
      tbody.appendChild(row);
    });
    this._hfs_updateDropdownSortIndicators();
  };

  // ドロップダウン内のソートボタンの表示状態更新
  HTMLFilSorter.prototype._hfs_updateDropdownSortIndicators = function() {
    if (!this._hfs_dropdownElement) return;
    var ascBtn = this._hfs_dropdownElement.querySelector('.hfs-sort-button[data-sort="asc"]');
    var descBtn = this._hfs_dropdownElement.querySelector('.hfs-sort-button[data-sort="desc"]');
    if (ascBtn) ascBtn.classList.remove('active');
    if (descBtn) descBtn.classList.remove('active');
    if (this._hfs_currentSortOrder === 'asc' && ascBtn) {
      ascBtn.classList.add('active');
    } else if (this._hfs_currentSortOrder === 'desc' && descBtn) {
      descBtn.classList.add('active');
    }
  };

  // グローバルに公開（名前衝突を防ぐため、接頭辞 hfs_ を利用）
  window.HTMLFilSorter = HTMLFilSorter;

})(window, document);
