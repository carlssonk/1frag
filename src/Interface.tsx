export const Interface = ({ setGameMode }: any) => {
  return (
    <>
      <button onClick={() => setGameMode("1v1")}>1v1</button>
      <button disabled>FFA (Coming soon)</button>
      <button disabled>Matchmaking (Coming soon)</button>
    </>
  );
};
