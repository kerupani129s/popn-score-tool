(() => {

	window.addEventListener('DOMContentLoaded', () => {
		document.getElementById('file').addEventListener('change', loadFile);
	});

	/**
	 * テキストファイル読み込み
	 */
	const readAsText = file => {
		return new Promise(resolve => {
			const reader = new FileReader();
			reader.readAsText(file);
			reader.onload = () => { resolve(reader.result); };
		});
	};

	/**
	 * ファイル読み込み
	 */
	const loadFile = event => {

		readAsText(event.target.files[0]).then(text => {
			printScore(JSON.parse(text));
		});

		// event.currentTarget.value = ''; // 再読み込み対策

	};

	/**
	 * 表示
	 */
	const printScore = array => {

		const types = ['easy', 'normal', 'hyper', 'ex'];

		const medals = [
			'meda_a.png',
			'meda_b.png', 'meda_c.png', 'meda_d.png',
			'meda_e.png', 'meda_f.png', 'meda_g.png',
			'meda_k.png',
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
		const tableMedals = medals.map(medal => types.map(type => array.filter(x => x.score[type].medal === medal).length));
		const tableRanks = ranks.map(rank => types.map(type => array.filter(x => x.score[type].rank === rank).length));

		// 表示
		const html = '<div class="tables">' +
			'<table>' +
			'<tr><th></th>' + types.map(type => '<th>' + type.toUpperCase() + '</th>').join('') + '<th>合計</th></tr>' +
			tableMedals.map((row, i) => '<tr><th><img src="https://p.eagate.573.jp/game/popn/peace/p/images/p/common/medal/' + medals[i] + '"></th>' + row.map(cell => '<td>' + cell + '</td>').join('') + '<td>' + row.reduce((sum, cell) => sum + cell) + '</td></tr>').join('') +
			'<tr><th>PLAY</th>' + types.map((type, i) => '<td>' + tableMedals.reduce((sum, row) => sum + row[i], 0) + '</td>').join('') + '<td>' + tableMedals.reduce((sum, row) => sum + row.reduce((sum, cell) => sum + cell), 0) + '</td></tr>' +
			'</table>' +
			'<table>' +
			'<tr><th></th>' + types.map(type => '<th>' + type.toUpperCase() + '</th>').join('') + '<th>合計</th></tr>' +
			tableRanks.map((row, i) => '<tr><th><img src="https://p.eagate.573.jp/game/popn/peace/p/images/p/common/medal/' + ranks[i] + '"></th>' + row.map(cell => '<td>' + cell + '</td>').join('') + '<td>' + row.reduce((sum, cell) => sum + cell) + '</td></tr>').join('') +
			'<tr><th>RANK</th>' + types.map((type, i) => '<td>' + tableRanks.reduce((sum, row) => sum + row[i], 0) + '</td>').join('') + '<td>' + tableRanks.reduce((sum, row) => sum + row.reduce((sum, cell) => sum + cell), 0) + '</td></tr>' +
			'</table>' +
			'</div>';

		document.getElementById('result').innerHTML = html;

	};

})();
