class DataGrid {
    constructor(containerId, data, options = {}) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.filteredData = [...data]; // フィルタ適用後のデータ
        this.options = Object.assign({ pageSize: 5 }, options);
        this.currentPage = 1;
        this.sortOrder = {};
        this.filterText = ""; // 検索キーワードを保持
        this.createFilterInput(); // 検索欄を作成
        this.tableContainer = document.createElement("div"); // テーブル用コンテナ
        this.paginationContainer = document.createElement("div"); // ページネーション用コンテナ
        this.container.appendChild(this.tableContainer);
        this.container.appendChild(this.paginationContainer);
        this.render();
    }

    createFilterInput() {
        this.filterContainer = document.createElement("div");

        const filterInput = document.createElement("input");
        filterInput.setAttribute("type", "text");
        filterInput.setAttribute("placeholder", "検索...");
        filterInput.value = this.filterText; // 検索キーワードを維持
        filterInput.addEventListener("input", (e) => {
            this.filterText = e.target.value;
            this.filterData();
        });

        this.filterContainer.appendChild(filterInput);
        this.container.appendChild(this.filterContainer);
    }

    render() {
        // 既存のテーブルとページネーションを削除（検索欄はそのまま）
        this.tableContainer.innerHTML = "";
        this.paginationContainer.innerHTML = "";

        const table = document.createElement("table");
        table.classList.add("data-grid");

        // ヘッダー作成
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        Object.keys(this.data[0]).forEach((key) => {
            const th = document.createElement("th");
            th.innerText = key;
            th.dataset.column = key;

            // ソートイベント
            th.addEventListener("click", () => this.sortData(key));
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // ボディ作成
        const tbody = document.createElement("tbody");
        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const paginatedData = this.filteredData.slice(startIndex, startIndex + this.options.pageSize);

        paginatedData.forEach((row) => {
            const tr = document.createElement("tr");
            Object.values(row).forEach((value) => {
                const td = document.createElement("td");
                td.innerText = value;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        this.tableContainer.appendChild(table);

        // ページネーションを更新
        this.renderPagination();
    }

    sortData(column) {
        this.sortOrder[column] = !this.sortOrder[column];
        this.filteredData.sort((a, b) => {
            return this.sortOrder[column]
                ? a[column] > b[column] ? 1 : -1
                : a[column] < b[column] ? 1 : -1;
        });
        this.render();
    }

    filterData() {
        this.filteredData = this.data.filter(row =>
            Object.values(row).some(value =>
                value.toString().toLowerCase().includes(this.filterText.toLowerCase())
            )
        );
        this.currentPage = 1; // ページをリセット
        this.render();
    }

    changePage(page) {
        this.currentPage = page;
        this.render();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = ""; // ページが1つなら非表示
            return;
        }

        this.paginationContainer.innerHTML = ""; // 既存のボタンをクリア

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement("button");
            button.innerText = i;
            button.classList.add("pagination-button");
            if (i === this.currentPage) {
                button.classList.add("active");
            }
            button.addEventListener("click", () => this.changePage(i));
            this.paginationContainer.appendChild(button);
        }
    }
}

// 使用例
const sampleData = [
    { ID: 1, Name: "Alice", Age: 25 },
    { ID: 2, Name: "Bob", Age: 30 },
    { ID: 3, Name: "Charlie", Age: 28 },
    { ID: 4, Name: "David", Age: 35 },
    { ID: 5, Name: "Eva", Age: 40 },
    { ID: 6, Name: "Frank", Age: 22 },
    { ID: 7, Name: "Grace", Age: 33 },
    { ID: 8, Name: "Henry", Age: 27 },
    { ID: 9, Name: "Irene", Age: 26 },
    { ID: 10, Name: "Jack", Age: 31 }
];

new DataGrid("grid-container", sampleData, { pageSize: 3 });
