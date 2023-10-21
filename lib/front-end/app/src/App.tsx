import { useEffect, useState } from 'react'
import './App.css';

const socket = new WebSocket(import.meta.env.VITE_WS_URL);

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  useEffect(() => {

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onFooEvent(value: any) {
      const data = JSON.parse(value.data);
      console.log(data);

      if (data.data.connectedUsers) {
        setConnectedUsers(data.data.connectedUsers);
      }
    }

    socket.onopen = onConnect;
    socket.onclose = onDisconnect;
    socket.onmessage = onFooEvent;

    return () => {
      socket.onopen = null;
      socket.onclose = null;
      socket.onmessage = null;
    };
  }, []);

  return (
    <>
      <div>

      </div>
      <h1>{isConnected ? `connected as ()` : "offline"}</h1>
      Connected Users: <pre>{JSON.stringify(connectedUsers, null, 2)}</pre>

    </>
  )
}

export default App
