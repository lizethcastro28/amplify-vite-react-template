import React from 'react';
import { Flex, Alert, Text, Button } from '@aws-amplify/ui-react';

interface ErrorContentProps {
  titulo: string;
  descripcion: string;
  razones: string[];
  instrucciones: string;
  visible: boolean;
  setScreen?: React.Dispatch<React.SetStateAction<'loading' | 'detector' | 'success' | 'error' | 'notLive' | 'dataError' | 'cancelled' | 'dataDocument'>>;
}

export const ErrorContent: React.FC<ErrorContentProps> = ({ titulo, descripcion, razones, instrucciones, visible }) => {
  return (
    <Flex
      className="amplify-flex amplify-alert amplify-liveness-start-screen-warning"
      style={{ zIndex: 3, flexDirection: 'column', alignItems: 'center', padding: '12px' }}
    >
      <img src="https://imgcdn.email-platform.com/brand/venturestars/f7b7ef16c6.png" className="mx-auto mt-10 h-32" alt="Logo" />
     
      <div style={{ flex: '1 1 0%', marginTop: '20px', textAlign: 'center' }}>
        <Alert variation="error" isDismissible={false}>
          <Text fontWeight="bold">{titulo}</Text>
          <Text>{descripcion}</Text>
          <ul style={{ textAlign: 'left', margin: '20px 0' }}>
            {razones.map((razon, index) => (
              <li key={index}>{razon}</li>
            ))}
          </ul>
          {instrucciones && (
            <div style={{ textAlign: 'left', fontSize: '14px', margin: '20px 0' }}>
              <h4 className="font-bold">PARA INTENTAR DE NUEVO:</h4>
              <p>{instrucciones}</p>
            </div>
          )}
        </Alert>
        {visible && (
          <Button
            className="custom-button"
            onClick={() => window.location.reload()}
          >
            Regresar
          </Button>
        )}
      </div>
    </Flex>
  );
};
