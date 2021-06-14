(() => {

	// 定数
	const types = ['easy', 'normal', 'hyper', 'ex'];

	const medals = [
		'meda_a.png',
		'meda_b.png', 'meda_c.png', 'meda_d.png',
		'meda_e.png', 'meda_f.png', 'meda_g.png',
		'meda_k.png', // メモ: イージークリアの順番注意
		'meda_h.png', 'meda_i.png', 'meda_j.png'
		// , 'meda_none.png'
	];

	const ranks = [
		'rank_s.png',
		'rank_a3.png', 'rank_a2.png', 'rank_a1.png',
		'rank_b.png', 'rank_c.png', 'rank_d.png', 'rank_e.png'
		// , 'rank_none.png'
	];

	// 
	const data = {
		results: null,
		filteredResults: null,
		resultsElement: null
	};

	// 
	/**
	 * テキストファイル読み込み
	 */
	const readAsText = file => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => { resolve(reader.result); };
			reader.onerror = () => { reader.abort(); reject(reader.error); };
			reader.readAsText(file);
		});
	};

	/**
	 * ファイル読み込み
	 */
	const loadFile = async event => {

		data.results = []; // メモ: 読み込み枚に初期化する必要あり

		const results = data.results;

		// 
		const file = event.target.files[0];
		const text = await readAsText(file);
		const musicResults = JSON.parse(text);

		// スコアデータを楽曲単位から楽曲情報と譜面単位リザルト情報に分割
		for (const musicResult of musicResults) {

			// 楽曲情報
			const music = {
				id: musicResult.id,
				genre: musicResult.genre,
				title: musicResult.title
			};

			// リザルト情報
			const resultsByType = musicResult.score;

			for (const type of types) {

				const resultByType = resultsByType[type];

				const result = {
					music,
					type,
					medal: resultByType.medal,
					rank: resultByType.rank,
					score: resultByType.score
				};

				results.push(result);

			}

		}

		// 
		const totalTablesElement = document.getElementById('totalTables');

		totalTablesElement.innerHTML = getTotalTablesHTML();

		// 
		const medalsTableElement = document.getElementById('medalsTable');
		const ranksTableElement  = document.getElementById('ranksTable');

		// TODO: ポインタイベントの処理をより厳密に。外から D&D してきたときに誤反応する
		medalsTableElement.addEventListener('pointerup', filterResultsOnEvent);
		ranksTableElement.addEventListener('pointerup', filterResultsOnEvent);

		data.resultsElement = document.getElementById('results');

		filterResults(medalsTable, 0, 0);

		// 
		// event.currentTarget.value = ''; // メモ: 再読み込み対策

	};

	const getTotalTablesHTML = () => {

		const results = data.results;

		// 
		const countOfMedals = (medal, type) => results.filter(r => r.type === type && r.medal === medal).length;
		const tableMedals = medals.map(medal => types.map(type => countOfMedals(medal, type)));

		const countOfRanks = (rank, type) => results.filter(r => r.type === type && r.rank === rank).length;
		const tableRanks = ranks.map(rank => types.map(type => countOfRanks(rank, type)));

		// 表示
		const tableMedalsHTML = '<table class="total-table medals-table" id="medalsTable">' +
			'<thead><tr>' +
			'<th></th>' + types.map(type => '<th>' + type.toUpperCase() + '</th>').join('') + '<th>合計</th>' +
			'</tr></thead>' +
			'<tbody>' +
			tableMedals.map((row, i) => '<tr><th><img src="' + getMedalImageURL(medals[i]) + '"></th>' + row.map(cell => '<td>' + cell + '</td>').join('') + '<td>' + row.reduce((sum, cell) => sum + cell) + '</td></tr>').join('') +
			'<tr><th>PLAYED</th>' + types.map((type, i) => '<td>' + tableMedals.reduce((sum, row) => sum + row[i], 0) + '</td>').join('') + '<td>' + tableMedals.reduce((sum, row) => sum + row.reduce((sum, cell) => sum + cell), 0) + '</td></tr>' +
			'</tbody>' +
			'</table>';

		const tableRanksHTML = '<table class="total-table ranks-table" id="ranksTable">' +
			'<thead><tr>' +
			'<th></th>' + types.map(type => '<th>' + type.toUpperCase() + '</th>').join('') + '<th>合計</th>' +
			'</tr></thead>' +
			'<tbody>' +
			tableRanks.map((row, i) => '<tr><th><img src="' + getMedalImageURL(ranks[i]) + '"></th>' + row.map(cell => '<td>' + cell + '</td>').join('') + '<td>' + row.reduce((sum, cell) => sum + cell) + '</td></tr>').join('') +
			'<tr><th>RANKED</th>' + types.map((type, i) => '<td>' + tableRanks.reduce((sum, row) => sum + row[i], 0) + '</td>').join('') + '<td>' + tableRanks.reduce((sum, row) => sum + row.reduce((sum, cell) => sum + cell), 0) + '</td></tr>' +
			'</tbody>' +
			'</table>';

		return tableMedalsHTML + tableRanksHTML;

	};

	// 
	const filterResultsOnEvent = event => {

		const tableElement = event.currentTarget;

		const cellElement = getClosestCellElement(event.target, tableElement);

		if ( ! cellElement ) return;

		const row    = cellElement.parentNode.rowIndex;
		const column = cellElement.cellIndex;

		// 
		filterResults(tableElement, row, column);

	};

	/**
	 * 自身または祖先からテーブルのセルの要素を取得
	 * 
	 * セル以外の要素の場合は undefined を返す
	 */
	const getClosestCellElement = (element, tableElement) => {

		while ( ! /^td|th$/i.test(element.tagName) ) {
			if ( element === tableElement ) return;
			element = element.parentNode;
			if ( ! element ) return;
		}

		return element;

	};

	const filterResults = (tableElement, row, column) => {

		// 
		const id = tableElement.id;

		if ( ! ['medalsTable', 'ranksTable'].includes(id) ) return;

		const rowMax = ('medalsTable' === id ? medals.length : ranks.length) + 1; // + 2 - 1 = + 1
		const rowInner = (0 === row || row === rowMax) ? null : row - 1;

		const columnMax = types.length + 1; // + 2 - 1 = + 1
		const columnInner = (0 === column || column === columnMax) ? null : column - 1;

		// 
		if ( 'medalsTable' === id )  {
			filterMedals(rowInner, columnInner);
		} else {
			filterRanks(rowInner, columnInner);
		}

		updateTotalTable(tableElement, row, column, rowInner === null, columnInner === null); // メモ: 否定演算子 ! にしてしまうと 0 も true になってしまう
		updateFilteredResult(20, 0);

	};

	const filterMedals = (medalIndex, typeIndex) => {

		const results = data.results;

		// メモ: 否定演算子 ! にしてしまうと 0 も true になってしまう
		const medal = medalIndex === null ? null : medals[medalIndex];
		const type  = typeIndex === null ? null : types[typeIndex];

		// 
		data.filteredResults = results.filter(r => ((medal === null && medals.includes(r.medal)) || r.medal === medal)
			&& (type === null || r.type === type));

	};

	const filterRanks = (rankIndex, typeIndex) => {

		const results = data.results;

		// メモ: 否定演算子 ! にしてしまうと 0 も true になってしまう
		const rank = rankIndex === null ? null : ranks[rankIndex];
		const type = typeIndex === null ? null : types[typeIndex];

		// 
		data.filteredResults = results.filter(r => ((rank === null && ranks.includes(r.rank)) || r.rank === rank)
			&& (type === null || r.type === type));

	};

	const updateTotalTable = (tableElement, row, column, isOuterRow, isOuterColumn) => {

		// 表示状態を初期化
		const selectedElements = document.querySelectorAll('[data-selected]');

		for (const selectedElement of selectedElements) {

			const selectedType = selectedElement.dataset.selected;

			selectedElement.classList.remove('total-table--selected-' + selectedType);
			delete selectedElement.dataset.selected;

		}

		// 表示状態を更新
		const cellElement = tableElement.rows[row].cells[column];

		cellElement.classList.add('total-table--selected-cell');
		cellElement.dataset.selected = 'cell';

		if ( isOuterRow && isOuterColumn ) {
			tableElement.classList.add('total-table--selected-all');
			tableElement.dataset.selected = 'all';
		} else if ( isOuterRow ) {
			tableElement.classList.add('total-table--selected-column-' + column);
			tableElement.dataset.selected = 'column-' + column;
		} else if ( isOuterColumn ) {
			const rowElement = tableElement.rows[row];
			rowElement.classList.add('total-table--selected-row');
			rowElement.dataset.selected = 'row';
		}

	};

	const updateFilteredResult = (limit, offset = 0) => {

		const selectedResults = data.filteredResults.slice(offset, offset + limit);

		const tableRanksHTML = '<table class="results-table" id="resultsTable">' +
			'<thead><tr>' +
			'<th>ジャンル名</th><th>曲名</th><th>タイプ</th><th>メダル</th><th>ランク</th><th>スコア</th>' +
			'</tr></thead>' +
			'<tbody>' +
			selectedResults.map(r => '<tr>' + (r.music.genre !== r.music.title ? '<td>' + escapeHTML(r.music.genre) + '</td><td>' + escapeHTML(r.music.title) + '</td>' : '<td colspan="2">' + escapeHTML(r.music.genre) + '</td>') + '<td>' + r.type.toUpperCase() + '</td><td><img src="' + getMedalImageURL(r.medal) + '"></td><td><img src="' + getMedalImageURL(r.rank) + '"></td><td>' + r.score + '</td></tr>').join('') +
			'</tbody>' +
			'</table>';

		data.resultsElement.innerHTML = tableRanksHTML;

	};

	const escapeHTML = html => html.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

	// 
	const getMedalImageURL = name => 'https://eacache.s.konaminet.jp/game/popn/riddles/images/p/common/medal/' + name;

	// 
	document.getElementById('file').addEventListener('change', loadFile);

})();
