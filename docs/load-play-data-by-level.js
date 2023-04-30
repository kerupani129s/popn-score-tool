/*!
 * ポップンスコアツール v0.3.0
 *
 * ポップンスコアツール is licensed under the MIT License.
 * Copyright (c) 2019 ケルパニ＠猫
 * https://github.com/ssdh233/popn-score-tool/blob/master/LICENSE
 */
(async () => {

	const DEBUG = false;

	// 
	const WAIT_TIME_IN_MILLISECONDS = 100;

	const POPN_RESULTS_URL = 'https://p.eagate.573.jp/game/popn/unilab/playdata/mu_lv.html';

	// ウェブサイトを確認
	const validateWebsite = () => {

		if ( document.domain !== 'p.eagate.573.jp' ) {
			throw new Error('https://p.eagate.573.jp/ 上で実行してください');
		}

		if ( ! ea_common_template.userstatus.state.login ) {
			throw new Error('ログインしてください');
		}

		if ( ! ea_common_template.userstatus.state.subscription ) {
			throw new Error('e-amusement 有料サービスへの加入が必要です');
		}

		if ( ! ea_common_template.userstatus.state.eapass ) {
			throw new Error('参照中の e-amusement pass がありません');
		}

		if ( ! ea_common_template.userstatus.state.playdata ) {
			throw new Error('プレーデータがありません');
		}

	};

	try {
		validateWebsite();
	} catch (error) {
		document.body.innerHTML = '<div style="padding: 12px; font-size: 16px; line-height: 1.5; background-color: #fff; color: #000;">' +
			'<p style="font-weight: bold;">ポップンスコアツール</p>' +
			'<p style="color: #f00;">' + error.message + '</p>' +
			'</div>';

		return;
	}

	// 重複起動チェック
	// 
	// メモ: ウェブサイトの確認の後に行う
	const preventMultipleStarts = () => {

		if ( window.BOOKMARKLET_TOOL_POPN ) {
			throw new Error('既に実行済みです');
		}

		window.BOOKMARKLET_TOOL_POPN = true;

	};

	try {
		preventMultipleStarts();
	} catch (error) {
		const errorStatus = document.getElementById('error-status');
		errorStatus.innerHTML = error.message;
		return;
	}

	// 
	const loadResults = (() => {

		const readAsText = (blob, encoding = null) => new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);
			reader.readAsText(blob, encoding);
		});

		const domParser = new DOMParser();
		const parseHTML = html => domParser.parseFromString(html, 'text/html');

		// 
		const parseQuery = query => new URLSearchParams(query);

		const fileNameRegEx = /([^/]*)$/;
		const getMedal = src => fileNameRegEx.exec(src)[1];
		const getRank = getMedal;

		const parseRow = (element) => {
			// 曲名・ジャンル名・ID
			const music_div = element.getElementsByClassName('col_music_lv')[0];

			const music_link  = music_div.getElementsByTagName('a')[0];
			const title = music_link.textContent;
			const id    = parseQuery(music_link.search).get('no'); // メモ: 楽曲 ID は変更される場合がある
			const genre = music_div.getElementsByTagName('div')[0].textContent;
			
			const diff = element.getElementsByClassName("col_normal_lv")[0].textContent;
			const level = element.getElementsByClassName("col_hyper_lv")[0].textContent;

			// メダル・スコア
			const result_div   = element.getElementsByClassName('col_ex_lv')[0];

			const img   = result_div.getElementsByTagName('img');
			const medal   = getMedal(img[0].src);
			const rank   = getRank(img[1].src);
			const score  = result_div.textContent;

			// 
			const row = {
				genre,
				title,
				id,
				level,
				diff,
				medal,
				rank,
				score,
			};

			return row;

		};

		// 
		const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

		const loadResults = async (results, level, page) => {

			const url = POPN_RESULTS_URL + '?page=' + page + '&level=' + level;

			// 
			await delay(WAIT_TIME_IN_MILLISECONDS);

			// 
			const response = await fetch(url, { credentials: 'include' });
			const html = await response.text();
			const doc = parseHTML(html);

			// 
			const table = doc.getElementsByClassName('mu_list_table')[0];

			// メモ: あるジャンル名の存在しないページではテーブルが存在するが、
			//       ジャンル名自体が存在しない場合はテーブルが存在しないため、
			//       テーブルが見つからない場合でもエラー扱いにしない
			if ( ! table ) {
				return 0;
			}

			// 
			const elements = table.getElementsByTagName('li');

			if ( 0 === elements.length ) {
				throw new Error('li が見つかりませんでした');
			}

			for (let i = 1; i < elements.length; i++) { // 見出しの行があるので i = 1 から
				const element = elements[i];
				const row = parseRow(element);
				results.push(row);
			}

			return elements.length - 1;

		};

		return loadResults;

	})();

	await (async () => {

		const MAX_LEVEL = 50;

		const LEVELS = Array(MAX_LEVEL).fill(0).map((_, i) => i + 1);

		document.body.innerHTML = '<div style="padding: 12px; font-size: 16px; line-height: 1.5; background-color: #fff; color: #000;">' +
			'<p style="font-weight: bold;">ポップンスコアツール</p>' +
			'<p id="status"></p>' +
			'<p id="error-status" style="color: #f00;"></p>' +
			'<p>' +
			'<label for="progress">進捗:</label> ' +
			'<progress id="progress" max="' + LEVELS.length + '" value="0"></progress>' +
			' <span id="percentage">0</span>%' +
			'</p>' +
			'</div>';

		const status = document.getElementById('status');
		const errorStatus = document.getElementById('error-status');
		const progress = document.getElementById('progress');
		const percentage = document.getElementById('percentage');

		const getResults = async () => {

			const results = [];

			let totalPages = 0; // 確認用

			for (let i = DEBUG ? 47 : 0; i < LEVELS.length; i++) {

				const level = LEVELS[i];

				for (let page = 0; ; page++) {
					const count = await loadResults(results, level, page);
					if ( 0 !== count ) totalPages++; // 確認用
					if ( 20 !== count ) break;
				}

				// 進行状況表示 (等速で進行しない)
				progress.value = i + 1; // max = LEVELS.length
				percentage.textContent = Math.round(100 * progress.value / progress.max);

			}

			console.log('The total number of pages: ' + totalPages); // 確認用

			return results;


		};

		// 
		const main = async () => {

			try {

				// 取得開始
				status.innerHTML = '取得中 ...';

				const results = await getResults();

				if ( results.length === 0 ) {
					throw new Error('取得結果が空です');
				}

				// データ変換
				const json = JSON.stringify(results, null, '    ');
				const blob = new Blob([json], { 'type': 'application/json' });
				const url = URL.createObjectURL(blob); // メモ: 本ツールの性質上、URL.revokeObjectURL() しない

				// 取得終了
				status.innerHTML = '取得終了 (' + results.length + ' 曲)<br>' +
					'<a id="download-link" href="' + url + '" download="score.json">スコアデータ (JSON 形式) ダウンロード</a><br>' +
					'※自動でダウンロードが開始されない場合や誤ってダウンロードをキャンセルした場合等は上記のリンクからダウンロードできます。';

				document.getElementById('download-link').click();

			} catch (error) {
				status.innerHTML = '取得中断';
				errorStatus.innerHTML = '取得失敗';
				console.error(error);
			}

		};

		await main();

	})();

})();
