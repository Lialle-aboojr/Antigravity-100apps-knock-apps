/* script.js */

/**
 * 状態管理（State）
 * アプリケーションのすべてのデータをここで一元管理します。
 */
let state = {
    data: [
        // 初期データ（サンプル）
        { id: 1, name: "リンゴ / Apple", value: 120 },
        { id: 2, name: "ミカン / Orange", value: 80 },
        { id: 3, name: "バナナ / Banana", value: 150 }
    ],
    chartType: 'bar', // 'bar' または 'line'
    nextId: 4
};

/**
 * DOM要素の取得
 */
const form = document.getElementById('data-form');
const itemNameInput = document.getElementById('item-name');
const itemValueInput = document.getElementById('item-value');
const dataList = document.getElementById('data-list');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const chartContainer = document.getElementById('chart-container');

// D3.jsで使用する共通のツールチップ要素を作成（HTML上に配置）
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

/**
 * セキュリティ対策: XSS（クロスサイトスクリプティング）防止関数
 * ユーザーが入力した文字列に含まれるHTMLタグなどを無効化します。
 */
function sanitizeText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * データの追加処理
 */
form.addEventListener('submit', function(e) {
    e.preventDefault(); // 画面の再読み込みを防ぐ

    // 入力値の取得
    const rawName = itemNameInput.value.trim();
    const rawValue = itemValueInput.value;

    // バリデーション
    if (!rawName || !rawValue) return;

    // データの追加
    const newItem = {
        id: state.nextId++,
        name: rawName, // 表示時にサニタイズして利用する
        value: Number(rawValue)
    };

    state.data.push(newItem);

    // フォームのリセット
    itemNameInput.value = '';
    itemValueInput.value = '';

    // UIとグラフの更新
    updateUI();
});

/**
 * データの削除処理（グローバル関数にしてHTMLから呼び出せるようにする）
 * @param {number} id - 削除するデータのID
 */
window.deleteData = function(id) {
    state.data = state.data.filter(item => item.id !== id);
    updateUI();
};

/**
 * グラフ種類の切り替え処理
 */
toggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // すでにアクティブなら何もしない
        if (this.classList.contains('active')) return;

        // ボタンのアクティブ状態を切り替え
        toggleBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // 状態の更新と再描画
        state.chartType = this.getAttribute('data-type');
        drawChart();
    });
});

/**
 * リストUIの更新
 */
function updateUI() {
    // リスト領域を一旦クリア
    dataList.innerHTML = '';

    state.data.forEach(item => {
        // 安全にテキスト化（XSS対策）
        const safeName = sanitizeText(item.name);
        
        // li要素を作成
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-info">
                <span class="item-name-display">${safeName}</span>
                <span class="item-value-display">${item.value}</span>
            </div>
            <button class="btn delete-btn" onclick="deleteData(${item.id})">削除 / Delete</button>
        `;
        dataList.appendChild(li);
    });

    // グラフの描画を呼び出す
    drawChart();
}

/**
 * D3.jsによるグラフの描画処理を制御するメイン関数
 */
function drawChart() {
    // コンテナのサイズを取得（CSSでの指定サイズに基づく）
    const width = chartContainer.clientWidth;
    const height = chartContainer.clientHeight;
    
    // グラフの余白設定（上下左右のスペースを確保）
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // SVGが未作成なら初期化、作成済みならサイズを更新
    let svg = d3.select("#chart-container svg");
    let g;

    if (svg.empty()) {
        svg = d3.select("#chart-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .attr("class", "graph-area");
            
        // X軸グループ
        g.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${innerHeight})`);
            
        // Y軸用のグリッドライングループ（グラフの背景に描くため先にappend）
        g.append("g")
            .attr("class", "grid y-grid");

        // Y軸グループ
        g.append("g")
            .attr("class", "axis y-axis");
            
        // 描画用のコンテナグループ（棒や線をまとめる）
        g.append("g").attr("class", "chart-elements");

    } else {
        svg.attr("width", width).attr("height", height);
        g = svg.select(".graph-area");
        // サイズ変更に合わせてX軸の位置を修正
        g.select(".x-axis").attr("transform", `translate(0,${innerHeight})`);
    }

    // もしデータが0件の場合の処理（エラーを防ぐ）
    if (state.data.length === 0) {
        g.select(".chart-elements").selectAll("*").transition().duration(500).style("opacity", 0).remove();
        g.select(".x-axis").selectAll("*").remove();
        g.select(".y-axis").selectAll("*").remove();
        g.select(".y-grid").selectAll("*").remove();
        return;
    }

    // グラフ種類の判定と該当する描画関数の呼び出し
    if (state.chartType === 'bar') {
        renderBarChart(g, innerWidth, innerHeight);
    } else {
        renderLineChart(g, innerWidth, innerHeight);
    }
}

