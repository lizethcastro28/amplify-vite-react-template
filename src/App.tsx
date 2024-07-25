import React from 'react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider, Button } from '@aws-amplify/ui-react';
import { get, post } from 'aws-amplify/data';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { dictionary } from './components/dictionary';
import { ErrorContent } from './components/ErrorContent';

function App() {
  const [nombre] = React.useState<string>('Lorena'); // Cambia este valor para probar diferentes escenarios
  const [loading, setLoading] = React.useState<boolean>(true);
  const [createLivenessApiData, setCreateLivenessApiData] = React.useState<{ sessionId: string } | null>(null);
  const [screen, setScreen] = React.useState<'loading' | 'detector' | 'success' | 'error' | 'notLive' | 'nameError' | 'cancelled'>('loading');

  React.useEffect(() => {
    if (nombre === 'Lorena') {
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
              //console.log('Session ID set:', sessionData.SessionId);
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

      fetchCreateLiveness();
    } else {
      setScreen('nameError');
      setLoading(false);
    }
  }, [nombre]);

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
      ) : screen === 'nameError' ? (
        <div>
          <ErrorContent
            titulo="Nombre no reconocido"
            descripcion="El nombre ingresado no es válido para esta operación."
            razones={[]}
            instrucciones="Por favor, verifique el nombre ingresado y vuelva a intentarlo."
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
