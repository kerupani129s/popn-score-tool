/*!
 * ポップンスコアツール v0.3.0
 *
 * ポップンスコアツール is licensed under the MIT License.
 * Copyright (c) 2019 ケルパニ＠猫
 * https://github.com/kerupani129s/popn-score-tool/blob/master/LICENSE
 */
(async () => {

	const DEBUG = false;

	// 
	const WAIT_TIME_IN_MILLISECONDS = 100;

	const POPN_RESULTS_URL = 'https://p.eagate.573.jp/game/popn/unilab/playdata/mu_top.html';

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

		const parseRow = element => {

			// 曲名・ジャンル名・ID
			const music = element.getElementsByClassName('col_music')[0];

			const music_link  = music.getElementsByTagName('a')[0];
			const music_title = music_link.textContent;
			const music_id    = parseQuery(music_link.search).get('no'); // メモ: 楽曲 ID は変更される場合がある

			const music_genre = music.getElementsByTagName('div')[0].textContent;

			// メダル・スコア
			const column_easy   = element.getElementsByClassName('col_5')[0];
			const column_normal = element.getElementsByClassName('col_normal')[0];
			const column_hyper  = element.getElementsByClassName('col_hyper')[0];
			const column_ex     = element.getElementsByClassName('col_ex')[0];

			const img_easy   = column_easy.getElementsByTagName('img');
			const img_normal = column_normal.getElementsByTagName('img');
			const img_hyper  = column_hyper.getElementsByTagName('img');
			const img_ex     = column_ex.getElementsByTagName('img');

			const medal_easy   = getMedal(img_easy[0].src);
			const medal_normal = getMedal(img_normal[0].src);
			const medal_hyper  = getMedal(img_hyper[0].src);
			const medal_ex     = getMedal(img_ex[0].src);

			const rank_easy   = getRank(img_easy[1].src);
			const rank_normal = getRank(img_normal[1].src);
			const rank_hyper  = getRank(img_hyper[1].src);
			const rank_ex     = getRank(img_ex[1].src);

			const score_easy   = column_easy.textContent;
			const score_normal = column_normal.textContent;
			const score_hyper  = column_hyper.textContent;
			const score_ex     = column_ex.textContent;

			// 
			const row = {
				'genre': music_genre, 'title': music_title, 'id': music_id,
				'results': {
					'easy'  : { 'medal': medal_easy  , 'rank': rank_easy  , 'score': score_easy   },
					'normal': { 'medal': medal_normal, 'rank': rank_normal, 'score': score_normal },
					'hyper' : { 'medal': medal_hyper , 'rank': rank_hyper , 'score': score_hyper  },
					'ex'    : { 'medal': medal_ex    , 'rank': rank_ex    , 'score': score_ex     },
				},
			};

			return row;

		};

		// 
		const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

		const loadResults = async (results, initial, page) => {

			const url = POPN_RESULTS_URL + '?page=' + page + '&genre=' + initial;

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

		// 頭文字リスト
		const INITIALS = [
			'ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ',
			'ｶ', 'ｷ', 'ｸ', 'ｹ', 'ｺ',
			'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ',
			'ﾀ', 'ﾁ', 'ﾂ', 'ﾃ', 'ﾄ',
			'ﾅ', 'ﾆ', 'ﾇ', 'ﾈ', 'ﾉ',
			'ﾊ', 'ﾋ', 'ﾌ', 'ﾍ', 'ﾎ',
			'ﾏ', 'ﾐ', 'ﾑ', 'ﾒ', 'ﾓ',
			'ﾔ', 'ﾕ', 'ﾖ',
			'ﾗ', 'ﾘ', 'ﾙ', 'ﾚ', 'ﾛ',
			'ﾜ', 'ｦ', 'ﾝ',
			'A', 'B', 'C', 'D', 'E', 'F', 'G',
			'H', 'I', 'J', 'K', 'L', 'M', 'N',
			'O', 'P', 'Q', 'R', 'S', 'T', 'U',
			'V', 'W', 'X', 'Y', 'Z',
			'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
			'@', '*', '「', '↑', // メモ: 公式サイトから閲覧不可な記号
		];

		document.body.innerHTML = '<div style="padding: 12px; font-size: 16px; line-height: 1.5; background-color: #fff; color: #000;">' +
			'<p style="font-weight: bold;">ポップンスコアツール</p>' +
			'<p id="status"></p>' +
			'<p id="error-status" style="color: #f00;"></p>' +
			'<p>' +
			'<label for="progress">進捗:</label> ' +
			'<progress id="progress" max="' + INITIALS.length + '" value="0"></progress>' +
			' <span id="percentage">0</span>%' +
			'</p>' +
			'</div>';

		const status = document.getElementById('status');
		const errorStatus = document.getElementById('error-status');
		const progress = document.getElementById('progress');
		const percentage = document.getElementById('percentage');

		const getResults = async () => {

			if ( DEBUG ) { // テスト

				const results = [];

				await loadResults(results, INITIALS[0], 0);

				// 進行状況表示 (疑似的に最大値)
				progress.value = INITIALS.length; // max = INITIALS.length
				percentage.textContent = Math.round(100 * progress.value / progress.max);

				return results;

			} else { // 本番

				const resultsRaw = [];

				let totalPages = 0; // 確認用

				for (let i = 0; i < INITIALS.length; i++) {

					const initial = INITIALS[i];

					for (let page = 0; ; page++) {
						const count = await loadResults(resultsRaw, initial, page);
						if ( 0 !== count ) totalPages++; // 確認用
						if ( 20 !== count ) break;
					}

					// 進行状況表示 (等速で進行しない)
					progress.value = i + 1; // max = INITIALS.length
					percentage.textContent = Math.round(100 * progress.value / progress.max);

				}

				console.log('The total number of pages: ' + totalPages); // 確認用

				// 重複削除
				const results = resultsRaw.filter((x, i, a) => a.findIndex(x2 => x.id === x2.id) === i);

				return results;

			}

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
