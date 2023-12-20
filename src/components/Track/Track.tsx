import Fader from "./Fader";

function Track({ trackId }) {
  return (
    <div>
      <Fader trackId={trackId} />
    </div>
  );
}

export default Track;
