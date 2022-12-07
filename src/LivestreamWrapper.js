export class LiveStreamWrapper extends HTMLElement {
  #isInit = false;
  #divs;
  #intervals = {
    clock: undefined
  };
  #time = {
    relativeStart: undefined,
    countdownClock: undefined,
    startlocaltime: undefined,
    startlocaldate: undefined,
  };
  #state = {
    status: 'inital',
    previous: ''
  };
  #isWaiting  = false;
  #isLive = false;
  #isOver = false;
  #isEndOverride = false;
  #hasInteracted = false;

  // Params
  #start; // ISO 8601
  #end;
  #duration; // in seconds.
  #isLiveToVOD = false; // Bool to show video once over.
  #simulatedlive = false;

  css = `<style>
    .hidden {
      display: none;
      visibility: hidden;
      opacity: 0;
    }
  </style>`;

  constructor() {
    super();
    if (this.isConnected) {
      this.#init();
    }

    /* Listen for any interactions. */
    // This does not work exactly as expected on iOS yet.
    /*
    const events = [
      'mousedown', 'keydown',
      'scroll', 'touchstart'
    ];

    events.forEach( event => {
      document.addEventListener(event, (e) => {
        console.log(event)
        this.#hasInteracted = true;
        this.#init();
      })
    })
    */

  }

  static get observedAttributes() {
    return [
      'start',
      'end',
      'duration',
      'live-to-vod',
      'simulated-live'
    ];
  }

  attributeChangedCallback() {
    this.#create();
  }

  set start(item) {
    this.setAttribute('start', item);
  }
  set end(item) {
    this.setAttribute('end', item);
  }
  set duration(item) {
    this.setAttribute('duration', item);
  }
  set liveToVod(item) {
    this.setAttribute('live-to-vod', item); // Works with being a bool?
  }
  set hasInteracted(item) {
    this.#hasInteracted = item;
    this.#init();
  }
  set simulatedlive(item) {
    this.#simulatedlive = item;
  }
  get time() {
    return this.#time;
  }
  get start() {
    return this.#start;
  }
  get end() {
    return this.#end
  }
  get state() {
    return this.#state;
  }
  get hasInteracted() {
    return this.#hasInteracted;
  }
  get simulatedlive() {
    return this.#simulatedlive;
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
      <slot name="landing"></slot>
      <slot name="start"></slot>
      <slot name="end"></slot>
      <slot name="player"></slot>
    `;

    const shadow = this.attachShadow({ mode: 'open' });
    const html = template.content.cloneNode(true);
    shadow.appendChild(html);

    this.#divs = {
      root: this.shadowRoot?.querySelector('#root'),
      landing: this.shadowRoot?.querySelector('slot[name=landing]'),
      start: this.shadowRoot?.querySelector('slot[name=start]'),
      end: this.shadowRoot?.querySelector('slot[name=end]'),
      player: this.shadowRoot?.querySelector('slot[name=player]'),
      countdown: this.querySelector('[data-countdown]'),
      countdownClock: this.querySelector('[data-countdown-clock]'),
      localTime: this.querySelector('[data-localtime]'),
      localDate: this.querySelector('[data-localDate]'),
    };

    this.#create();
  }

  #create() {
    this.#reset();

    this.#start    = this.getAttribute('start') || ''; // Required.
    this.#end      = this.getAttribute('end') || '';
    this.#duration = this.getAttribute('duration') || '';
    const isLiveToVOD = this.getAttribute('live-to-vod');
    const simulatedlive = this.getAttribute('simulated-live');

    if (!this.#start) {
      console.error('A start date is required.');
      this.#event('error', 'Missing a start date.', {});
      this.setLive();
      return;
    }

    // Convert to dates.
    this.#start = new Date(this.#start);
    if (this.#end) this.#end = new Date(this.#end);

    // Check if dates are valid.
    if (!LiveStreamWrapper.isValidDate(this.#start)) {
      console.error('Not able to determine the start date.')
      this.#event('error', 'Not able to determine the start date.', {});
      return;
    }
    if (this.#end && !LiveStreamWrapper.isValidDate(this.#end)) {
      this.#event('error', 'Invalid End Date formatting.', {});
    }

    // Start is before end.
    if (this.#end) {
      if (this.#start > this.#end) {
        console.warn('Event start is after end date.');
        this.#event('error', 'Event start is after end date.', {});
        this.#end = undefined;
      }
    }

    // Duration is a number.
    if (this.#duration) {
      this.#duration = Number(this.#duration);
      if (Number.isNaN(this.#duration)) {
        console.warn( `Duration is not a number we can use: "${this.getAttribute('duration')}"`)
        this.#event('error', `Duration is not a number we can use: "${this.getAttribute('duration')}"`, {})
        this.#duration = undefined;
      }
    }

    // attribute boolean fix. live-to-vod="false" will be false.
    if (isLiveToVOD !== null) {
      this.#isLiveToVOD = isLiveToVOD === 'true' ? true : false;
    }
    if (simulatedlive !== null) {
      this.#simulatedlive = simulatedlive === 'true' ? true : false;
    }

    if (!this.#end && this.#duration) {
      const end = new Date();
      this.#end = new Date(end.setSeconds(this.#start.getSeconds() + this.#duration));
    }
    if (!this.#end && !this.#duration) {
      const maybeVideo = this.querySelector('video');
      if (maybeVideo) {
        this.#end = maybeVideo.duration;
      } else {
        const end = new Date();
        this.#end = new Date(end.setSeconds(this.#start.getSeconds() + 10));
      }
    }
    if (!this.#end && !this.#duration) {
      console.warn('No end date or duration set, will try using the video ending event.');
    }

    this.setLanding();
    this.#event('landing', 'Waiting for Interaction.', {});
    const startButton = this.querySelector('[data-click]');
    if (startButton) {
      startButton.addEventListener('click', async () => {
        await LiveStreamWrapper.fadeOut(startButton);
        this.#hasInteracted = true;
        this.#setState(this.#start, this.#end);
      });
    }
    this.#startClock();
    this.#setState(this.#start, this.#end);

  }

  #getState(start, end) {
    const now = new Date();
    switch(true) {
      case now > end || this.#isEndOverride:
        return 'end';
      case now > start:
        return 'live';
      case now < start && !this.#hasInteracted:
        return 'landing';
      case now < start:
        return 'pre';
      default:
        console.debug('No State set.', start, end);
        return '';
    }
  }

  #setState(start, end) {
    const currentStatus = this.#getState(start, end);
    if (currentStatus !== this.#state.status) this.#state.previous = this.#state.status;
    this.#state.status = currentStatus;
    if (this.#state.status === 'end') this.setEnd();
    if (this.#state.status === 'live') this.setLive();
    if (this.#state.status === 'pre') this.setStart();
  }

  async setLanding() {
    this.#showLanding();
    this.#hidePregame();
    this.#hidePlayer();
    this.#hidePostgame();
  }

  async setStart() {
    this.#hideLanding();
    this.#hidePlayer();
    this.#hidePostgame();
    this.#showPregame();

    if (!this.#isWaiting) {
      this.#event('pre', 'Event has not yet started', {});
      // Make sure video is not already playing in background on page load.
      if (this.#getState(this.#start, this.#end) === 'pre') {
        const player = this.querySelector('video');
        if (player) player.pause();
      }
      this.#isWaiting = true;
      const transition = LiveStreamWrapper.getTransitionDiv(this.#divs.start);
      if (transition) await LiveStreamWrapper.fadeIn(transition);
    }
  }

  async setLive() {
    this.#hideLanding();
    this.#hidePostgame();

    if (!this.#isLive) {
      this.#isLive = true;
      this.#event('live', 'Is Live', {});

      if (this.#state.previous === 'pre') {
        const outgoing = LiveStreamWrapper.getTransitionDiv(this.#divs.start);
        //if (outgoing.classList.contains('fadeOut')) await LiveStreamWrapper.fadeOut(outgoing); // TODO check what happens if no
        await LiveStreamWrapper.fadeOut(outgoing);
      }
      this.#hidePregame();
      this.#showPlayer();
      console.log('setting live');

      this.#event('live', 'Is Live', {});
      const player = this.querySelector('video');
      if (player) {
        if (player.paused) player.play();
        player.onplay = () => {
          if (this.#simulatedlive) {
            this.#event('seeking', 'seeing to wallclock time', {});
            const offset = (new Date() - this.#start) / 1000;
            player.currentTime = offset;
          }
        }
        player.onended = () => {
          this.#isEndOverride = true;
          this.#setState(this.#start, this.#end);
        }
      }
      const transition = LiveStreamWrapper.getTransitionDiv(this.#divs.player);
      if (transition) LiveStreamWrapper.fadeIn(transition);
      return;
    }

  }

  async setEnd() {
    this.#hideLanding();
    this.#hidePregame();
    if (!this.#isLiveToVOD) {
      this.#hidePlayer();
      this.#showPostgame();
      const transitionIn = LiveStreamWrapper.getTransitionDiv(this.#divs.end);
      if (transitionIn) LiveStreamWrapper.fadeIn(transitionIn);
    }
    if (this.#isLiveToVOD) {
      this.#hidePostgame();
    }

    if (!this.#isOver) {
      this.#event('end', 'Event has ended', {});
      this.#isOver = true;
      const divs = this.#divs.player.assignedElements({flatten: true});
      if (divs && divs.length > 0) {
        // Remove from DOM. However can't then go back to start and re-play.
        // Clone will break event handlers for a player.
        // return divs[0].remove();
        // Try to stop any playing video.
        try {
          const possiblevideo = divs[0].querySelector('video');
          if (possiblevideo) possiblevideo.pause();
        } catch (e) {}
      }
    }
  }

  #showLanding() {
    this.#divs.landing.classList.remove('hidden');
  }
  #hideLanding() {
    this.#divs.landing.classList.add('hidden');
  }
  #showPregame() {
    this.#divs.start.classList.remove('hidden');
  }
  #hidePregame() {
    this.#divs.start.classList.add('hidden');
  }
  #showPlayer() {
    this.#divs.player.classList.remove('hidden');
  }
  #hidePlayer() {
    this.#divs.player.classList.add('hidden');
  }
  #showPostgame() {
    this.#divs.end?.classList.remove('hidden');
  }
  #hidePostgame() {
    this.#divs.end.classList.add('hidden');
  }

  #reset() {
    this.#state.status = 'inital';
    this.#state.previous = '';
    this.#isWaiting  = false;
    this.#isLive = false;
    this.#isOver = false;
    this.#isEndOverride = false;
    // this.#hasInteracted = false; Likely an interaction has already happened.
  }

  #startClock() {
    this.#clock();
    this.#intervals.clock = setInterval(() => this.#clock(), 100);
  }

  #stopClock() {
    clearInterval(this.#intervals.clock);
  }

  #clock() {
    if (this.#start) {
      this.#time.relativeStart  = LiveStreamWrapper.getRelativeTimeDistance(this.#start);
      this.#time.countdownClock = LiveStreamWrapper.getCountdownClock(this.#start);
      this.#time.startlocaltime = LiveStreamWrapper.startLocalTime(this.#start);
      this.#time.startlocaldate = LiveStreamWrapper.startLocalDate(this.#start);
      if (this.#divs.countdown) {
        this.#divs.countdown.innerHTML = this.#time.relativeStart;
      }
      if (this.#divs.countdownClock) {
        this.#divs.countdownClock.innerHTML = this.#time.countdownClock;
      }
      if (this.#divs.localTime) {
        this.#divs.localTime.innerHTML = this.#time.startlocaltime;
      }
      if (this.#divs.localDate) {
        this.#divs.localDate.innerHTML = this.#time.startlocaldate;
      }

      // Set state of Block
      this.#setState(this.#start, this.#end);

    } else {
      console.warn('No start time set.');
    }
  }

  #event(name, details, object) {
    this.dispatchEvent(new CustomEvent('all', {detail: {"name": name, "message": details, "full": object}}));
    this.dispatchEvent(new CustomEvent(name, {detail: {"message": details, "full": object}}));
  }

  static getRelativeTimeDistance(d1, d2 = new Date() ) {
    const units = {
      year  : 24 * 60 * 60 * 1000 * 365,
      month : 24 * 60 * 60 * 1000 * 365/12,
      day   : 24 * 60 * 60 * 1000,
      hour  : 60 * 60 * 1000,
      minute: 60 * 1000,
      second: 1000
    }
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    const elapsed = d1 - d2;
    for (const u in units)
      if (Math.abs(elapsed) > units[u] || u == 'second')
        return rtf.format(Math.round(elapsed/units[u]),u)
  }

  static startLocalTime(time) {
    return time.toLocaleTimeString('en-us',{timeZoneName:'short', hour: 'numeric', minute: '2-digit'});
  }

  static startLocalDate(time) {
    return time.toLocaleDateString('en-us',{month: 'long', day: 'numeric', year: 'numeric'});
  }

  static getCountdownClock(countDownDate) {
    const now = new Date().getTime();
    const distance = countDownDate - now;
    const hours = Math.floor(distance / (1000 * 60 * 60 * 24));
    let mins   = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
    let sec    = Math.floor((distance % (1000 * 60)) / 1000).toString();

    if (Number(sec) < 10) sec = `0${sec}`;
    if (Number(mins) < 10) mins = `0${mins}`;

    if (distance > 0) {
      return `${hours || '00'}:${mins || '00'}:${sec || '00'}`;
    }
    return `00:00:00`;
  }

  static isValidDate(d) {
    if (Object.prototype.toString.call(d) === "[object Date]") {
      if (Number.isNaN(d)) {
        return false;
      }
      return true;
    }
    return false;
  }

  static getTransitionDiv(shadowDiv) {
    const divs = shadowDiv.assignedElements({flatten: true});
    if (divs && divs.length > 0) {
      return divs[0].querySelector('[data-transition]');
    }
    return false;
  }

  static fadeOut(div) {
    if (div.classList.contains('fadeOut')) return Promise.resolve();
    div.classList.add('fadeOut');
    div.classList.remove('fadeIn');
    return new Promise(resolve => {
      div.addEventListener('animationend', () => {
        resolve();
      });
    });
  }

  static fadeIn(div) {
    if (div.classList.contains('fadeIn')) return Promise.resolve();
    div.classList.remove('fadeOut');
    div.classList.add('fadeIn');
    return new Promise(resolve => {
      div.addEventListener('animationend', () => {
        resolve();
      });
    });
  }
}