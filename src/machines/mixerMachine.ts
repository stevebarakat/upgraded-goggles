import { defaultTrackData } from "./../assets/songs/defaultData";
import { createActorContext } from "@xstate/react";
import { assign, createMachine, fromObservable, fromPromise } from "xstate";
import { dbToPercent, formatMilliseconds, log } from "@/utils";
import {
  start as initializeAudio,
  getContext as getAudioContext,
  Transport,
  Destination,
  Player,
  Channel,
  Meter,
  loaded,
} from "tone";
import { interval, animationFrameScheduler } from "rxjs";
import { roxanne } from "@/assets/songs";
import { produce } from "immer";

const audio = getAudioContext();

const currentTracks = roxanne.tracks.map((track) => ({
  songSlug: "roxanne",
  ...track,
  ...defaultTrackData,
}));

console.log("currentTracks", currentTracks);

type InitialConext = {
  song: SourceSong;
  channels: Channel[] | undefined;
  meters: Meter[] | undefined;
  t: Transport;
  currentTime: string;
  volume: number;
  meterVals: Float32Array;
  currentTracks: TrackSettings[];
};

const initialContext: InitialConext = {
  song: roxanne,
  channels: undefined,
  meters: undefined,
  t: Transport,
  currentTime: "00:00:00",
  volume: -32,
  meterVals: new Float32Array(currentTracks.length),
  currentTracks,
};

export const mixerMachine = createMachine(
  {
    id: "player",
    context: initialContext,
    initial: "idle",
    states: {
      idle: {
        entry: {
          type: "initMixer",
        },
        invoke: {
          src: "loaderActor",
          id: "getting.ready",
          onDone: [
            {
              target: "ready",
            },
          ],
          onError: [
            {
              target: "idle",
            },
          ],
        },
      },
      ready: {
        states: {
          automationMode: {
            initial: "off",
            states: {
              off: {
                on: {
                  write: "writing",
                  read: "reading",
                },
              },
              writing: {
                on: {
                  off: "off",
                  read: "reading",
                },
              },
              reading: {
                on: {
                  off: "off",
                  write: "writing",
                },
              },
            },
          },
          playbackMode: {
            invoke: {
              src: "tickerActor",
              id: "start.ticker",
              onSnapshot: {
                actions: assign(({ context }) => {
                  const meters = context.meters;
                  const vals = context.meterVals;
                  console.log("meters", meters);
                  console.log("vals", vals);
                  context.currentTime = formatMilliseconds(context.t.seconds);
                  meters?.forEach((meter, i) => {
                    const val = meter.getValue();
                    if (context.meterVals) {
                      vals[i] = val;
                      context.meterVals = new Float32Array(vals);
                      // return (meterVals = new Float32Array(vals));
                    }
                  });
                }),
              },
            },
            initial: "stopped",
            states: {
              stopped: {
                on: {
                  play: {
                    target: "playing",
                  },
                  reset: {
                    target: "stopped",
                    actions: {
                      type: "reset",
                    },
                  },
                },
              },
              playing: {
                entry: {
                  type: "play",
                },
                on: {
                  reset: {
                    target: "stopped",
                    actions: {
                      type: "reset",
                    },
                  },
                  pause: {
                    target: "stopped",
                    actions: {
                      type: "pause",
                    },
                  },
                },
              },
            },
            on: {
              fastFwd: {
                guard: "canFF",
                actions: {
                  type: "fastFwd",
                },
              },
              rewind: {
                guard: "canRew",
                actions: {
                  type: "rewind",
                },
              },
              setVolume: {
                actions: {
                  type: "setVolume",
                },
              },
              setTrackVolume: {
                actions: {
                  type: "setTrackVolume",
                },
              },
              setMeter: {
                actions: {
                  type: "setMeter",
                },
              },
            },
          },
        },
        type: "parallel",
      },
    },
    types: {} as {
      context: InitialConext;
      events:
        | { type: "write" }
        | { type: "read" }
        | { type: "off" }
        | { type: "play"; t: Transport }
        | { type: "reset" }
        | { type: "pause" }
        | { type: "fastFwd" }
        | { type: "rewind" }
        | { type: "setVolume"; volume: number }
        | { type: "setTrackVolume"; volume: number; trackId: number }
        | { type: "setMeter"; meterVals: Float32Array };
      guards: { type: "canFF" } | { type: "canRew" };
    },
  },
  {
    actions: {
      initMixer: ({ context }) => {
        const tracks = context.song.tracks;
        let channels: Channel[] = [];
        let players: Player[] = [];
        let meters: Meter[] = [];
        tracks?.forEach((track) => {
          players = [...players, new Player(track.path)];
          meters = [...meters, new Meter(2)];
          channels = [...channels, new Channel(0)];
        });
        const chans = players?.map((player, i) => {
          return (
            channels &&
            player.connect(channels[i]).sync().start(0).toDestination()
          );
        });
        chans.forEach((chan, i) => chan.connect(meters[i]).toDestination());
        return {
          meters,
          channels: chans,
        };
      },
      play: assign(({ context: { t } }) => {
        if (audio.state === "suspended") {
          initializeAudio();
          return t.start();
        } else {
          return t.start();
        }
      }),
      pause: assign(({ context: { t } }) => {
        return t.pause();
      }),
      reset: assign(({ context: { t } }) => {
        t.stop();
        t.seconds = 0;
      }),
      fastFwd: assign(({ context: { t } }) => {
        t.seconds = t.seconds + 10;
      }),
      rewind: assign(({ context: { t } }) => {
        t.seconds = t.seconds - 10;
      }),
      setMeter: assign(({ context, event }) => {
        if (event.type !== "setMeter") throw new Error();
        return {
          meterVals: context.meterVals,
        };
      }),
      setVolume: assign(({ event }) => {
        if (event.type !== "setVolume") throw new Error();
        const scaled = dbToPercent(log(event.volume));
        Destination.volume.value = scaled;
        return {
          volume: event.volume,
        };
      }),
      setTrackVolume: assign(({ context, event }) => {
        console.log("message");
        if (!context.channels) return;
        if (event.type !== "setTrackVolume") throw new Error();
        const scaled = dbToPercent(log(event.volume));
        context.channels[event.trackId].volume.value = scaled;
        const currentTracks = context.currentTracks;
        currentTracks[event.trackId].volume = event.volume;
        context.currentTracks = currentTracks;
        return {
          currentTracks,
        };
      }),
    },
    actors: {
      loaderActor: fromPromise(async () => await loaded()),
      tickerActor: fromObservable(() => interval(0, animationFrameScheduler)),
    },
    guards: {
      canFF: ({ context: { song, t } }) => {
        return t.seconds < song.end;
      },
      canRew: ({ context: { song, t } }) => {
        return t.seconds > song.start;
      },
    },
    delays: {},
  }
);
export const MixerContext = createActorContext(mixerMachine);
