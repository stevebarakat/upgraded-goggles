import { defaultTrackData } from "./../assets/songs/defaultData";
import { createActorContext } from "@xstate/react";
import { assign, createMachine, fromObservable, fromPromise } from "xstate";
import { dbToPercent, formatMilliseconds, log } from "@/utils";
import {
  start as initializeAudio,
  getContext as getAudioContext,
  Destination,
  Player,
  Channel,
  loaded,
} from "tone";
import { interval, animationFrameScheduler } from "rxjs";

const audio = getAudioContext();

export const mixerMachine = createMachine(
  {
    id: "player",
    context: ({ input }) => ({
      ...input,
    }),
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
                  context.currentTime = formatMilliseconds(context.t.seconds);
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
        | { type: "setTrackVolume"; volume: number; trackId: number };
      guards: { type: "canFF" } | { type: "canRew" };
    },
  },
  {
    actions: {
      initMixer: assign(({ context }) => {
        const tracks = context.song.tracks;
        let channels: Channel[] = [];
        let players: Player[] = [];
        tracks?.forEach((track) => {
          channels = [...channels, new Channel(0).toDestination()];
          players = [...players, new Player(track.path)];
        });
        players?.forEach((player, i) => {
          channels && player.connect(channels[i]).sync().start(0);
        });
        return {
          channels,
        };
      }),
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

      setVolume: assign(({ event }) => {
        if (event.type !== "setVolume") throw new Error();
        const scaled = dbToPercent(log(event.volume));
        Destination.volume.value = scaled;
        return {
          volume: event.volume,
        };
      }),
      setTrackVolume: assign(({ context, event }) => {
        if (!context.channels) return;
        console.log("context.channels", context.channels);
        if (event.type !== "setTrackVolume") throw new Error();
        const scaled = dbToPercent(log(event.volume));
        context.channels[event.trackId].volume.value = scaled;
        const currentTracks = context.currentTracks;
        currentTracks[event.trackId].volume = event.volume;
        // context.currentTracks = currentTracks;
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
