import React from 'react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { get, post } from 'aws-amplify/data';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

function App() {
  const [nombre] = React.useState<string>('Lorena'); // Cambia este valor para probar diferentes escenarios
  const [loading, setLoading] = React.useState<boolean>(true);
  const [createLivenessApiData, setCreateLivenessApiData] = React.useState<{ sessionId: string } | null>(null);
  const [screen, setScreen] = React.useState<'detector' | 'success' | 'error' | 'notLive' | 'nameError' | 'cancelled'>('loading');

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
            console.log('Response Body:', sessionData); // Log para verificar los datos

            if (sessionData && sessionData.SessionId) {
              setCreateLivenessApiData({ sessionId: sessionData.SessionId });
              console.log('Session ID set:', sessionData.SessionId);
              setScreen('detector');
            } else {
              console.error('Invalid session data received:', sessionData);
              setScreen('error');
            }
            setLoading(false);
            console.log('POST call succeeded: ', sessionData);
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
      console.log('----createLivenessApiData.sessionId:', createLivenessApiData.sessionId);
      try {
        const restOperation = get({
          apiName: 'myRestApi',
          path: `session/${createLivenessApiData.sessionId}`,
        });
        const response = (await restOperation.response) as unknown as Response;

        if (response.body) {
          const responseBody = await readStream(response.body);
          const data = JSON.parse(responseBody); // Parse JSON string to object
          console.log('-------Response Body:', data); // Log para verificar los datos
          if (data.Status === 'SUCCEEDED') {
            if (data.Confidence > 95) {
              console.log('-----is live');
              setScreen('success');
            } else {
              console.log('---is not live');
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

  const dictionary = {
    // use default strings for english
    en: null,
    es: {
      photosensitivyWarningHeadingText: 'Advertencia de fotosensibilidad',
      photosensitivyWarningBodyText:
        'Esta verificación muestra luces de colores. Tenga cuidado si es fotosensible.',
      photosensitivyWarningInfoText: 
      'Algunas personas pueden experimentar convulsiones epilépticas al estar expuestas a luces de colores. Use precaución si usted o alguien en su familia tiene una condición epiléptica.',
      goodFitCaptionText: 'Buen ajuste',
      tooFarCaptionText: 'Demasiado lejos',
      hintCenterFaceText: 'Centra tu cara',
      startScreenBeginCheckText: 'Comenzar a verificar',
      hintHoldFaceForFreshnessText: 'Quédate quieto',
      hintConnectingText: 'Connectando...',
      hintVerifyingText: 'Verificando...',
      hintTooFarText: 'Acércate más',
    },
  };
  

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
          <h1>No es una persona</h1>
        </div>
      ) : screen === 'nameError' ? (
        <div>
          <h1>Error: Token expiró, danaParam nulo, vftk nulo</h1>
        </div>
      ) : screen === 'cancelled' ? (
        <div>
          <h1>Acción cancelada por el usuario.</h1>
        </div>
      ) : (
        <div>
          <h1>Error inesperado. Intenta de nuevo.</h1>
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
