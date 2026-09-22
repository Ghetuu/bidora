from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket_manager import manager


router = APIRouter(
    tags=["WebSocket"]
)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await manager.connect(websocket)

    try:

        # Tell the client that the connection succeeded
        await websocket.send_json({
            "type": "CONNECTED",
            "message": "Bidora realtime connection established"
        })

        while True:

            # Keep the connection alive and receive
            # optional messages from the frontend.
            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect(websocket)

    except Exception:

        manager.disconnect(websocket)