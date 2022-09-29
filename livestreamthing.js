class LiveStreamWrapper extends HTMLElement {

  #start;
  #end;
  #duration;

  css = `<style></style>`;

  constructor() {
    super();

    if (this.isConnected) {
      this.#init();
    }
  }

  static get observedAttributes() {
    return [
      'start',
      'end',
    ];
  }

  attributeChangedCallback() {
    this.#create();
  }

  set playerId(item) {
    this.setAttribute('player-id', item);
  }
  get expirationTime() {
    const { time } = this.#makeSignedPlaybackWarning();
    return time;
  }

  connectedCallback() {
    this.#init();
  }

  #init() {
    if (this.#isInit) {
      this.#create();
      return;
    }
    this.#isInit = true;

    const template = document.createElement('template');

    template.innerHTML = `
      ${this.css}
      <section id="root"></section>
      <slot name="start"></slot>
      <slot name="end"></slot>
      <slot name="player"></slot>
    `;

    const shadow = this.attachShadow({ mode: 'open' });
    const html = template.content.cloneNode(true);
    shadow.appendChild(html);

    this.#divs = {
      root: this.shadowRoot?.querySelector('#root'),
      start: this.shadowRoot?.querySelector('slot[name=start]'),
      end: this.shadowRoot?.querySelector('slot[name=end]'),
      player: this.shadowRoot?.querySelector('slot[name=player]'),
    };

    this.#create();
  }

  #create_prev() {
    this.#params = this.getAttribute('params') || '';

    if (!this.#buttonTitle) this.#buttonTitle = 'Copy Player Code';

    let playerParams = {};
    let attributeParams = {};

    if (this.#playback) {
      const player = document.querySelector(`#${this.#playback}`);
      if (player && player.hasAttributes()) {
        for (const attr of player.attributes) {
          playerParams[attr.name] = attr.value;
        }
      }
    }

    if (this.#params) {
      try {
        attributeParams = typeof(this.#params) === 'string' ? JSON.parse(this.#params) : this.#params;
      } catch(e) {
        console.error(
          'JSON decode failed. Check the parameter has valid JSON.'
        );
      }
    }

    const params = {
      ...attributeParams,
      ...playerParams,
    };

    this.#hasToken = Object.keys(params).find(key => key === 'playback-token') !== undefined;
    if (this.#hasToken) {
      let token = Object.entries(params).find(key => key[0] === 'playback-token' );
      if (token && token.length > 0) this.#token = token[1];
    }

    this.#divs.root.innerHTML = '';

    this.#playercode = this.#createCode(params);
    const codearea = this.#makeCodeArea(this.#playercode);
    if (this.#showCode) {
      this.#divs.root.innerHTML += codearea;
    }

    if (this.#showCode && this.shadowRoot) {
      this.#divs.code = this.shadowRoot?.querySelector('.code_container');
      if (this.#divs.code) {
        this.#setCopyEvent(this.#renderHTML(this.#playercode), this.#divs.code);
      }
    }

    if (this.#divs.copyButton && this.#playercode && !this.#copyButtonListenerSet) {
      this.#setCopyButtonEvent(this.#renderHTML(this.#playercode), this.#divs.copyButton);
      this.#copyButtonListenerSet = true;
    }
    if (this.#copyButton) {
      this.#divs.copyButton.style.display = 'unset';
    }
    if (!this.#copyButton) {
      this.#divs.copyButton.style.display = 'none';
    }

  }

}
window.customElements.define('mux-livestream-wrapper', LiveStreamWrapper);
