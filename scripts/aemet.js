/**
 * @author Ignacio Fernández Gómez <svu13190@educastur.es>
 * @version 1.0
 * @description Práctica API REST AEMET
 */

const API_KEY =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJpZ25hY2lvZmdAZ21haWwuY29tIiwianRpIjoiZjAwZmYxYWMtNjUyMS00OTEyLWIxZTgtMDRhMWVmYWFkZjc1IiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3MTQ3NTUwMjQsInVzZXJJZCI6ImYwMGZmMWFjLTY1MjEtNDkxMi1iMWU4LTA0YTFlZmFhZGY3NSIsInJvbGUiOiIifQ.P8SgLPQeIMUk23k-IFj1RyUhxwcmAHoDMMPqxEWWD5Q";
const API_BASE_URL = "https://opendata.aemet.es/opendata/api/";

document.addEventListener("DOMContentLoaded", (e) => {
  cargaPrevisionMunicipio();
});

/**
 *
 * @returns Fecha con mismo formato utilizado por AEMET de modo que se puedan comparar
 */
const hoy = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month =
    hoy.getMonth().length === 2
      ? hoy.getMonth() + 1
      : "0" + (hoy.getMonth() + 1).toString();
  const day =
    hoy.getDate().length === 2 ? hoy.getDate() : "0" + hoy.getDate().toString();
  return `${year}-${month}-${day}T00:00:00`;
};

/**
 * Función asíncrona que obtiene la url para leer los datos requeridos
 */
const cargaPrevisionMunicipio = async () => {
  setLoading(true);

  const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/33024/?api_key=${API_KEY}&nocache=${new Date().getTime()}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
    method: "GET",
  });
  const data = await response.json();

  leerDatos(data.datos);
};

/**
 * Función que lee los datos obtenido en cargarPrevisionMunicipio y lo maqueta
 * @param {Array} datos
 */
const leerDatos = async (datos) => {
  const capaDias = document.querySelector("#dias");

  //Leemos los datos de la url proporcionada por la API de AEMET
  const response = await fetch(datos);
  const data = await response.json();

  //Guardamos la prediccion para acceder más fácilmente
  const dias = data[0].prediccion.dia;

  //Recorremos los días contenidos en la propiedad prediccion
  for (let dia of dias) {
    const diferencia =
      new Date(dia.fecha).getDate() - new Date(hoy()).getDate();
    if (diferencia >= 0 && diferencia < 4) {
      const capaDia = document.createElement("div");
      capaDia.innerHTML = `
      <div class="dia ${diferencia === 0 ? "hoy" : ""}">
        <div class="fecha">${formatearFecha(dia.fecha)}</div>
        <div class="icono">
          <img src="img/${cargarIcono(dia.estadoCielo[0].descripcion)}"/>
          ${dia.estadoCielo[0].descripcion}
        </div>
        <div class="temperatura">
          <div class="maxima"><span>máx</span>${dia.temperatura.maxima}º</div>
          <div>/</div>
          <div class="minima"><span>mín</span>${dia.temperatura.minima}º</div>
        </div>
        <h4>Probabilidad de lluvia</h4> 
        <div class="probabilidadPrecipitacion">
        ${
          dia.probPrecipitacion.length > 6
            ? mostrarProbabilidadLluviaBloques(
                dia.probPrecipitacion.slice(3, 7)
              )
            : mostrarProbabilidadLluvia(dia.probPrecipitacion)
        }
        </div>
        <div class="datosAdicionales">
          <button onclick='mostrarDatosAdicionales()'>Mostrar más información</button>

          <div class="datos hide">
            <div>
              <div class="datoIcono"></div>
              <div class="datoNombre">Humedad</div>
              <div class="datoValor">${dia.humedadRelativa.maxima}%</div>
            </div>
            <div>
              <div class="datoIcono"></div>
              <div class="datoNombre">Viento</div>
              <div class="datoValor">${dia.viento[0].velocidad} km/h  - ${
        dia.viento[0].direccion
      }</div>
            </div>
            <div>
              <div class="datoIcono"></div>
              <div class="datoNombre">UV</div>
              <div class="datoValor">${dia.uvMax}%</div>
            </div>
            <div>
              <div class="datoIcono"></div>
              <div class="datoNombre">Nieve</div>
              <div class="datoValor">${dia.cotaNieveProv[0]?.value}m.</div>
            </div>
          </div>
        </div>
      </div>
    `;
      capaDias.appendChild(capaDia);
    }
  }

  setLoading(false);
};

/**
 * Función que construye el bloque con la probabilidad de lluvia en 24 horas
 * @param {Array} datos
 * @returns {String}
 */
const mostrarProbabilidadLluvia = (datos) => {
  return `<div class='intervalo'>
            <div>0-24</div>
            <div>${datos[0].value}%</div>
          </div>`;
};

/**
 * Función que construye los bloques con la probabilidad de lluvia cada 6 horas
 * @param {Array} datos
 * @returns {String}
 */
const mostrarProbabilidadLluviaBloques = (datos) => {
  let probabilidad = "";

  for (let intervalo of datos) {
    probabilidad += `
      <div class='intervalo'>
        <div>${intervalo.periodo}</div>
        <div>${intervalo.value}%</div>
      </div>`;
  }

  return probabilidad;
};

/**
 * Función que devuelve el nombre de la imagen a utilizar en función de la previsión
 * @param {String} texto
 * @returns {String}
 */
const cargarIcono = (texto) => {
  switch (true) {
    case /lluvia/i.test(texto):
      return "lluvia.png";
    case /intervalos nubosos/i.test(texto):
      return "nubesyclaros.png";
    case /nuboso/i.test(texto):
      return "nuboso.png";
    case /sol/i.test(texto):
    default:
      return "soleado.png";
  }
};

/**
 * Función que maqueta el día a mostrar en cada día de previsión
 * @param {String} fecha
 * @returns
 */
const formatearFecha = (fecha) => {
  const dia = new Date(fecha);
  const MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return `${dia.getDate()} de ${MESES[dia.getMonth()]}`;
};

/**
 * Función que controla y muestra el aviso de Cargando...
 * @param {Boolean} estado
 */
const setLoading = (estado) => {
  const cargando = document.querySelector("#loading");
  if (estado) {
    cargando.classList.remove("hide");
  } else {
    cargando.classList.add("hide");
  }
};

/**
 * Función que muestra la información adicional para el día de hoy
 */
const mostrarDatosAdicionales = () => {
  const capa = document.querySelector(".hoy .datosAdicionales .datos");
  const button = document.querySelector(".hoy .datosAdicionales button");
  const capaHoy = document.querySelector(".hoy");

  capaHoy.style.setProperty("height", "590px");

  setTimeout(() => {
    button.classList.add("hide");
    capa.classList.remove("hide");
  }, 800);
};