/**
 * 棒グラフ（Bar Chart）の描画ロジック
 */
function renderBarChart(g, innerWidth, innerHeight) {
    const data = state.data;
    const t = d3.transition().duration(750);
    
    // X軸のスケール（カテゴリ名ごとの等間隔スケール）
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.id)) // IDを一意のドメインとして使用
        .range([0, innerWidth])
        .padding(0.3);

    // Y軸のスケール（数値の高さ） - 少しゆとりを持たせる(1.1倍)
    const maxValue = d3.max(data, d => d.value) || 100;
    const yScale = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([innerHeight, 0]);

    // X軸の描画
    g.select(".x-axis")
        .transition(t)
        .call(d3.axisBottom(xScale).tickFormat(id => {
            const item = data.find(d => d.id === id);
            return item ? item.name : "";
        }).tickSize(0).tickPadding(10))
        .selectAll("text")
        // 日本語文字列などが重ならないようナナメに配置
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end")
        // XSS対策：直接テキストをセットするだけでなくサニタイズされた値を表示
        .text(id => {
             const item = data.find(d => d.id === id);
             return item ? sanitizeText(item.name) : "";
        });

    // Y軸の描画
    g.select(".y-axis")
        .transition(t)
        .call(d3.axisLeft(yScale).ticks(5));

    // 横グリッド線の描画
    g.select(".y-grid")
        .transition(t)
        .call(d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-innerWidth)
            .tickFormat("")
        );

    // --- 折れ線グラフ固有の要素が存在する場合は退場させる ---
    const elements = g.select(".chart-elements");
    elements.selectAll(".line-path").transition(t).style("opacity", 0).remove();
    elements.selectAll(".dot").transition(t).attr("r", 0).remove();
    // ----------------------------------------------------

    // 対象となるrect（棒）を選択（Data Join: IDをキーにする）
    const rects = elements.selectAll("rect.bar")
        .data(data, d => d.id);

    // 1. Exit（データが削除されて消えゆく要素の処理）
    // 下に沈むようにして消える
    rects.exit()
        .transition(t)
        .attr("y", innerHeight)
        .attr("height", 0)
        .style("opacity", 0)
        .remove();

    // 2. Update（データ更新・グラフ切り替え時など、既存要素の更新）
    rects.transition(t)
        .attr("x", d => xScale(d.id))
        .attr("width", xScale.bandwidth())
        .attr("y", d => yScale(d.value))
        .attr("height", d => innerHeight - yScale(d.value));

    // 3. Enter（新しく追加される要素の処理）
    rects.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.id))
        .attr("width", xScale.bandwidth())
        // 初期状態は、X軸(高さ0)からスタート
        .attr("y", innerHeight)
        .attr("height", 0)
        // ホバー時のツールチップ表示処理
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`${sanitizeText(d.name)}<br/><b>${d.value}</b>`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        // 直後にトランジションで目標の高さへ伸ばす
        .transition(t)
        .attr("y", d => yScale(d.value))
        .attr("height", d => innerHeight - yScale(d.value));
}

