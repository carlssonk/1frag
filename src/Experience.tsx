import Level from "./Level";
import Lights from "./Lights";
import Player from "./Player";

export default function Experience() {
  return (
    <>
      <color args={["#252731"]} attach="background" />
      <Lights />
      <Level />
      <Player />
    </>
  );
}
