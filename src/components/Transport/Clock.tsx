import { MixerContext } from "@/machines/mixerMachine";
import "./style.css";

function Clock() {
  const { song, currentTime, t } = MixerContext.useSelector(
    (state) => state.context
  );

  if (t.seconds < 0) {
    t.seconds = 0;
  }
  if (t.seconds > song.end) {
    t.stop();
    t.seconds = song.end;
  }

  return (
    <div className="clock">
      <div className="ghost">88:88:88</div>
      {currentTime}
    </div>
  );
}

export default Clock;
