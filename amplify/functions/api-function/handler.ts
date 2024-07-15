import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const httpMethod = event.httpMethod; // Obtiene el método HTTP de la solicitud
  console.log("------HTTP Method:", httpMethod);
  console.log("------event", event);

  let response;

  switch (httpMethod) {
    case "GET":
      response = handleGetRequest(event);
      break;
    case "POST":
      response = handlePostRequest(event);
      break;
    // Agrega más casos para otros métodos HTTP si es necesario
    default:
      response = handleUnknownRequest(event);
      break;
  }

  return response;
};

// Función para manejar solicitudes GET
const handleGetRequest = (event: any) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
    body: JSON.stringify("-----Hello from GET request! Ronald & Lorena"),
  };
};

// Función para manejar solicitudes POST
const handlePostRequest = (event: any) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
    body: JSON.stringify("-----Hello from POST request! Ronald & Lorena"),
  };
};

// Función para manejar solicitudes desconocidas
const handleUnknownRequest = (event: any) => {
  return {
    statusCode: 405, // Método no permitido
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
    body: JSON.stringify(`-----Method ${event.httpMethod} not allowed`),
  };
};
