import { PlayerContext } from "@/machines/playerMachine";
import { useEffect, useCallback } from "react";
import { roundFourth } from "@/utils";
import localforage from "localforage";

type Props = { value: number };

function useAutomationData() {
  const state = PlayerContext.useSelector((state) => {
    return state;
  });
  const volume: number = state.context.volume;
  useWrite({ value: volume });
  // useRead();
  return null;
}

const data = new Map<number, object>();

// !!! --- WRITE --- !!! //
function useWrite({ value }: Props) {
  const state = PlayerContext.useSelector((state) => state);
  const isWriting = state.matches({ ready: { automationMode: "writing" } });
  const t = state.context.t;

  useEffect(() => {
    if (!isWriting) return;

    const loop = t.scheduleRepeat(
      () => {
        const time: number = roundFourth(t.seconds);
        data.set(time, { id: 0, time, value });
        localforage.setItem("volumeData", data);
      },
      0.25,
      0
    );

    return () => {
      t.clear(loop);
    };
  }, [isWriting, t, value]);

  return data;
}

// !!! --- READ --- !!! //
// function useRead() {
//   const { send } = PlayerContext.useActorRef();
//   const state = PlayerContext.useSelector((state) => state);
//   const t = state.context.t;
//   const isReading = state.matches({ ready: { automationMode: "reading" } });

//   const setVolume = useCallback(
//     (data: { time: number; value: number }) => {
//       t.schedule(() => {
//         if (!isReading) return;

//         send({
//           type: "setVolume",
//           volume: data.value,
//         });
//       }, data.time);
//     },
//     [isReading, send, t]
//   );

//   const volumeData = localStorageGet("volumeData");

//   useEffect(() => {
//     if (!isReading || !volumeData) return;
//     const objectToMap = (obj: typeof data) => new Map(Object.entries(obj));
//     const newVolData = objectToMap(volumeData);
//     for (const value of newVolData) {
//       setVolume(value[1]);
//     }
//   }, [volumeData, setVolume, isReading]);

//   return null;
// }
export default useAutomationData;
