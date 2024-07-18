// ErrorContent.tsx
import React from 'react';

export const ErrorContent: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <img src="https://imgcdn.email-platform.com/brand/venturestars/f7b7ef16c6.png" className="mx-auto mt-10 h-32" alt="Logo" />
      <div className="p-4 text-lg text-gray-500 text-center">Se ha producido un error al cargar la información de su cuenta</div>
      <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-lg shadow-lg p-8 max-w-3xl mx-auto mt-8">
        <div className="text-white text-3xl font-bold mb-4">Estas son las razones posibles del error:</div>
        <ul className="text-white text-lg mb-4">
          <li>Puede ser que usted ya haya hecho clic en el enlace para generar y su token ya haya sido utilizado.</li>
          <li>Puede ser que haya pasado más de una hora desde que hizo clic en el enlace del email.</li>
        </ul>
        <div className="text-white text-lg font-light mb-4">
          <h4 className="font-bold">PARA INTENTAR DE NUEVO:</h4>
          <p>Vuelva a abrir el email original que le enviamos y haga clic en el enlace para generar el token nuevamente</p>
        </div>
      </div>
    </div>
  );
};