/**
 * 折れ線グラフ（Line Chart）の描画ロジック
 */
function renderLineChart(g, innerWidth, innerHeight) {
    const data = state.data;
    const t = d3.transition().duration(750);
    
    // Line Chartの場合は、点が等間隔の中央に来る PointScale を使用
    const xScale = d3.scalePoint()
        .domain(data.map(d => d.id))
        .range([0, innerWidth])
        .padding(0.5);

    const maxValue = d3.max(data, d => d.value) || 100;
    const yScale = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([innerHeight, 0]);

    // X軸の更新
    g.select(".x-axis")
        .transition(t)
        .call(d3.axisBottom(xScale).tickFormat(id => {
            const item = data.find(d => d.id === id);
            return item ? item.name : "";
        }).tickSize(0).tickPadding(10))
        .selectAll("text")
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end")
        .text(id => {
             const item = data.find(d => d.id === id);
             return item ? sanitizeText(item.name) : "";
        });

    // Y軸の更新
    g.select(".y-axis")
        .transition(t)
        .call(d3.axisLeft(yScale).ticks(5));
        
    // 横グリッド線の更新
    g.select(".y-grid")
        .transition(t)
        .call(d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-innerWidth)
            .tickFormat("")
        );

    const elements = g.select(".chart-elements");

    // --- 棒グラフ固有の要素が存在する場合は退場させる ---
    elements.selectAll("rect.bar")
        .transition(t)
        .attr("y", innerHeight)
        .attr("height", 0)
        .style("opacity", 0)
        .remove();
    // ----------------------------------------------------

    // 折れ線を生成する関数 (d3.line)
    const lineGenerator = d3.line()
        .x(d => xScale(d.id))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX); // スムーズな曲線

    // 1. パス（線）の描画
    let path = elements.select(".line-path");
    
    if (path.empty()) {
        // パスがなければ新しく作成
        path = elements.append("path")
            .attr("class", "line line-path")
            .attr("d", lineGenerator(data));
            
        // 線を左から右へ徐々に書き上げるアニメーション (dasharray)
        const totalLength = path.node().getTotalLength();
        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition().duration(1000)
            .attr("stroke-dashoffset", 0);
    } else {
        // すでに存在すれば、なめらかに変形させる
        path.datum(data)
            .transition(t)
            .attr("d", lineGenerator);
    }

    // 2. ドット（点）の描画（IDをキーに束縛）
    const dots = elements.selectAll("circle.dot")
        .data(data, d => d.id);

    // 削除されたドットが消える処理
    dots.exit()
        .transition(t)
        .attr("r", 0)
        .remove();

    // 更新されるドットの移動（新しい座標へ）
    dots.transition(t)
        .attr("cx", d => xScale(d.id))
        .attr("cy", d => yScale(d.value));

    // 新しいドットの追加
    dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.id))
        .attr("cy", innerHeight) // 下からスタート
        .attr("r", 0)
        // ホバー時の処理
        .on("mouseover", function(event, d) {
            d3.select(this).transition().duration(100).attr("r", 6);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`${sanitizeText(d.name)}<br/><b>${d.value}</b>`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).transition().duration(100).attr("r", 4);
            tooltip.transition().duration(500).style("opacity", 0);
        })
        // 目標の高さへ移動
        .transition(t)
        .attr("cy", d => yScale(d.value))
        .attr("r", 4); // 最終的な半径
}

/**
 * リサイズ時の再描画イベント
 * ブラウザの幅が変わったときにグラフサイズも合わせるよう再描画します
 */
window.addEventListener('resize', () => {
    // 短時間に何度も再描画されないようdebounceの簡易版を実装
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        drawChart();
    }, 200);
});

// 初期化実行: 初期データをもとにUIと最初のグラフを描画
updateUI();
