(() => {

	if ( ! 'clipboard' in navigator ) return;

	const clipboard = navigator.clipboard;

	const copyText = async copyButtonElement => {

		const id = copyButtonElement.dataset['for'];
		const element = document.getElementById(id);
		const text = element.textContent;

		await clipboard.writeText(text);

	};

	(() => {

		const copyButtonElements = document.querySelectorAll('[data-type="copy"]');

		for (const copyButtonElement of copyButtonElements) {
			copyButtonElement.addEventListener('click', () => {
				copyText(copyButtonElement); // メモ: await していないため注意
			});
			copyButtonElement.disabled = false;
		}

	})();

})();
