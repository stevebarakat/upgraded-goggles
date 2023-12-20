import Mixer from "./components/Mixer";
import { MixerContext } from "./machines/mixerMachine";

export const App = () => {
  return (
    <MixerContext.Provider>
      <Mixer />
    </MixerContext.Provider>
  );
};

export default App;
