import { Transport } from "tone";
import { roxanne, defaultTrackData } from "./assets/songs";
import Mixer from "./components/Mixer";
import { MixerContext } from "./machines/mixerMachine";

const currentTracks = roxanne.tracks.map((track) => ({
  songSlug: "roxanne",
  ...track,
  ...defaultTrackData,
}));

type InitialConext = {
  song: SourceSong;
  channels: Channel[] | undefined;
  t: Transport;
  currentTime: string;
  volume: number;
  currentTracks: TrackSettings[];
};

const initialContext: InitialConext = {
  song: roxanne,
  channels: undefined,
  t: Transport,
  currentTime: "00:00:00",
  volume: -32,
  currentTracks,
};

export const App = () => {
  return (
    <MixerContext.Provider
      options={{
        input: initialContext,
      }}
    >
      <Mixer />
    </MixerContext.Provider>
  );
};

export default App;
