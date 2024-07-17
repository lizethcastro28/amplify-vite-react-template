import React from 'react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { get, post } from "aws-amplify/data";
import '@aws-amplify/ui-react/styles.css';

function App() {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [createLivenessApiData, setCreateLivenessApiData] = React.useState<{
    sessionId: string;
  } | null>(null);

  React.useEffect(() => {
    const fetchCreateLiveness = async () => {
      try {
        const restOperation = post({
          apiName: 'myRestApi',
          path: 'session'
        });
        const response = await restOperation.response as unknown as Response;

        if (response.body) {
          const responseBody = await readStream(response.body);
          const sessionData = JSON.parse(responseBody);
          console.log('Response Body:', sessionData); // Log para verificar los datos
          
          if (sessionData && sessionData.SessionId) {
            setCreateLivenessApiData({ sessionId: sessionData.SessionId });
            console.log('Session ID set:', sessionData.SessionId);
          } else {
            console.error('Invalid session data received:', sessionData);
          }
          
          setLoading(false);
          console.log('POST call succeeded: ', sessionData);
        } else {
          console.log('POST call succeeded but response body is empty');
        }
      } catch (error) {
        console.log('------POST call failed: ', error);
      }
    };

    fetchCreateLiveness();
  }, []);

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
          path: `session/${createLivenessApiData.sessionId}`
        });
        const response = await restOperation.response as unknown as Response;

        if (response.body) {
          const responseBody = await readStream(response.body);
          const data = JSON.parse(responseBody); // Parse JSON string to object
          console.log('-------Response Body:', data); // Log para verificar los datos
          if (data.isLive) {
            console.log('---------User is live');
          } else {
            console.log('-------User is not live');
          }
        } else {
          console.log('POST call succeeded but response body is empty');
        }
      } catch (error) {
        console.log('------POST call failed: ', error);
      }
      
    } else {
      console.log('No sessionId available');
    }
  };

  return (
    <ThemeProvider>
      {loading ? (
        <Loader />
      ) : (
        <FaceLivenessDetector
          sessionId={createLivenessApiData?.sessionId || ""}
          region="us-east-1"
          onAnalysisComplete={handleAnalysisComplete}
          onError={(error) => {
            console.error('FaceLivenessDetector error:', error); // Log para verificar los errores
          }}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
