let screens = {};

class Screen {
    constructor(screen_id) {
        this._isVisible = false;
        this.screen_id = screen_id;
        this.element = document.getElementById(this.screen_id);

        if (this.element) {
            this.element.classList.add('screen');
            this.element.style.display = 'none';
            this.default = this.element.cloneNode(true);
        } else return false;

        return screens[this.screen_id] = this;
    }

    render(...args) {
        if (this._isVisible)
            return false;
        
        this.element.style.display = '';
        this._isVisible = true;

        if (this.onstart)
            this.onstart(...args);
    }


    close(...args) {
        if (!this._isVisible)
            return false;
        
        this.element.style.display = 'none';
        this.element.innerHTML = this.default.innerHTML;
        this._isVisible = false;

        if (this.onclose)
            this.onclose(...args);
    }

    hide(...args) {
        if (!this._isVisible)
            return false;
        
        this.element.style.display = 'none';
        this._isVisible = false;

        if (this.onhide)
            this.onhide(...args);
    }
}

Screen.updateDefault = function(name) {
    for (let i in screens) {
		screens[i].default = screens[i].element.cloneNode(true);
	}
}

Screen.get = function(name) {
    return screens[name];
}

Screen.renderAll = function(...args) {
    for (let i in screens)
        screens[i].render(...args);
}

Screen.closeAll = function(...args) {
    for (let i in screens)
        screens[i].close(...args);
}

Screen.hideAll = function(...args) {
    for (let i in screens)
        screens[i].hide(...args);
}