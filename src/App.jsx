/* eslint-disable no-undef */
import { Component } from "react";
import construirBaraja from "./utils/construirBaraja";
import Tablero from "./components/Tablero";
import Header from "./components/Header";
import intro from "./images/Intro stand 2.mp4";
import cierre from "./images/Cierre 2.mp4";
import { checkInServiceJs } from "./firebase/firebaseServiceJs";

const getEstadoInicial = () => {
  const baraja = construirBaraja();
  return {
    baraja,
    parejaSeleccionada: [],
    estaComparando: false,
    numeroDeIntentos: 0,
  };
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...getEstadoInicial(),
      nombre: "",
      codigo: "",
      registrado: false,
      mostrarVideo: true,
      mostrarVideoCierre: false,
      tiempoVideoCierre: 0,
      puntos: 0,
      isOpen: false,
    };
  }

  openModal = () => {
    this.setState({ isOpen: true });
  };

  // Método para cerrar el modal
  closeModal = () => {
    this.setState({ isOpen: false, mostrarVideoCierre: true,
      tiempoVideoCierre: 0, });
  };

  handleVideoClick = () => {
    // Oculta el video y muestra el formulario de registro
    this.setState({ mostrarVideo: false });
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleRegistro = async () => {
    const { codigo } = this.state;

    if (codigo) {
      try {
        const attending = await checkInServiceJs.getAttendeeByUserCode({
          userCode: codigo,
        });
        console.log(attending);

        if (attending === null) {
          alert("Código incorrecto. Por favor, verifica tu código.");
          return;
        }

        const userParticipation = await checkInServiceJs.getUserParticipation({
          userCode: codigo,
        });
        console.log(userParticipation?.points);

        localStorage.setItem("userCode", codigo);
        console.log("UserCode registrado:", codigo);

        await checkInServiceJs.saveUserParticipation({
          userCode: codigo,
          points: userParticipation?.points ?? 10,
          newParticipation: true,
        });

        // Si todo es correcto, actualizar el estado a registrado
        this.setState({ registrado: true });
      } catch (error) {
        console.error("Error al registrar al usuario:", error);
        alert(
          "Ocurrió un error durante el registro. Por favor, inténtalo de nuevo."
        );
      }
    } else {
      alert("Por favor, completa todos los campos");
    }
  };

  seleccionarCarta(carta) {
    if (
      this.state.estaComparando ||
      this.state.parejaSeleccionada.indexOf(carta) > -1 ||
      carta.fueAdivinada
    ) {
      return;
    }

    const parejaSeleccionada = [...this.state.parejaSeleccionada, carta];
    this.setState({
      parejaSeleccionada,
    });

    if (parejaSeleccionada.length === 2) {
      this.compararPareja(parejaSeleccionada);
    }
  }

  compararPareja(parejaSeleccionada) {
    this.setState({ estaComparando: true });

    setTimeout(() => {
      const [primeraCarta, segundaCarta] = parejaSeleccionada;
      let baraja = this.state.baraja;
      let puntos = this.state.puntos;

      if (this.esPareja(primeraCarta, segundaCarta)) {
        baraja = baraja.map((carta) => {
          if (!this.esPareja(carta, primeraCarta)) {
            return carta;
          }

          return { ...carta, fueAdivinada: true };
        });
        puntos += 10;
      }

      // useEffect(() => {
      //   saveData();

      // }, []); // Guardar datos al montar

      this.setState({
        parejaSeleccionada: [],
        baraja,
        estaComparando: false,
        numeroDeIntentos: this.state.numeroDeIntentos + 1,
        puntos,
      });
      this.verificarSiHayGanador(baraja);
    }, 1000);
  }

  esPareja(carta1, carta2) {
    const nombreCarta1 = carta1.icono.split("/")[1].split("-")[0];
    const nombreCarta2 = carta2.icono.split("/")[1].split("-")[0];
    return nombreCarta1 === nombreCarta2;
  }

  async verificarSiHayGanador(baraja) {
    if (baraja.filter((carta) => !carta.fueAdivinada).length === 0) {
      await this.saveData();
      // alert(`Ganaste en ${this.state.numeroDeIntentos} intentos!`);
      this.setState({
       
        isOpen: true,
      });
    }
  }

  saveData = async () => {
    const userCode = localStorage.getItem("userCode");

    const previewParticipation = await checkInServiceJs.getUserParticipation({
      userCode,
    });
    if (previewParticipation.participationDateList.length === 1) {
      checkInServiceJs.saveUserParticipation({
        userCode,
        points: previewParticipation.points + this.state.puntos,
      });
    }
    console.log(this.state.puntos);
  };

  resetearPartida() {
    this.setState(getEstadoInicial());
  }

  manejarFinVideoCierre = () => {
    this.setState({ mostrarVideoCierre: false, mostrarVideo: true });
    window.location.reload();
  };

  render() {
    if (this.state.mostrarVideo) {
      return (
        <div>
          <video
            src={intro}
            autoPlay
            onClick={this.handleVideoClick}
            style={{ width: "100%", cursor: "pointer" }}
            muted
          />
        </div>
      );
    }

    // Si se debe mostrar el video de cierre, se retorna este video
    if (this.state.mostrarVideoCierre) {
      return (
        <div>
          <video
            src={cierre}
            autoPlay
            onEnded={this.manejarFinVideoCierre} // Maneja el evento de fin de video
            style={{ width: "100%" }}
            muted
          />
        </div>
      );
    }
    if (this.state.isOpen) {
      return (
        <div className="container">
          <div className="modal-overlay">
            <div className="modal">
              <p>
                {`Ganaste en ${this.state.numeroDeIntentos} intentos!`}
              </p>
              <button onClick={this.closeModal} className="close-button">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!this.state.registrado) {
      return (
        <div>
          <div className="registro">
            <link
              href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap"
              rel="stylesheet"
            />

            <form>
              <input
                type="email"
                name="codigo"
                placeholder="Ingresa tu codigo"
                value={this.state.codigo}
                onChange={this.handleChange}
              />
              <button type="button" onClick={this.handleRegistro}>
                CONTINUAR
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="App">
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <Header
          numeroDeIntentos={this.state.numeroDeIntentos}
          puntos={this.state.puntos}
          resetearPartida={() => this.resetearPartida()}
        />
        <Tablero
          baraja={this.state.baraja}
          parejaSeleccionada={this.state.parejaSeleccionada}
          seleccionarCarta={(carta) => this.seleccionarCarta(carta)}
        />
      </div>
    );
  }
}

export default App;
