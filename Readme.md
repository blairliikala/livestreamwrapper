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

  <div slot="start">
  </div>

  <div slot="player">
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

  <div slot="start">
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

  <div slot="player">
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

## Ending an Event

There are a few ways to end an event:

- End Date parameter
- Duration parameter
- Not specifying an end or duration will then end when the player emits an `end` event.
- Live to VOD is when the on-demand recording should remain available after the end of the event.

## Parameters

| Name | Description |
| - | - |
| start | Required. When the app should show the player slot.  An ISO 8601 string or similar string can be converted to a javascript `Date` element |
| end | When the app should show the end slot.  An ISO 8601 string or similar string can be converted to a javascript `Date` element |
| duration | Length that the player slot should be shown in seconds. Used instead of the `end` parameters. |
| live-to-vod | Boolean that will continue to show the player when the event is finished. |
| simulated-live | Boolean to enable an mp4 to play as if live. |

```html
<livestream-wrapper
  start="Thu Oct 20 2022 13:56:35 GMT-0500"
  end="Thu Oct 20 2022 14:56:35 GMT-0500"
  duration="600"
  live-to-vod="true"
>
```

## Properties

| Name | Description |
| - | - |
| hasInteracted | Boolean. Set false until the `data-click` div is clicked. |
| time | An object of current countdowns in a few different formats. |

```javascript
const elm = document.querySelector('livestream-wrapper');
elm.hasInteracted = true;
console.log(elm.time) // Object of times before start.
```

## Events

| Name | Description |
| - | - |
| landing | Fired when initial load is complete and the landing slot is displayed. |
| pre | Fired when the countdown slot is displayed |
| live | Fired when the player slot is displayed |
| seeking | Fired when the component tries to seek to the current live time. |
| end | Fired when the end slot is displayed |
| error | Fired when there is an error |

### About Autoplay and Interactions

Browsers require a click or interaction in order to allow autoplaying with audio. The component has an initial `data-click` button that can be added to the player so that when the player starts there will be audio. This interaction is set by the `hasInteracted` property, and alternatively can be changed with an API call if an interaction happened somewhere else on the page.

## Slots

There are 4 slots: Landing, Start, Player, and End that are cycled through during an event. HTML can be placed inside these slots and styled.

### Landing

| Name | Description |
| - | - |
| data-click | An element that a user clicks to show the countdown or stream.  This interaction is required for browsers to allow autoplay to work (with audio). |

`hasInteracted` can be changed via javascript to skip this step (see above), or the slot can be omitted.  If the slot is omitted, the video should be started as muted to allow autoplay to work, otherwise the user will need to click play when the stream begins.

### Start

| Name | Description |
| - | - |
| data-countdown-clock | A view in HH:MM:SS countdown till the start time |
| data-countdown | Description of time remaining, such as "in 3 hours" |
| data-localDate | Localized start date in the viewer's timezone. |
| data-localTime | Localized start time in the viewer's timezone. |

### Player

(No additional helpers)

### End

(No additional helpers)

## Changelog

Currently in Pre-release.
