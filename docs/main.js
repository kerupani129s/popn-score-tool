(() => {

	// 定数
	const resultsLimit   = 20;
	const pagesLimitHalf = 4;
	const pagesLimit     = pagesLimitHalf * 2 + 1;

	// 
	const types = ['easy', 'normal', 'hyper', 'ex'];

	const medals = [
		'meda_a.png',
		'meda_b.png', 'meda_c.png', 'meda_d.png',
		'meda_e.png', 'meda_f.png', 'meda_g.png',
		'meda_k.png', // メモ: イージークリアの順番注意
		'meda_h.png', 'meda_i.png', 'meda_j.png',
		// 'meda_none.png',
	];

	const ranks = [
		'rank_s.png',
		'rank_a3.png', 'rank_a2.png', 'rank_a1.png',
		'rank_b.png', 'rank_c.png', 'rank_d.png', 'rank_e.png',
		// 'rank_none.png',
	];

	// 
	const getMedalImageURL = name => 'https://eacache.s.konaminet.jp/game/popn/riddles/images/p/common/medal/' + name;

	const filterResults = (() => {

		const resultsElement = document.getElementById('results');
		const paginationElements = ['pagination-header', 'pagination-footer'].map(id => document.getElementById(id));

		const filterResults = (tableElement, row, column, results) => {

			// 
			const id = tableElement.id;

			if ( ! ['medals-table', 'ranks-table'].includes(id) ) return;

			const rowMax = ('medals-table' === id ? medals.length : ranks.length) + 1; // + 2 - 1 = + 1
			const rowInner = (0 === row || row === rowMax) ? null : row - 1;

			const columnMax = types.length + 1; // + 2 - 1 = + 1
			const columnInner = (0 === column || column === columnMax) ? null : column - 1;

			// 
			const filteredResults = 'medals-table' === id ? filterMedals(rowInner, columnInner, results) : filterRanks(rowInner, columnInner, results);

			updateTotalTable(tableElement, row, column, rowInner === null, columnInner === null); // メモ: 否定演算子 ! にしてしまうと 0 も true になってしまう
			updateFilteredResult(filteredResults);

		};

		const filterMedals = (medalIndex, typeIndex, results) => {

			// メモ: 否定演算子 ! にしてしまうと 0 も true になってしまう
			const medal = medalIndex === null ? null : medals[medalIndex];
			const type  = typeIndex === null ? null : types[typeIndex];

			// 
			return results.filter(r => ((medal === null && medals.includes(r.medal)) || r.medal === medal)
				&& (type === null || r.type === type));

		};

		const filterRanks = (rankIndex, typeIndex, results) => {

			// メモ: 否定演算子 ! にしてしまうと 0 も true になってしまう
			const rank = rankIndex === null ? null : ranks[rankIndex];
			const type = typeIndex === null ? null : types[typeIndex];

			// 
			return results.filter(r => ((rank === null && ranks.includes(r.rank)) || r.rank === rank)
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

		const updateFilteredResultOnEvent = (event, filteredResults) => {
			const pageNumberElement = event.currentTarget;
			const pageNo = pageNumberElement.dataset.pageNo;
			const pageIndex = pageNo - 1;
			updateFilteredResult(filteredResults, pageIndex);
		};

		const updateFilteredResult = (filteredResults, pageIndex = 0) => {

			// リザルト表
			const offset = pageIndex * resultsLimit;

			const selectedResults = filteredResults.slice(offset, offset + resultsLimit);

			resultsElement.innerHTML = getSelectedResultsHTML(selectedResults);

			// ページネーション
			const pageNo   = pageIndex + 1;
			const pageLast = Math.ceil(filteredResults.length / resultsLimit);

			const paginationHTML = pageLast !== 0 ? getPaginationHTML(pageNo, pageLast) : '';

			for (const paginationElement of paginationElements) {

				paginationElement.innerHTML = paginationHTML;

				// 
				if ( 2 <= pageLast ) {

					const pageNumberElements = paginationElement.querySelectorAll('[data-page-no]');

					for (const pageNumberElement of pageNumberElements) {
						// TODO: ポインタイベントの処理をより厳密に。外から D&D してきたときに誤反応する
						pageNumberElement.addEventListener('pointerup', event => updateFilteredResultOnEvent(event, filteredResults));
					}

				}

			}

		};

		const getSelectedResultsHTML = selectedResults => {

			if ( selectedResults.length === 0 ) {
				return '<div class="results-empty">条件に一致するデータはありません。</div>';
			}

			return '<table id="results-table" class="results-table">' +
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
						paginationHTML += '<span class="page-ellipsis">...</span>';

				}

				for (let p = pageCenter - pagesLimitHalf; p <=  pageCenter + pagesLimitHalf; p++) {
					paginationHTML += getPageNumberHTML(p, pageNo === p);
				}

				if ( pageCenter <= pageLast - pagesLimitHalf - 1 ) {

					if ( pageCenter <= pageLast - pagesLimitHalf - 2 )
						paginationHTML += '<span class="page-ellipsis">...</span>';

					paginationHTML += getPageNumberHTML(pageLast);

				}

			}

			return paginationHTML;

		};

		const getPageNumberHTML = (pageNo, isCurrentPage = false) => (isCurrentPage ? '<span class="page-number page-number--current">' + pageNo + '</span>' : '<span class="page-number" data-page-no="' + pageNo + '">' + pageNo + '</span>');

		const escapeHTML = html => html
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;').replaceAll('\'', '&#39;');

		return filterResults;

	})();

	// 
	const convert = (() => {

		const totalTablesElement = document.getElementById('total-tables');

		const readAsText = file => new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);
			reader.readAsText(file);
		});

		const convert = async file => {

			// 初期化
			const results = [];

			// 
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
				const resultsByType = musicResult.results || musicResult.score; // メモ: ツール旧バージョン互換性対策

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
			totalTablesElement.innerHTML = getTotalTablesHTML(results);

			// 
			const medalsTableElement = document.getElementById('medals-table');
			const ranksTableElement  = document.getElementById('ranks-table');

			// TODO: ポインタイベントの処理をより厳密に。外から D&D してきたときに誤反応する
			medalsTableElement.addEventListener('pointerup', event => filterResultsOnEvent(event, results));
			ranksTableElement.addEventListener('pointerup', event => filterResultsOnEvent(event, results));

			// 
			filterResults(medalsTableElement, 0, 0, results);

		};

		const getTotalTablesHTML = results => {

			const countOfMedals = (medal, type) => results.filter(r => r.type === type && r.medal === medal).length;
			const tableMedals = medals.map(medal => types.map(type => countOfMedals(medal, type)));

			const countOfRanks = (rank, type) => results.filter(r => r.type === type && r.rank === rank).length;
			const tableRanks = ranks.map(rank => types.map(type => countOfRanks(rank, type)));

			// 表示
			const tableMedalsHTML = '<table id="medals-table" class="total-table medals-table">' +
				'<thead><tr>' +
				'<th></th>' + types.map(type => '<th>' + type.toUpperCase() + '</th>').join('') + '<th>合計</th>' +
				'</tr></thead>' +
				'<tbody>' +
				tableMedals.map((row, i) => '<tr><th><img src="' + getMedalImageURL(medals[i]) + '"></th>' + row.map(cell => '<td>' + cell + '</td>').join('') + '<td>' + row.reduce((sum, cell) => sum + cell) + '</td></tr>').join('') +
				'<tr><th>PLAYED</th>' + types.map((type, i) => '<td>' + tableMedals.reduce((sum, row) => sum + row[i], 0) + '</td>').join('') + '<td>' + tableMedals.reduce((sum, row) => sum + row.reduce((sum, cell) => sum + cell), 0) + '</td></tr>' +
				'</tbody>' +
				'</table>';

			const tableRanksHTML = '<table id="ranks-table" class="total-table ranks-table">' +
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
		const filterResultsOnEvent = (event, results) => {

			const tableElement = event.currentTarget;

			const cellElement = getClosestCellElement(event.target, tableElement);

			if ( ! cellElement ) return;

			const row    = cellElement.parentNode.rowIndex;
			const column = cellElement.cellIndex;

			// 
			filterResults(tableElement, row, column, results);

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

		return convert;

	})();

	(() => {

		const inputFileElement = document.getElementById('file');

		const convertOnEvent = async file => {
			await convert(file);
		};

		// 
		inputFileElement.addEventListener('change', event => {
			const files = event.target.files;
			if ( files.length !== 1 ) return;
			convertOnEvent(files[0]);
		});

	})();

})();
