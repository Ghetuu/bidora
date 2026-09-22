import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {

    let isMounted = true;

    const connectWebSocket = () => {

      if (!isMounted) {
        return;
      }

      const existingSocket = socketRef.current;

      if (
        existingSocket &&
        (
          existingSocket.readyState === WebSocket.OPEN ||
          existingSocket.readyState === WebSocket.CONNECTING
        )
      ) {
        return;
      }

      const socket = new WebSocket(
        "ws://127.0.0.1:8000/ws"
      );

      socketRef.current = socket;


      // =====================================================
      // CONNECTED
      // =====================================================

      socket.onopen = () => {

        if (!isMounted) {
          return;
        }

        console.log(
          "🟢 Bidora realtime connection connected"
        );

        setConnected(true);
      };


      // =====================================================
      // MESSAGE
      // =====================================================

      socket.onmessage = (event) => {

        try {

          const data = JSON.parse(event.data);

          console.log(
            "📡 Bidora realtime event:",
            data
          );

          setLastEvent(data);

        } catch (error) {

          console.error(
            "WebSocket message error:",
            error
          );
        }
      };


      // =====================================================
      // DISCONNECTED
      // =====================================================

      socket.onclose = () => {

        if (!isMounted) {
          return;
        }

        console.log(
          "🔴 Bidora realtime connection closed"
        );

        setConnected(false);

        reconnectTimerRef.current =
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
      };


      // =====================================================
      // ERROR
      // =====================================================

      socket.onerror = (error) => {

        console.error(
          "Bidora WebSocket error:",
          error
        );
      };
    };


    connectWebSocket();


    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {

      isMounted = false;

      if (reconnectTimerRef.current) {

        clearTimeout(
          reconnectTimerRef.current
        );
      }

      if (socketRef.current) {

        socketRef.current.close();

        socketRef.current = null;
      }
    };

  }, []);


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = (message) => {

    const socket = socketRef.current;

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {

      socket.send(
        JSON.stringify(message)
      );

      return true;
    }

    return false;
  };


  return (
    <RealtimeContext.Provider
      value={{
        connected,
        lastEvent,
        sendMessage
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}


// ===========================================================
// HOOK
// ===========================================================

export function useRealtime() {

  return useContext(
    RealtimeContext
  );
}