# Livestream Wrapper

A native component to help with the start, playback and ending of live streams, or simulated live streams.

Included are helpers such as countdowns, javascript events, and listeners for video ending. Slots allow customization of each screen, and shown or hidden depending on the state.

## Usage

```html
<style>
livestream-wrapper:not(:defined) {
  visibility: hidden;
}
.fadeOut {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 300ms, opacity 300ms ease-in-out;
}
</style>

<livestream-wrapper
  start=""
  end=""
  duration=""
  >

  <div slot="landing">
    <!-- An interaction required to allow autoplay -->
    <button data-click>Play</button>
  </div>

  <div slot="start">
      <h1>Preshow Banner</h1>
      <ul>
        <!-- Clock options -->
        <li><span data-countdown-clock></span></li>
        <li><span data-countdown></span></li>
        <li><span data-localDate></span></li>
        <li><span data-localTime></span></li>
      </ul>
    </section>
  </div>

  <div slot="player">
    <video></video>
  </div>

  <div slot="end">
    <h1>The Event is Over, Thanks for Watching</h1>
  </div>

</livesteram-wrapper>
```

## Ending an Event

There are a few ways to end an event:

- End Date
- Duration
- Not specifying an end or duration will then end when the player emits an `end` event.
- Live to VOD is when the on-demand recording should remain available after the end of the event.

## Parameters

| Name | Description |
| - | - |
| start | Required. When the app should show the player slot.  An ISO 8601 string or similar string can be converted to a javascript `Date` element |
| end | When the app should show the end slot.  An ISO 8601 string or similar string can be converted to a javascript `Date` element |
| duration | Length that the player slot should be shown in seconds. Used instead of the `end` parameters. |
| live-to-vod | Boolean that will continue to show the player when the event is finished. |

## Slots

### Landing

| Name | Description |
| - | - |
| data-click | An element that a user clicks to show the countdown or stream.  This interaction is required for browsers to allow autoplay to work (with audio). |

## Start

| Name | Description |
| - | - |
| data-countdown-clock | A view in HH:MM:SS countdown till the start time |
| data-countdown | A general description of time remaining, such as "in 3 hours" |
| data-localDate | A localized start date.  The date in the viewer's timezone. |
| data-localTime | A localized start time.  The time in the viewer's timezone. |

## Player

## End
