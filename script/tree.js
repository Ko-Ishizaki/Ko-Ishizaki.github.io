    const savedMode = localStorage.getItem('mode');
    if (savedMode === 'dark') {
      document.body.classList.add('dark-mode');
      document.getElementById('toggleMode').textContent = "Switch To Light Mode";
    } else {
      document.body.classList.add('light-mode');
      document.getElementById('toggleMode').textContent = "Switch To Dark Mode";
    }

    // ---------- テキストエリアのキーダウンイベント ----------
    const inputTextArea = document.getElementById('inputText');
    inputTextArea.addEventListener('keydown', function(e) {
      // タブキーのデフォルト動作をキャンセルして、タブ文字を挿入
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
        this.dispatchEvent(new Event('input'));
      }
      // エンターキー押下時に現在行の先頭タブ数を次の行にも引き継ぐ
      else if (e.key === 'Enter') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const textUpToCursor = this.value.substring(0, start);
        const lines = textUpToCursor.split('\n');
        const currentLine = lines[lines.length - 1] || '';
        const matchTabs = currentLine.match(/^(\t+)/);
        const leadingTabsCount = matchTabs ? matchTabs[1].length : 0;
        const insertion = '\n' + '\t'.repeat(leadingTabsCount);
        this.value = this.value.substring(0, start) + insertion + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + insertion.length;
        this.dispatchEvent(new Event('input'));
      }
    });

    // ---------- テキストエリアの内容が変わったらツリー再描画 ----------
    inputTextArea.addEventListener('input', function() {
      const text = this.value;
      const treeData = parseToTree(text);
      const asciiTree = buildAsciiTree(treeData);
      document.getElementById('outputText').textContent = asciiTree;
    });

    // ---------- テキストを解析してツリー構造に ----------
    function parseToTree(text) {
      const lines = text.split(/\r?\n/);
      const root = { name: '__ROOT__', children: [] };
      const stack = [root];

      for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const leadingTabsMatch = line.match(/^(\t+)/);
        const depth = leadingTabsMatch ? leadingTabsMatch[0].length : 0;
        const nodeName = trimmed;

        while (stack.length > depth + 1) {
          stack.pop();
        }

        const newNode = { name: nodeName, children: [] };
        stack[stack.length - 1].children.push(newNode);
        stack.push(newNode);
      }
      return root.children;
    }

    // ---------- ツリー構造からASCIIツリー文字列を生成 ----------
    function buildAsciiTree(nodes, prefix = '') {
      let result = '';
      nodes.forEach((node, index) => {
        const isLast = index === nodes.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        result += prefix + branch + node.name + '\n';
        if (node.children && node.children.length > 0) {
          const childPrefix = prefix + (isLast ? '    ' : '│   ');
          result += buildAsciiTree(node.children, childPrefix);
        }
      });
      return result;
    }

    // ---------- モード切替処理 ----------
    const toggleButton = document.getElementById('toggleMode');
    toggleButton.addEventListener('click', function() {
      if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        localStorage.setItem('mode', 'light');
        toggleButton.textContent = "Switch To Dark Mode";
      } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('mode', 'dark');
        toggleButton.textContent = "Switch To Light Mode";
      }
    });

    // ページ初期ロード時にツリーを描画
    inputTextArea.dispatchEvent(new Event('input'));
