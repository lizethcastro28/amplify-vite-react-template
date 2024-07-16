import React from 'react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { post } from "aws-amplify/data";
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
          const sessionData = JSON.parse(responseBody); // Parse JSON string to object
          setCreateLivenessApiData({ sessionId: sessionData.sessionId }); // Assuming sessionData contains sessionId
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
    /*
     * This should be replaced with a real call to your own backend API
     */
    if (createLivenessApiData) {
      const response = await fetch(
        `/api/get?sessionId=${createLivenessApiData.sessionId}`
      );
      const data = await response.json();

      /*
       * Note: The isLive flag is not returned from the GetFaceLivenessSession API
       * This should be returned from your backend based on the score that you
       * get in response. Based on the return value of your API you can determine what to render next.
       * Any next steps from an authorization perspective should happen in your backend and you should not rely
       * on this value for any auth related decisions.
       */
      if (data.isLive) {
        console.log('User is live');
      } else {
        console.log('User is not live');
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
            console.error(error);
          }}
        />
      )}
    </ThemeProvider>
  );
}
export default App; 
