import { MixerContext } from "@/machines/mixerMachine";
import { TransportButton } from "../Buttons";
import { FastForward as FastFwdIcon } from "lucide-react";

export function FastForward() {
  const { send } = MixerContext.useActorRef();

  return (
    <TransportButton
      onClick={() => {
        send({ type: "fastFwd" });
      }}
    >
      <FastFwdIcon />
    </TransportButton>
  );
}
