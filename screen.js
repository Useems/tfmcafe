let screens = {};

(() => {
	let screens_dom = document.getElementsByClassName('screen');
	for (let i = 0; i <	screens_dom.length; i++) {
		screens_dom[i].style.display = 'none';
		
		screens[screens_dom[i].id] = {
			visible: false,
			element: screens_dom[i],
			default: screens_dom[i].cloneNode(true),
			f: f = screens_functions[screens_dom[i].id],
			render: function(...args) {
				this.visible = true;

				console.log('[Screen] opened: ' + screens_dom[i].id);
				this.element.style.display = '';

				if (this.f && this.f[0]) {
					this.f[0].call(this, ...args);
				}
			},
			hide: function(...args) {
				if (!this.visible)
					return false;
				else
					this.visible = false;
				
				console.log('[Screen] hidden: ' + screens_dom[i].id);
				this.element.style.display = 'none';

				if (this.f && this.f[1]) {
					this.f[1].call(this, ...args);
				}
			},
			close: function(...args) {
				if (!this.visible)
					return false;
				else
					this.visible = false;
				
				console.log('[Screen] closed: ' + screens_dom[i].id);
				this.element.style.display = 'none';

				if (this.f && this.f[1]) {
					this.f[1].call(this, ...args);
				}
				
				this.element.innerHTML = this.default.innerHTML;
			}
		};
	}
})();