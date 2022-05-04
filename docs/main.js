(() => {

	// 定数
	const MEDAL_IMAGE_PARAM = 'v0.2.0';

	// 
	const RESULT_LIMIT    = 20;
	const PAGE_LIMIT_HALF = 4;
	const PAGE_LIMIT      = PAGE_LIMIT_HALF * 2 + 1;

	// 
	const MEDAL_NONE = 'meda_none.png';
	const RANK_NONE = 'rank_none.png';
	const SCORE_NONE = '-';

	// 
	const TYPES = ['easy', 'normal', 'hyper', 'ex'];

	const MEDALS = [
		'meda_a.png',
		'meda_b.png', 'meda_c.png', 'meda_d.png',
		'meda_e.png', 'meda_f.png', 'meda_g.png',
		'meda_k.png', // メモ: イージークリアの順番注意
		'meda_h.png', 'meda_i.png', 'meda_j.png',
		// MEDAL_NONE,
	];

	const RANKS = [
		'rank_s.png',
		'rank_a3.png', 'rank_a2.png', 'rank_a1.png',
		'rank_b.png', 'rank_c.png', 'rank_d.png', 'rank_e.png',
		// RANK_NONE,
	];

	// 
	const TYPES_ABBR = new Map(['E', 'N', 'H', 'EX'].map((abbr, i) => [TYPES[i], abbr]));

	const MEDALS_ALT = new Map([
		'金★',
		'銀★', '銀◆', '銀●',
		'銅★', '銅◆', '銅●',
		'若葉', // メモ: イージークリアの順番注意
		'黒★', '黒◆', '黒●',
		// '-',
	].map((alt, i) => [MEDALS[i], alt]));

	const RANKS_ALT = new Map([
		'S',
		'AAA', 'AA', 'A',
		'B', 'C', 'D', 'E',
		// '-',
	].map((alt, i) => [RANKS[i], alt]));

	// 
	const getPlayDataFromFile = (() => {

		const readAsText = file => new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);
			reader.readAsText(file);
		});

		const isInvalidResult = result => {

			// メモ: '0' は falsy でない
			//       空文字列 '' は falsy
			if ( ! result.music.id ) return true; // id は一意であればいいため、文字列に限る必要はない
			if ( typeof result.music.genre !== 'string' || ! result.music.genre ) return true;
			if ( typeof result.music.title !== 'string' || ! result.music.title ) return true;

			if ( ! TYPES.includes(result.type) ) return true;
			if ( result.medal !== MEDAL_NONE && ! MEDALS.includes(result.medal) ) return true;
			if ( result.rank !== RANK_NONE && ! RANKS.includes(result.rank) ) return true; // メモ: プレー済みでも resultByType.rank === RANK_NONE の可能性あり
			if ( Number.isNaN(result.score) ) return true;

			return false;

		};

		const getResults = rawPlayData => {

			const musicResults = rawPlayData; // メモ: 今後、仕様変更する可能性あり

			// スコアデータを楽曲単位から楽曲情報と譜面単位リザルト情報に分割
			const results = [];

			for (const musicResult of musicResults) {

				// 楽曲情報
				const music = {
					id: musicResult.id,
					genre: musicResult.genre.trim(),
					title: musicResult.title.trim(),
				};

				// リザルト情報
				const resultsByType = musicResult.results || musicResult.score; // メモ: ツール旧バージョン互換性対策

				for (const type of TYPES) {

					const resultByType = resultsByType[type];

					if ( resultByType.score === SCORE_NONE ) continue;

					const result = {
						music,
						type,
						medal: resultByType.medal,
						rank: resultByType.rank, // メモ: プレー済みでも resultByType.rank === RANK_NONE の可能性あり
						score: Number(resultByType.score),
					};

					if ( isInvalidResult(result) ) {
						console.error(result);
						throw new Error('スコアデータが正しくありません');
					}

					results.push(result);

				}

			}

			return results;

		};

		const getPlayDataFromFile = async file => {

			const text = await readAsText(file);
			const rawPlayData = JSON.parse(text);

			const results = getResults(rawPlayData);

			return {
				results,
			};

		};

		return getPlayDataFromFile;

	})();

	// 
	const getMedalImageURL = name => './images/medal/svg/' + name.replace('.png', '.svg') + '?' + MEDAL_IMAGE_PARAM;

	const getMedalImageHTML = medal => '<img src="' + getMedalImageURL(medal) + '" alt="' + MEDALS_ALT.get(medal) + '">';
	const getRankImageHTML = rank => '<img src="' + getMedalImageURL(rank) + '" alt="' + RANKS_ALT.get(rank) + '">';

	// 
	const filterResults = (() => {

		const selectedResultsElement = document.getElementById('selected-results');
		const paginationElements = ['pagination-header', 'pagination-footer'].map(id => document.getElementById(id));

		// 
		const resultHeaderHTML = (
			'<tr>' +
			'<th class="music music-genre">ジャンル名</th>' +
			'<th class="music music-title">曲名</th>' +
			'<th class="result-type">' +
			'<span class="result-type__abbr" title="タイプ">タ</span>' +
			'<span class="result-type__exp">タイプ</span>' +
			'</th>' +
			'<th class="result-medal">' +
			'<span class="result-medal__abbr" title="メダル">メ</span>' +
			'<span class="result-medal__exp">メダル</span>' +
			'</th>' +
			'<th class="result-rank">' +
			'<span class="result-rank__abbr" title="ランク">ラ</span>' +
			'<span class="result-rank__exp">ランク</span>' +
			'</th>' +
			'<th class="result-score">スコア</th>' +
			'</tr>'
		);

		const escapeHTML = html => html
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;').replaceAll('\'', '&#39;');

		const getResultTypeHTML = type => {
			const typeText = type.toUpperCase();
			return '<span class="result-type__abbr" title="' + typeText + '">' + TYPES_ABBR.get(type) + '</span>' +
				'<span class="result-type__exp">' + typeText + '</span>';
		};

		const getResultHTML = r => (
			'<tr>' +
			(r.music.genre !== r.music.title ? (
				'<td class="music music-genre">' + escapeHTML(r.music.genre) + '</td>' +
				'<td class="music music-title">' + escapeHTML(r.music.title) + '</td>'
			) : (
				'<td colspan="2" class="music">' + escapeHTML(r.music.genre) + '</td>'
			)) +
			'<td class="result-type">' + getResultTypeHTML(r.type) + '</td>' +
			'<td class="result-medal">' + getMedalImageHTML(r.medal) + '</td>' +
			'<td class="result-rank">' + getRankImageHTML(r.rank) + '</td>' +
			'<td class="result-score">' + r.score + '</td>' +
			'</tr>'
		);

		const getSelectedResultsHTML = selectedResults => {

			if ( selectedResults.length === 0 ) {
				return '<div class="filtered-results-empty">条件に一致するデータはありません。</div>';
			}

			return '<table class="selected-results-table">' +
				'<thead>' + resultHeaderHTML + '</thead>' +
				'<tbody>' + selectedResults.map(getResultHTML).join('') + '</tbody>' +
				'</table>';

		};

		// 
		const getPageNumberHTML = (pageNo, isCurrentPage = false) => (
			isCurrentPage ? (
				'<span class="page-number page-number--current">' + pageNo + '</span>'
			) : (
				'<span role="button" tabindex="0" class="page-number" data-page-no="' + pageNo + '">' + pageNo + '</span>'
			)
		);

		const getPaginationHTML = (pageNo, pageTotal) => {

			let paginationHTML = '';

			if ( pageTotal <= PAGE_LIMIT ) {

				for (let p = 1; p <= pageTotal; p++) {
					paginationHTML += getPageNumberHTML(p, pageNo === p);
				}

			} else {

				const pageNoCenterMin = 1 + PAGE_LIMIT_HALF;
				const pageNoCenterMax = pageTotal - PAGE_LIMIT_HALF;
				const pageNoCenter = Math.min(pageNoCenterMax, Math.max(pageNoCenterMin, pageNo));

				// 
				if ( pageNoCenterMin < pageNoCenter ) {
					paginationHTML += getPageNumberHTML(1);
					if ( pageNoCenterMin + 1 < pageNoCenter ) {
						paginationHTML += '<span class="page-ellipsis">...</span>';
					}
				}

				// 
				for (let p = pageNoCenter - PAGE_LIMIT_HALF; p <=  pageNoCenter + PAGE_LIMIT_HALF; p++) {
					paginationHTML += getPageNumberHTML(p, pageNo === p);
				}

				// 
				if ( pageNoCenter < pageNoCenterMax ) {
					if ( pageNoCenter < pageNoCenterMax - 1 ) {
						paginationHTML += '<span class="page-ellipsis">...</span>';
					}
					paginationHTML += getPageNumberHTML(pageTotal);
				}

			}

			return paginationHTML;

		};

		// 
		const updateFilteredResultsOnEvent = (event, filteredResults) => {
			const pageNumberElement = event.currentTarget;
			const pageNo = Number(pageNumberElement.dataset.pageNo);
			updateFilteredResults(filteredResults, pageNo);
		};

		const updatePagination = (paginationElement, paginationHTML, filteredResults, pageTotal) => {

			paginationElement.innerHTML = paginationHTML;

			// 
			if ( 2 <= pageTotal ) {

				const pageNumberElements = paginationElement.querySelectorAll('[data-page-no]');

				for (const pageNumberElement of pageNumberElements) {
					pageNumberElement.addEventListener('click', event => (
						updateFilteredResultsOnEvent(event, filteredResults)
					));
				}

			}

		};

		// 
		const updateSelectedResults = (filteredResults, pageNo) => {

			const pageIndex = pageNo - 1;
			const offset = pageIndex * RESULT_LIMIT;

			const selectedResults = filteredResults.slice(offset, offset + RESULT_LIMIT);

			selectedResultsElement.innerHTML = getSelectedResultsHTML(selectedResults);

		};

		const updatePagenations = (filteredResults, pageNo) => {

			const pageTotal = Math.ceil(filteredResults.length / RESULT_LIMIT);

			const paginationHTML = pageTotal !== 0 ? getPaginationHTML(pageNo, pageTotal) : '';

			for (const paginationElement of paginationElements) {
				updatePagination(paginationElement, paginationHTML, filteredResults, pageTotal);
			}

		};

		const updateFilteredResults = (filteredResults, pageNo = 1) => {
			updateSelectedResults(filteredResults, pageNo);
			updatePagenations(filteredResults, pageNo);
		};

		// 
		const filterResults = (results, callback) => {
			const filteredResults = results.filter(callback);
			updateFilteredResults(filteredResults);
		};

		return filterResults;

	})();

	const renderTotalTables = (() => {

		const totalTablesElement = document.getElementById('total-tables');

		// 
		const createTotalTableElement = (table, columnHeaders, rowHeaders, rowHeaderOfColumnTotal) => {

			const rowTotal = table.map(row => row.reduce((sum, cell) => sum + cell));
			const columnTotal = table.reduce((sumRow, row) => sumRow.map((sumCell, i) => sumCell + row[i]));
			const grandTotal = rowTotal.reduce((sum, cell) => sum + cell);

			// 
			const tableElement = document.createElement('table');

			tableElement.innerHTML = '<colgroup>' +
				'<col>'.repeat(columnHeaders.length) +
				'</colgroup>';

			// 
			tableElement.createTHead().innerHTML = '<tr>' +
				columnHeaders.map(cell => '<th tabindex="0">' + cell + '</th>').join('') +
				'</tr>';

			tableElement.createTBody().innerHTML = table.map((row, i) => (
				'<tr>' +
				'<th tabindex="0">' + rowHeaders[i] + '</th>' +
				row.map(cell => '<td tabindex="0">' + cell + '</td>').join('') +
				'<td tabindex="0">' + rowTotal[i] + '</td>' +
				'</tr>'
			)).join('');

			tableElement.createTFoot().innerHTML = '<tr>' +
				'<th tabindex="0">' + rowHeaderOfColumnTotal + '</th>' +
				columnTotal.map(cell => '<td tabindex="0">' + cell + '</td>').join('') +
				'<td tabindex="0">' + grandTotal + '</td>' +
				'</tr>';

			return tableElement;

		};

		// 
		const getTypeHTML = type => {
			const typeText = type.toUpperCase();
			return '<span title="' + typeText + '">' + TYPES_ABBR.get(type) + '</span>';
		};

		const columnHeaders = (() => {
			const row = TYPES.map(type => getTypeHTML(type));
			row.unshift('');
			row.push('合計');
			return row;
		})();

		const rowHeadersOfMedals = MEDALS.map(getMedalImageHTML);
		const rowHeadersOfRanks = RANKS.map(getRankImageHTML);

		// 
		const countOfMedals = (results, medal, type) => results.filter(r => r.type === type && r.medal === medal).length;

		const createMedalsTableElement = results => {

			const table = MEDALS.map(medal => TYPES.map(type => countOfMedals(results, medal, type)));

			// 
			const tableElement = createTotalTableElement(table, columnHeaders, rowHeadersOfMedals, 'PLAYED');

			tableElement.id = 'medals-table';
			tableElement.classList.add('total-table', 'medals-table');

			return tableElement;

		};

		// 
		const countOfRanks = (results, rank, type) => results.filter(r => r.type === type && r.rank === rank).length;

		const createRanksTableElement = results => {

			const table = RANKS.map(rank => TYPES.map(type => countOfRanks(results, rank, type)));

			// 
			const tableElement = createTotalTableElement(table, columnHeaders, rowHeadersOfRanks, 'RANKED');

			tableElement.id = 'ranks-table';
			tableElement.classList.add('total-table', 'ranks-table');

			return tableElement;

		};

		// 
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

		// 
		const select = (element, type) => {

			element.classList.add('total-table--selected-' + type);
			element.dataset.selected = type;

		};

		const unselect = element => {

			const type = element.dataset.selected;

			element.classList.remove('total-table--selected-' + type);
			delete element.dataset.selected;

		};

		const unselectAll = () => {

			const selectedElements = totalTablesElement.querySelectorAll('[data-selected]');

			for (const selectedElement of selectedElements) {
				unselect(selectedElement);
			}

		};

		const selectTotalTableCell = (tableElement, row, column, isOuterRow, isOuterColumn) => {

			const cellElement = tableElement.rows[row].cells[column];

			select(cellElement, 'cell');

			if ( isOuterRow && isOuterColumn ) {
				select(tableElement, 'all');
			} else if ( isOuterRow ) {
				const columnElement = tableElement.getElementsByTagName('col')[column];
				select(columnElement, 'column');
			} else if ( isOuterColumn ) {
				const rowElement = tableElement.rows[row];
				select(rowElement, 'row');
			}

		};

		const filterResultsByMedalsTable = (results, tableElement, row, column) => {

			const medal = (0 === row || row === MEDALS.length + 1) ? null : MEDALS[row - 1];
			const type = (0 === column || column === TYPES.length + 1) ? null : TYPES[column - 1];

			selectTotalTableCell(tableElement, row, column, medal === null, type === null);

			// 
			filterResults(results, r => (
				((medal === null && MEDALS.includes(r.medal)) || r.medal === medal) &&
				(type === null || r.type === type)
			));

		};

		const filterResultsByRanksTable = (results, tableElement, row, column) => {

			const rank = (0 === row || row === RANKS.length + 1) ? null : RANKS[row - 1];
			const type = (0 === column || column === TYPES.length + 1) ? null : TYPES[column - 1];

			selectTotalTableCell(tableElement, row, column, rank === null, type === null);

			// 
			filterResults(results, r => (
				((rank === null && RANKS.includes(r.rank)) || r.rank === rank) &&
				(type === null || r.type === type)
			));

		};

		const filterResultsOnEvent = (event, results) => {

			const tableElement = event.currentTarget;

			const cellElement = getClosestCellElement(event.target, tableElement);

			if ( ! cellElement ) return;

			const row    = cellElement.parentNode.rowIndex;
			const column = cellElement.cellIndex;

			// 
			unselectAll();

			// 
			const id = tableElement.id;

			if ( 'medals-table' === id ) {
				filterResultsByMedalsTable(results, tableElement, row, column);
			} else if ( 'ranks-table' === id ) {
				filterResultsByRanksTable(results, tableElement, row, column);
			}

		};

		// 
		const renderTotalTables = results => {

			// 
			totalTablesElement.innerHTML = '';

			const medalsTableElement = totalTablesElement.appendChild(createMedalsTableElement(results));
			const ranksTableElement = totalTablesElement.appendChild(createRanksTableElement(results));

			medalsTableElement.addEventListener('click', event => filterResultsOnEvent(event, results));
			ranksTableElement.addEventListener('click', event => filterResultsOnEvent(event, results));

			// 
			filterResultsByMedalsTable(results, medalsTableElement, 0, 0);

		};

		return renderTotalTables;

	})();

	// 
	const convert = (() => {

		const resultError = document.getElementById('result-error');
		const resultOk = document.getElementById('result-ok');

		// 
		const showElement = element => {
			element.classList.add('displayed');
		};

		const hideElement = element => {
			element.classList.remove('displayed');
		};

		// 
		const initElements = () => {
			hideElement(resultError);
			hideElement(resultOk);
		};

		const renderError = error => {
			console.error(error);
		};

		const convert = async file => {

			initElements();

			try {

				const playData = await getPlayDataFromFile(file);

				renderTotalTables(playData.results);

				showElement(resultOk);

			} catch (error) {
				renderError(error);
				showElement(resultError);
			}

		};

		return convert;

	})();

	(() => {

		const inputFileElement = document.getElementById('file');

		const convertOnEvent = async file => {

			inputFileElement.disabled = true;

			await convert(file);

			inputFileElement.disabled = false;

		};

		// 
		inputFileElement.addEventListener('click', () => {
			inputFileElement.value = '';
		});

		inputFileElement.addEventListener('change', event => {
			const files = event.target.files;
			if ( files.length !== 1 ) return;
			convertOnEvent(files[0]); // メモ: await していないため注意
		});

		inputFileElement.disabled = false;

	})();

})();
