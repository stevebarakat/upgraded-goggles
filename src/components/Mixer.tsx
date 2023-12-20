import { MixerContext } from "@/machines/mixerMachine";
import Loader from "@/components/Loader";
import Transport from "@/components/Transport";
import { Track } from "./Track";

export default function Mixer() {
  const state = MixerContext.useSelector((state) => state);
  const ready = state.matches("ready");
  const currentTracks = state.context.currentTracks;

  if (ready) {
    return (
      <div className="flex-y">
        <div className="flex">
          {currentTracks?.map((track, i) => (
            <Track key={track.id} trackId={i} />
          ))}
        </div>
        <Transport />
      </div>
    );
  } else {
    return <Loader />;
  }
}
