import { MixerContext } from "@/machines/mixerMachine";
import Loader from "@/components/Loader";
import Transport from "@/components/Transport";
import Fader from "@/components/Fader";

export default function Mixer() {
  const ready = MixerContext.useSelector((state) => state.matches("ready"));

  if (ready) {
    return (
      <div className="flex-y">
        <Fader />
        <Transport />
      </div>
    );
  } else {
    return <Loader />;
  }
}
