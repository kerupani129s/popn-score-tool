const DEBUG = true;

/**
 * 頭文字リスト
 * 
 * 日本語は Shift-JIS の半角カタカナを URL エンコードしたもの
 */
const initials = [
	'%B1', '%B2', '%B3', '%B4', '%B5',
	'%B6', '%B7', '%B8', '%B9', '%BA',
	'%BB', '%BC', '%BD', '%BE', '%BF',
	'%C0', '%C1', '%C2', '%C3', '%C4',
	'%C5', '%C6', '%C7', '%C8', '%C9',
	'%CA', '%CB', '%CC', '%CD', '%CE',
	'%CF', '%D0', '%D1', '%D2', '%D3',
	'%D4', '%D5', '%D6',
	'%D7', '%D8', '%D9', '%DA', '%DB',
	'%DC', '%A6', '%DD',
	'A', 'B', 'C', 'D', 'E', 'F', 'G',
	'H', 'I', 'J', 'K', 'L', 'M', 'N',
	'O', 'P', 'Q', 'R', 'S', 'T', 'U',
	'V', 'W', 'X', 'Y', 'Z',
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	'@', '*'
];

/**
 * Blob を Shift-JIS の文字列とみなして UTF-8 文字列にパース
 */
const parseBlob = blob => {
	return new Promise(resolve => {
		const reader = new FileReader();
		reader.onload = () => { resolve(reader.result) };
		reader.readAsText(blob, 'shift-jis');
	});
};

/**
 * HTML 文字列を DOM にパース
 */
const parseHTML = string => new DOMParser().parseFromString(string, 'text/html');

/**
 * ページをパース
 */
const parsePage = dom => {

	const array = [];

	// 取得
	const table = dom.getElementsByClassName('mu_list_table').item(0);

	if ( table !== null ) {
		const elements = table.getElementsByTagName('li');

		for (let i = 1; i < elements.length; i++) { // 見出しの行があるので i = 1 から
			const row = parseRow(elements.item(i));
			array.push(row);
		}
	}

	return array;

};

/**
 * 行パース
 */
const parseRow = element => {

	// 曲名・ジャンル名・ID
	const music = element.getElementsByClassName('col_music').item(0);

	const music_link  = music.getElementsByTagName('a').item(0);
	const music_title = music_link.textContent;
	const music_id    = parseQuery(music_link.search.slice(1)).no;

	const music_genre = music.getElementsByTagName('div').item(0).textContent;

	// メダル・スコア
	const column_easy   = element.getElementsByClassName('col_5').item(0);
	const column_normal = element.getElementsByClassName('col_normal').item(0);
	const column_hyper  = element.getElementsByClassName('col_hyper').item(0);
	const column_ex     = element.getElementsByClassName('col_ex').item(0);

	const img_easy   = column_easy.getElementsByTagName('img');
	const img_normal = column_normal.getElementsByTagName('img');
	const img_hyper  = column_hyper.getElementsByTagName('img');
	const img_ex     = column_ex.getElementsByTagName('img');

	const medal_easy   = getMedal(img_easy.item(0).src);
	const medal_normal = getMedal(img_normal.item(0).src);
	const medal_hyper  = getMedal(img_hyper.item(0).src);
	const medal_ex     = getMedal(img_ex.item(0).src);

	const rank_easy   = getRank(img_easy.item(1).src);
	const rank_normal = getRank(img_normal.item(1).src);
	const rank_hyper  = getRank(img_hyper.item(1).src);
	const rank_ex     = getRank(img_ex.item(1).src);

	const score_easy   = column_easy.textContent;
	const score_normal = column_normal.textContent;
	const score_hyper  = column_hyper.textContent;
	const score_ex     = column_ex.textContent;

	// 
	const row = {
		'genre': music_genre, 'title': music_title, 'id': music_id,
		'score': {
			'easy'  : {'medal': medal_easy  , 'rank': rank_easy  , 'score': score_easy  },
			'normal': {'medal': medal_normal, 'rank': rank_normal, 'score': score_normal},
			'hyper' : {'medal': medal_hyper , 'rank': rank_hyper , 'score': score_hyper },
			'ex'    : {'medal': medal_ex    , 'rank': rank_ex    , 'score': score_ex    }
		}
	};

	return row;

};

/**
 * クエリ文字列をオブジェクトにパース
 */
const parseQuery = query => {
	const pairs = query.split('&');
	const object = {};
	pairs.forEach(pairString => {
		const pair = pairString.split('=');
		const key   = decodeURIComponent(pair[0]);
		const value = decodeURIComponent(pair[1]);
		object[key] = value;
	});
	return object;
};

/**
 * メダル・ランク画像パスパース
 */
const getMedal = src => /([^\/]+)$/.exec(src)[1];
const getRank = getMedal;

/**
 * 頭文字ごとに読み込み
 */
const loadScoreOfInitial = initial => loadScoreOfPage(initial, 0);

const loadScoreOfPage = (initial, page) => {

	const url = 'https://p.eagate.573.jp/game/popn/peace/p/playdata/mu_top.html?page=' + page + '&genre=' + initial;

	return fetch(url)
		.then(response  => response.blob())
		.then(blob => parseBlob(blob))
		.then(string => {
			const array = parsePage(parseHTML(string));
			if ( array.length === 20 ) {
				return loadScoreOfPage(initial, page + 1).then(arrayNext => array.concat(arrayNext));
			} else {
				return array;
			}
		});

};

/**
 * ファイル保存ダイアログ表示
 * 
 * Chrome, Firefox, Edge 対応
 */
const showSaveFileDialog = (data, name, type) => {

	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([data], {'type': type}));
	a.download = name;

	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

};

/**
 * メイン
 */
const main = () => {

	// 取得開始
	document.write('取得中です...<br>');
	document.write('ブックマークレットを続けて実行しないでください<br>');

	// 取得
	if ( DEBUG ) { // テスト

		loadScoreOfInitial(initials[0]).then(array => {
			console.log('取得終了 (' + array.length + ' 曲)');
			const json = JSON.stringify(array, null, '    ');
			showSaveFileDialog(json, 'score.json', 'application/json')
		});

	} else { // 本番

		const promises = initials.map(initial => loadScoreOfInitial(initial));

		Promise.all(promises).then(arrays => {

			const array = arrays
				.reduce((accumulator, currentValue) => accumulator.concat(currentValue)) // Promise.all() の結果をまとめる
				.filter((x, i, a) => a.findIndex(x2 => x.id === x2.id) === i); // 重複削除

			// 結果保存
			document.write('取得終了 (' + array.length + ' 曲)<br>');
			const json = JSON.stringify(array, null, '    ');
			showSaveFileDialog(json, 'score.json', 'application/json');

		});

	}

};

main();
