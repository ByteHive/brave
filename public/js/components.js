// UI Components Module - Modern ES6 version
import { createElement, addClass } from './utils.js';

export const components = {
    openCards: {},

    editButton() {
        return createElement('<a href="#" class="fas fa-edit" title="Edit"></a>');
    },

    deleteButton() {
        return createElement('<a href="#" class="fas fa-trash-alt" title="Delete"></a>');
    },

    seekButton() {
        return createElement('<a href="#" class="fas fa-arrows-alt-h" title="Seek"></a>');
    },

    cutButton() {
        return createElement('<a href="#" class="fas fa-cut" title="Cut"></a>');
    },

    overlayButton() {
        return createElement('<a href="#" class="fas fa-layer-group" title="Overlay"></a>');
    },

    removeButton() {
        return createElement('<a href="#" class="fas fa-eye-slash" title="Remove from mix"></a>');
    },

    mutedButton() {
        return createElement('<a href="#" class="fas fa-volume-off" title="Unmute"></a>');
    },

    unmutedButton() {
        return createElement('<a href="#" class="fas fa-volume-up" title="Mute"></a>');
    },

    stateIcon(state, currentState) {
        const selected = state === currentState;
        const icons = {
            'PLAYING': 'fa-play',
            'PAUSED': 'fa-pause',
            'READY': 'fa-stop',
            'NULL': 'fa-exclamation-triangle'
        };
        const iconName = icons[state];
        const classNames = `fas ${iconName}${selected ? '' : ' icon-unselected'}`;
        return `<a href="#" class="${classNames}" data-state="${state}"></a>`;
    },

    card(block) {
        const card = createElement('<div class="block-card"></div>');
        const header = createElement('<div class="block-card-head"></div>');

        if (block.title) header.append(block.title);

        if (block.options) {
            const options = createElement('<div class="option-icons"></div>');
            block.options.forEach(opt => options.appendChild(opt));
            header.appendChild(options);
        }

        card.appendChild(header);
        if (block.state) card.appendChild(block.state);
        if (block.mixOptions) {
            if (Array.isArray(block.mixOptions)) {
                block.mixOptions.forEach(opt => card.appendChild(opt));
            } else {
                card.appendChild(block.mixOptions);
            }
        }

        const cardBody = createElement('<div class="block-card-body"></div>');
        if (Array.isArray(block.body)) {
            block.body.forEach(item => cardBody.appendChild(item));
        } else {
            cardBody.appendChild(block.body);
        }

        if (!this.openCards[block.title]) {
            cardBody.style.display = 'none';
        }

        const toggleSwitch = createElement('<a href="#">Toggle</a>');
        const setToggleMsg = (target) => {
            target.innerHTML = this.openCards[block.title] ? this.hideDetails() : this.showDetails();
        };

        toggleSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            this.openCards[block.title] = !this.openCards[block.title];
            cardBody.style.display = this.openCards[block.title] ? '' : 'none';
            setToggleMsg(e.target);
        });

        setToggleMsg(toggleSwitch);

        const toggle = createElement('<div class="block-card-toggle"></div>');
        toggle.appendChild(toggleSwitch);
        card.appendChild(toggle);
        card.appendChild(cardBody);

        const wrapper = createElement('<div class="block-card-outer col-xl-3 col-lg-4 col-md-6 col-12"></div>');
        wrapper.appendChild(card);
        return wrapper;
    },

    stateBox(item, onClick) {
        const stateBoxDetails = this._stateIcons(item);
        const container = createElement('<div></div>');
        container.appendChild(stateBoxDetails.value);

        stateBoxDetails.value.addEventListener('click', function(e) {
            if (e.target.dataset.state) {
                e.preventDefault();
                const state = e.target.dataset.state;
                onClick(item.id, state);
            }
        });

        if (item.position) {
            container.append(' ', window.prettyDuration(item.position));
        }

        addClass(container, stateBoxDetails.className);
        return container;
    },

    _stateIcons(item) {
        let desc = ' ' + item.state;
        if (item.state === 'PAUSED' && item.hasOwnProperty('buffering_percent') && item.buffering_percent !== 100) {
            desc = ' BUFFERING (' + item.buffering_percent + '%)';
        } else if (item.desired_state && item.desired_state !== item.state) {
            desc = ' ' + item.state + ' &rarr; ' + item.desired_state;
        }

        const iconsHtml = `
            <div class="state-icons">
                ${this.stateIcon('NULL', item.state)}
                ${this.stateIcon('READY', item.state)}
                ${this.stateIcon('PAUSED', item.state)}
                ${this.stateIcon('PLAYING', item.state)}
                ${desc}
            </div>
        `;

        return {
            value: createElement(iconsHtml),
            className: item.state
        };
    },

    volumeInput(volume) {
        const DEFAULT_VOLUME = 0.8;
        if (volume === undefined || volume === null) volume = DEFAULT_VOLUME;
        volume *= 100; // as it's a percentage

        const formGroup = window.formGroup({
            id: 'input-volume',
            label: 'Volume',
            name: 'volume',
            type: 'range',
            min: 0,
            max: 100,
            step: 10,
            value: volume
        });

        const slider = formGroup.querySelector('input[type="range"]');
        const msg = createElement(`<span>${volume}%</span>`);
        formGroup.appendChild(msg);

        slider.addEventListener('input', (e) => {
            msg.textContent = e.target.value + '%';
        });

        return formGroup;
    },

    hideDetails() {
        return '<i class="fas fa-caret-down"></i> Hide details';
    },

    showDetails() {
        return '<i class="fas fa-caret-right"></i> Show details';
    },

    getMixOptions(src) {
        if (!window.mixersHandler || !window.mixersHandler.items) return [];

        return window.mixersHandler.items.map(mixer => {
            if (!mixer.sources || src === mixer) return null;

            const foundThis = mixer.sources.find(x => x.uid === src.uid);
            const inMix = foundThis && foundThis.in_mix ? 'In mix' : 'Not in mix';
            const div = createElement('<div class="mix-option"></div>');

            if (foundThis && foundThis.in_mix) {
                addClass(div, 'mix-option-showing');
                const removeButton = this.removeButton();
                removeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.mixersHandler.remove(mixer, src);
                });
                const buttons = createElement('<div class="option-icons"></div>');
                buttons.appendChild(removeButton);
                div.appendChild(buttons);
            } else {
                addClass(div, 'mix-option-hidden');
                const cutButton = this.cutButton();
                cutButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.mixersHandler.cut(mixer, src);
                });
                const overlayButton = this.overlayButton();
                overlayButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.mixersHandler.overlay(mixer, src);
                });
                const buttons = createElement('<div class="option-icons"></div>');
                buttons.appendChild(cutButton);
                buttons.appendChild(overlayButton);
                div.appendChild(buttons);
            }

            div.append(`<strong>Mixer ${mixer.id}:</strong> ${inMix}`);
            return div;
        }).filter(x => x !== null);
    }
};

export default components;
