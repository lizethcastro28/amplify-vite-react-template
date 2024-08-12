import { useState, useEffect } from 'react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { get, post } from 'aws-amplify/data';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { dictionary } from './components/dictionary';
import { ErrorContent } from './components/ErrorContent';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [createLivenessApiData, setCreateLivenessApiData] = useState<{ sessionId: string } | null>(null);
  const [screen, setScreen] = useState<'loading' | 'detector' | 'success' | 'error' | 'notLive' | 'dataError' | 'cancelled' | "dataDocument">('loading');
  const [address, setAddress] = useState("");
  const [nombre, setNombre] = useState("");
  const [dataDana, setDataDana] = useState(null);
  const [urlshort, setUrlshort] = useState(null);


  //==========0. Obtener Geolocalización del dispositivo
  const getLocation = () => {
    if (navigator.geolocation) {
      console.log('-----navigator.geolocation: ');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Llamada a la API de Nominatim para obtener la dirección
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            const address = data.display_name;
            setAddress(address);
          } catch (error) {
            console.error('Error with reverse geocoding:', error);
          }
        },
        (error) => {
          console.log(error.message);
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
    return address;
  };

  //==========1. Comprobación Liveness
  useEffect(() => {
    const fetchDataAndProcess = async () => {
      // Obtener parámetros del URL
      const params = new URLSearchParams(window.location.search);
      const vftk = params.get('vftk');
      const danaParam = params.get('dana');

      if (vftk && danaParam) {
        try {
          // Consulto los datos de la persona en DanaConnect
          const fetchData = async (danaParam: string, vftk: string) => {
            const res = await getDataDana(danaParam, vftk); // Esperar a que se resuelva la Promise
            console.log('-------llamo a dana: ', res);
            return res; // Asegúrate de retornar el resultado
          }

          const data = await fetchData(danaParam, vftk); // Usa await para obtener el resultado de la Promise

          if (data && data.record) {
            console.log('----hay datos: ');
            var imageUrl = obtenerValorCampo(data.record, 'URLSHORT');
            if (imageUrl) {
              setAddress(getLocation());
              setNombre(obtenerValorCampo(data.record, 'NOMBRES_Y_APELLIDOS'));
              setUrlshort(imageUrl);
              setDataDana(data.record);
              console.log('dataaaa:', dataDana)
              fetchCreateLiveness();
            } else {
              console.log('El urlshort del documento no está en la data');
              setScreen('dataDocument');
              setLoading(false);
            }
          } else {
            setScreen('dataError');
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setScreen('error');
          setLoading(false);
        }
      } else {
        setScreen('error');
        setLoading(false);
      }
    }

    fetchDataAndProcess();
  }, []);

  //---------Función para encontrar el valor de un campo dado su clave
  function obtenerValorCampo(objeto: Record<string, any>, campo: string): any {
    for (const clave in objeto) {
      if (clave.includes(campo)) {
        return objeto[clave];
      } else if (typeof objeto[clave] === "object" && objeto[clave] !== null) {
        const resultadoRecursivo = obtenerValorCampo(objeto[clave], campo);
        if (resultadoRecursivo !== undefined) {
          return resultadoRecursivo;
        }
      }
    }
    return undefined; // Añadir un valor de retorno para el caso cuando no se encuentra el campo
  }


  const getDataDana = async (danaParam: string, vftkParam: string) => {
    const path = `data?vftk=${encodeURIComponent(vftkParam)}&dana=${encodeURIComponent(danaParam)}`;

    const restOperation = get({
      apiName: 'myRestApi',
      path: path,
    });
    const response = (await restOperation.response) as unknown as Response;
    if (response.body) {
      const responseBody = await readStream(response.body);
      return JSON.parse(responseBody);
    } else {
      console.log('GET call succeeded but response body is empty');
      setScreen('error');
    }
  }


  const fetchCreateLiveness = async () => {
    try {
      const restOperation = post({
        apiName: 'myRestApi',
        path: 'session',
      });
      const response = (await restOperation.response) as unknown as Response;

      if (response.body) {
        const responseBody = await readStream(response.body);
        const sessionData = JSON.parse(responseBody);

        if (sessionData && sessionData.SessionId) {
          setCreateLivenessApiData({ sessionId: sessionData.SessionId });
          setScreen('detector');
        } else {
          console.error('Invalid session data received:', sessionData);
          setScreen('error');
        }
        setLoading(false);
      } else {
        console.log('POST call succeeded but response body is empty');
        setScreen('error');
      }
    } catch (error) {
      console.log('------POST call failed: ', error);
      setScreen('error');
    }
  };

  async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }

    result += decoder.decode(); // Decodificar los últimos datos
    return result;
  }

  const handleAnalysisComplete = async () => {
    if (createLivenessApiData) {
      try {
        const restOperation = get({
          apiName: 'myRestApi',
          path: `session/${createLivenessApiData.sessionId}`,
        });
        const response = (await restOperation.response) as unknown as Response;

        if (response.body) {
          const responseBody = await readStream(response.body);
          const data = JSON.parse(responseBody); // Parse JSON string to object
          if (data.Status === 'SUCCEEDED') {
            if (data.Confidence > 90) {
              console.log('-----is live: ', data.Confidence);
              setScreen('success');
            } else {
              console.log('---is not live: ', data.Confidence);
              setScreen('notLive');
            }
          } else {
            console.log('-------No se realizó la comprobación');
            setScreen('error');
          }
        } else {
          console.log('GET call succeeded but response body is empty');
          setScreen('error');
        }
      } catch (error) {
        console.log('------GET call failed: ', error);
        setScreen('error');
      }
    } else {
      console.log('No sessionId available');
      setScreen('error');
    }
  };

  function onUserCancel() {
    console.log('----canceló');
    setScreen('cancelled');
  }

  return (
    <ThemeProvider>
      {loading ? (
        <Loader />
      ) : screen === 'detector' ? (
        <div>
          <h1>Hola {nombre}</h1>
          <FaceLivenessDetector
            sessionId={createLivenessApiData?.sessionId || ''}
            region="us-east-1"
            onAnalysisComplete={handleAnalysisComplete}
            onUserCancel={onUserCancel}
            displayText={dictionary['es']}
            onError={(error) => {
              console.error('FaceLivenessDetector error:', error); // Log para verificar los errores
              setScreen('error');
            }}
          />
        </div>
      ) : screen === 'success' ? (
        <div>
          <h1>Aquí va la comparación contra el Documento</h1>
          {address}
          {urlshort}
        </div>
      ) : screen === 'notLive' ? (
        <div>
          <ErrorContent
            titulo="No es una persona"
            descripcion="La cámara no reconoce una persona."
            razones={[
              "Es posible que no hayas seguidos las instrucciones."
            ]}
            instrucciones="Por favor, regresa, ponte de frente a la cámara y sigue las instrucciones."
            visible={true}
            setScreen={setScreen}
          />
        </div>
      ) : screen === 'dataError' ? (
        <div>
          <ErrorContent
            titulo="Error en Información"
            descripcion="Se ha producido un error al cargar la información de su cuenta"
            razones={[
              "Puede ser que usted ya haya hecho clic en el enlace para generar y su token ya haya sido utilizado.",
              "Puede ser que haya pasado más de una hora desde que hizo clic en el link del email."
            ]}
            instrucciones="Vuelva a abrir el email original que le enviamos y haga clic en el enlace para generar el token nuevamente"
            visible={false}
            setScreen={setScreen}
          />
        </div>
      ) : screen === 'dataDocument' ? (
        <div>
          <ErrorContent
            titulo="Error en Documento"
            descripcion="No hay documento en su dossier para realizar la verificación"
            razones={[]}
            instrucciones="Contacte con Soporte Ténico"
            visible={false}
            setScreen={setScreen}
          />
        </div>
      ) : screen === 'cancelled' ? (
        <div>
          <ErrorContent
            titulo="Acción cancelada por el Usuario"
            descripcion="Puedes volver a intentarlo."
            razones={[]}
            instrucciones=""
            visible={false}
            setScreen={setScreen}
          />
        </div>
      ) : (
        <div>
          <ErrorContent
            titulo="Error inesperado"
            descripcion="Intenta de nuevo."
            razones={[]}
            instrucciones="Refresca la página o contacta con soporte técnico."
            visible={false}
            setScreen={setScreen}
          />
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
