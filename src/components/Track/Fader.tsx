import VuMeter from "@/components/VuMeter";
import { MixerContext } from "@/machines/mixerMachine";

export default function Fader({ trackId }) {
  const { send } = MixerContext.useActorRef();
  const { currentTracks, meterVals } = MixerContext.useSelector(
    (state) => state.context
  );

  function setVolume(e: React.FormEvent<HTMLInputElement>): void {
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
          <VuMeter
            meterValue={meterVals && meterVals[trackId]}
            height={250}
            width={25}
          />
          <input
            className="range-y volume"
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
