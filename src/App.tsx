import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient, post } from "aws-amplify/data";
//import { post } from 'aws-amplify/api';

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [cadena, setCadena] = useState<string>("");

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
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
  async function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }
  async function load() {
    try {
      const restOperation = post({
        apiName: 'myRestApi',
        path: 'session'
      });
      const response = await restOperation.response as unknown as Response;

      if (response.body) {
        const responseBody = await readStream(response.body);
        setCadena(responseBody);
        console.log('GET call succeeded: ', responseBody);
      } else {
        console.log('GET call succeeded but response body is empty');
      }
    } catch (error) {
      console.log('------GET call failed: ');
    }

  }
  load();
  return (
    <main>
      <h1>Lista de Nombres</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo. Ronald Niño
        <br />
        Respuesta de un API {cadena}
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
    </main>
  );
}

export default App;