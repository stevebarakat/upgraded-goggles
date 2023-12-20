import { MixerContext } from "@/machines/mixerMachine";

export default function Fader({ trackId }) {
  const { send } = MixerContext.useActorRef();
  const state = MixerContext.useSelector((state) => state);
  const { currentTracks } = state.context;

  function setVolume(e: React.FormEvent<HTMLInputElement>): void {
    if (state.matches("ready"))
      send({
        type: "setTrackVolume",
        trackId,
        volume: parseFloat(e.currentTarget.value),
      });
  }

  return (
    <div>
      <div className="channel">
        <div className="fader-wrap">
          <div className="window">{`${(
            currentTracks[trackId].volume + 100
          ).toFixed(0)} dB`}</div>

          <input
            className="range-y "
            min={-100}
            max={0}
            step={0.1}
            type="range"
            value={currentTracks[trackId].volume}
            onChange={setVolume}
          />
          <div className="channel-label">{currentTracks[trackId].name}</div>
        </div>
      </div>
    </div>
  );
}
