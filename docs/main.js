(() => {

	// 定数
	const resultsLimit   = 20;
	const pagesLimitHalf = 4;
	const pagesLimit     = pagesLimitHalf * 2 + 1;

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
		resultsElement: null,
		paginationElements: null
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

		data.paginationElements = ['paginationHeader', 'paginationFooter'].map(id => document.getElementById(id));

		// 
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
		updateFilteredResult(0);

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

	const updateFilteredResult = (pageIndex = 0) => {

		const filteredResults = data.filteredResults;

		// リザルト表
		const offset = pageIndex * resultsLimit;

		const selectedResults = filteredResults.slice(offset, offset + resultsLimit);

		data.resultsElement.innerHTML = getSelectedResultsHTML(selectedResults);

		// ページネーション
		const pageNo   = pageIndex + 1;
		const pageLast = Math.ceil(filteredResults.length / resultsLimit);

		const paginationHTML = pageLast !== 0 ? getPaginationHTML(pageNo, pageLast) : '';

		for (const paginationElement of data.paginationElements) {

			paginationElement.innerHTML = paginationHTML;

			// 
			if ( 2 <= pageLast ) {

				const pageNumberElements = paginationElement.querySelectorAll('[data-page-no]');

				for (const pageNumberElement of pageNumberElements) {
					const i = pageNumberElement.dataset.pageNo;
					// TODO: ポインタイベントの処理をより厳密に。外から D&D してきたときに誤反応する
					pageNumberElement.addEventListener('pointerup', () => { updateFilteredResult(i - 1); });
				}

			}

		}

	};

	const getSelectedResultsHTML = selectedResults => {

		if ( selectedResults.length === 0 ) {
			return '<div class="results-empty">条件に一致する楽曲はありません。</div>';
		}

		return '<table class="results-table" id="resultsTable">' +
			'<thead><tr>' +
			'<th>ジャンル名</th><th>曲名</th><th>タイプ</th><th>メダル</th><th>ランク</th><th>スコア</th>' +
			'</tr></thead>' +
			'<tbody>' +
			selectedResults.map(r => '<tr>' + (r.music.genre !== r.music.title ? '<td>' + escapeHTML(r.music.genre) + '</td><td>' + escapeHTML(r.music.title) + '</td>' : '<td colspan="2">' + escapeHTML(r.music.genre) + '</td>') + '<td>' + r.type.toUpperCase() + '</td><td><img src="' + getMedalImageURL(r.medal) + '"></td><td><img src="' + getMedalImageURL(r.rank) + '"></td><td>' + r.score + '</td></tr>').join('') +
			'</tbody>' +
			'</table>';

	};

	const getPaginationHTML = (pageNo, pageLast) => {

		let paginationHTML = '';

		if ( pageLast <= pagesLimit ) {

			for (let p = 1; p <= pageLast; p++) {
				paginationHTML += getPageNumberHTML(p, pageNo === p);
			}

		} else {

			const pageCenter = Math.min(pageLast - pagesLimitHalf, Math.max(pagesLimitHalf + 1, pageNo));

			if ( pagesLimitHalf + 2 <= pageCenter ) {

				paginationHTML += getPageNumberHTML(1);

				if ( pagesLimitHalf + 3 <= pageCenter )
					paginationHTML += '<span class="page-ellipses">...</span>';

			}

			for (let p = pageCenter - pagesLimitHalf; p <=  pageCenter + pagesLimitHalf; p++) {
				paginationHTML += getPageNumberHTML(p, pageNo === p);
			}

			if ( pageCenter <= pageLast - pagesLimitHalf - 1 ) {

				if ( pageCenter <= pageLast - pagesLimitHalf - 2 )
					paginationHTML += '<span class="page-ellipses">...</span>';

				paginationHTML += getPageNumberHTML(pageLast);

			}

		}

		return paginationHTML;

	};

	const getPageNumberHTML = (pageNo, isCurrentPage = false) => (isCurrentPage ? '<span class="page-number page-number--current">' + pageNo + '</span>' : '<span class="page-number" data-page-no="' + pageNo + '">' + pageNo + '</span>');

	const escapeHTML = html => html.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

	// 
	const getMedalImageURL = name => 'https://eacache.s.konaminet.jp/game/popn/riddles/images/p/common/medal/' + name;

	// 
	document.getElementById('file').addEventListener('change', loadFile);

})();
