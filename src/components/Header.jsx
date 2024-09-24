// eslint-disable-next-line react/prop-types, no-unused-vars
export default function Header({ resetearPartida, numeroDeIntentos, puntos }) {
  return (
    <header>
      <div className="titulo">Intentos: {numeroDeIntentos}</div>
      <div className="puntos">Puntos: {puntos !== undefined ? puntos : 0}</div>
    </header>
  );
}
