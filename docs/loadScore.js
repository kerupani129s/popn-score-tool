(d => {
	// 旧バージョン対策
	// キャッシュ対策
	const s = d.createElement('script');
	s.src = 'https://ssdh233.github.io/popn-score-tool/load-play-data.js?timestamp=' + Date.now() + 'ms';
	d.head.appendChild(s);
})(document);
