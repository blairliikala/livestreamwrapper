# Livestream Wrapper

A native component to help manage the start, playback and ending of live streams, or simulated live streams.

Slots allow customization of each screen, and shown or hidden depending on the state.  Includes a helper for countdowns, and events for additional scripting.

Demo:
[https://livestreamwrapper.vercel.app/](https://livestreamwrapper.vercel.app/)

## Script

Bundled as an ES6 component:

```html
<script type="module" src="https://unpkg.com/livestream-wrapper"></script>
  ```

```javascript
import { LiveStreamWrapper} from "https://unpkg.com/livestream-wrapper";
```

```html
<script type="module">
  import "livestream-wrapper.js";
</script>
```

## Basic Layout

```html
<livestream-wrapper start="" end="">

  <div slot="landing">
  </div>

  <div slot="preshow">
  </div>

  <div slot="holding">
  </div>  

  <div slot="live">
  </div>

  <div slot="end">
  </div>

</livesteram-wrapper>
```

## Typical Usage

```html
<style>
/* Hide the component until loaded */
livestream-wrapper:not(:defined) {
  visibility: hidden;
}
/* Helps with state transitions */
.fadeOut {
  animation: fadeout 300ms
}
.fadeIn {
  animation: fadein 1s;
}
@keyframes fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes fadeout {
  from { opacity: 1; }
  to   { opacity: 0; }
}
</style>

<livestream-wrapper
  start="Thu Oct 20 2022 13:56:35 GMT-0500"
  end="Thu Oct 20 2022 14:56:35 GMT-0500"
  >

  <div slot="landing">
    <!-- An interaction required to allow autoplay -->
    <button data-click>Play</button>
  </div>

  <div slot="preshow">
    <section data-transition>
      <h1>Preshow Banner</h1>
      <ul>
        <!-- Clock options -->
        <li><span data-countdown-clock></span></li>
        <li><span data-countdown></span></li>
        <li><span data-localDate></span></li>
        <li><span data-localTime></span></li>
      </ul>
    </section>
    </section>
  </div>

  <div slot="holding">
    <section data-transition>
      <h3>Waiting for stream to start.</h3>
    </section>
  </div>  

  <div slot="live">
    <section data-transition>
      Add your player here <video></video>
    </section>
  </div>

  <div slot="end">
    <section data-transition>
      <h1>The Event is Over, Thanks for Watching</h1>
    </section>
  </div>

</livesteram-wrapper>
```

## Parameters

| Name | Description | Default |
| - | - | - |
| `start` | Required. When the app should show the player slot.  An ISO 8601 string or similar string can be converted to a javascript `Date` element | null |
| `end` | (optional) When the app should show the end slot.  An ISO 8601 string or similar string can be converted to a javascript `Date` element | null |
| `duration` | (optional) Length that the player slot should be shown in seconds. Used instead of the `end` parameters. | null |
| `live-to-vod` | (optional) Boolean that will continue to show the player when the event is finished instead of the `end` slot. | false |
| `simulated-live` | (optional) Boolean to enable an mp4 to play as if live. | false |
| `ready` | (optional) Boolean to tell the componet to hold before showing the live player (see more below) | true |

Example:

```html
<livestream-wrapper
  start="Thu Oct 20 2022 13:56:35 GMT-0500"
  end="Thu Oct 20 2022 14:56:35 GMT-0500"
  duration="600"
  live-to-vod="true"
  ready="false"
>
```

## Additional Properties

In addition to the parameters above:

| Name | Description |
| - | - |
| `time` | An object of current countdowns in a few different formats. |
| `hasInteracted` | Boolean. Set false until the `data-click` div is clicked. |
| `state` | The name of the active slot |

```javascript
const component = document.querySelector('livestream-wrapper');
component.hasInteracted = true;
console.log(component.time) // Object of times before start.
```

## Events

| Name | Description |
| - | - |
| `landing` | Triggered when initial load is complete and the landing slot is displayed. |
| `pre` | Triggered when the countdown slot is displayed |
| `holding` | Triggered when the state is waiting to be triggered from javascript to start after the live stream has started. |
| `live` | FirTriggereded when the player slot is displayed |
| `seeking` | Triggered when the component tries to seek to the current live time. |
| `end` | Triggered when the end slot is displayed |
| `error` | Triggered when there is an error |

## Slots

There are 5 slots that are cycled through during an event. HTML can be placed inside these slots and styled.  Each is optional, but works best to have them in the markup.

### `landing` : About Autoplay and Interactions

Browsers require a click or interaction in order to allow autoplaying with audio. The component has an initial `data-click` button that can be added to the player so that when the player starts there will be audio. This interaction is set by the `hasInteracted` property, and alternatively can be changed with an API call if an interaction happened somewhere else on the page.

`hasInteracted` can be changed via javascript to skip this step (see above), or the slot can be omitted.  If the slot is omitted, the video should be started as muted to allow autoplay to work, otherwise the user will need to click play when the stream begins.

| Name | Description |
| - | - |
| `data-click` | An element that a user clicks to show the countdown or stream.  This interaction is required for browsers to allow autoplay to work (with audio). |

### `preshow` The countdown

The preshow slot is intended to be the waiting area before the stream begins.  A basic countdown is available.  More robust countdowns are also possible to add here.

| Name | Description |
| - | - |
| `data-countdown-clock` | A view in HH:MM:SS countdown till the start time |
| `data-countdown` | Description of rounded time remaining, such as "in 3 hours" |
| `data-localDate` | Localized start date in the viewer's timezone. |
| `data-localTime` | Localized start time in the viewer's timezone. |

### `holding` Stream should be live, but is not yet

This slot helps when the stream **should** be live, but is not streaming yet.  Live stream players usually assume the live stream feed has begun, so when an HLS endpoint is empty, or returns an error, before the stream starts the player usually throws an (ugly) error and may not restart. The Holding slot is a way to show a kinder message while waiting for the player to get a feed. This works best by polling an endpoint (or using webhsockets...etc) that can verify the stream is active. Then using javascript, set the `ready` property to `true` to allow the component to transition to the `live` slot where the player should be, and begin playing the stream.  If you are sure the stream will be active, or the player will handle empty stream links, you can omit this slot (or leave it blank);

### `live` Where the Player Plays

This slot is where the video or audio player is placed. The component will attempt to play a `<video>` element if it exists.  Reminder that nearly all browsers require a user interaction to autoplay (as covered earlier), or the video has to be muted.

### `end` Ending an Event

There are a few ways to end an event:

- End Date parameter
- Duration parameter
- Not specifying an end or duration will then end when the player emits an `end` event.
- Live to VOD is when the on-demand recording should remain available after the end of the event.

Depending on the player, you may need to listen to the `end` event and then make a call to stop your player during a live stream.

### Transitions

Each slot can optionally have a transition applied for buttery awesomeness.  These transitions are native CSS animations that you as a developer can make. The CSS class names simply have to be `fadeIn` and `fadeOut` and the component will listen for the transition to start/stop.  Then an additional `div` with a `data-transition` attribute needs to be applied.

```html
<style>
.fadeIn { ... }
.fadeOut {
  animation: fadeout 300ms
}
@keyframes fadeout {
  from { opacity: 1; }
  to   { opacity: 0; }
}
</style>

...
<div slot="live">
  <section data-transition>
  Add your player here <video></video>
  </section>
</div>
...

```

## Changelog

Currently in Pre-release.
