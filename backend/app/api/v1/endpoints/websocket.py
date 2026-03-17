"""
WebSocket endpoints for real-time features.
Supports real-time notifications, live updates, and chat functionality.
"""

from typing import Dict, List, Set
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import logger
from app.models.user import User
from typing import Optional

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        # Active connections: {user_id: [WebSocket, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Room connections: {room_id: Set[WebSocket]}
        self.rooms: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str = None):
        """Accept a WebSocket connection."""
        await websocket.accept()
        
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
            logger.info(f"WebSocket connected: user_id={user_id}, total={len(self.active_connections.get(user_id, []))}")
        else:
            # Anonymous connection
            if "anonymous" not in self.active_connections:
                self.active_connections["anonymous"] = []
            self.active_connections["anonymous"].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str = None):
        """Remove a WebSocket connection."""
        if user_id and user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            logger.info(f"WebSocket disconnected: user_id={user_id}")
        else:
            # Remove from anonymous
            if "anonymous" in self.active_connections and websocket in self.active_connections["anonymous"]:
                self.active_connections["anonymous"].remove(websocket)
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.active_connections[user_id].remove(conn)
    
    async def broadcast(self, message: dict, exclude_user_id: str = None):
        """Broadcast a message to all connected users."""
        disconnected_users = []
        
        for user_id, connections in self.active_connections.items():
            if exclude_user_id and user_id == exclude_user_id:
                continue
            
            disconnected = []
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                connections.remove(conn)
            
            if not connections:
                disconnected_users.append(user_id)
        
        # Clean up empty user connections
        for user_id in disconnected_users:
            del self.active_connections[user_id]
    
    async def join_room(self, websocket: WebSocket, room_id: str):
        """Join a WebSocket to a room."""
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(websocket)
        logger.info(f"WebSocket joined room: {room_id}, total={len(self.rooms[room_id])}")
    
    def leave_room(self, websocket: WebSocket, room_id: str):
        """Remove a WebSocket from a room."""
        if room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
            logger.info(f"WebSocket left room: {room_id}")
    
    async def send_to_room(self, message: dict, room_id: str, exclude_websocket: WebSocket = None):
        """Send a message to all WebSockets in a room."""
        if room_id in self.rooms:
            disconnected = []
            for websocket in self.rooms[room_id]:
                if websocket == exclude_websocket:
                    continue
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to room {room_id}: {e}")
                    disconnected.append(websocket)
            
            # Remove disconnected websockets
            for ws in disconnected:
                self.rooms[room_id].discard(ws)


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Basic WebSocket endpoint for real-time communication.
    Supports anonymous connections.
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type", "message")
                
                # Echo back or handle different message types
                if message_type == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": message.get("timestamp")})
                elif message_type == "message":
                    # Echo the message back
                    await websocket.send_json({
                        "type": "echo",
                        "data": message.get("data", ""),
                        "timestamp": message.get("timestamp")
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message_type}"
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected")


async def get_current_user_optional_websocket(websocket: WebSocket, db: AsyncSession) -> Optional[User]:
    """Get current user for WebSocket, returns None if not authenticated."""
    try:
        # Try to get token from query params or headers
        token = websocket.query_params.get("token") or websocket.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return None
        
        # Decode token and get user
        from app.core.security import decode_token
        payload = decode_token(token, token_type="access")
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Fetch user from database
        from sqlalchemy import select
        try:
            user_id_int = int(user_id) if isinstance(user_id, str) else user_id
        except (ValueError, TypeError):
            return None
        
        result = await db.execute(select(User).where(User.id == user_id_int))
        user = result.scalar_one_or_none()
        
        if user and user.is_active:
            return user
        return None
    except Exception as e:
        logger.debug(f"WebSocket auth error: {e}")
        return None


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    """
    WebSocket endpoint for real-time notifications.
    Supports both authenticated and anonymous connections.
    For authenticated users, pass token as query parameter: ?token=YOUR_TOKEN
    """
    # Get database session
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        # Try to get user, but allow anonymous connections
        current_user = await get_current_user_optional_websocket(websocket, db)
        
        user_id = str(current_user.id) if current_user else None
    await manager.connect(websocket, user_id)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to notifications",
            "user_id": user_id
        })
        
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type", "ping")
                
                if message_type == "ping":
                    await websocket.send_json({"type": "pong"})
                elif message_type == "subscribe":
                    # Handle subscription to notification types
                    notification_types = message.get("types", [])
                    await websocket.send_json({
                        "type": "subscribed",
                        "notification_types": notification_types
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"Notification WebSocket disconnected: user_id={user_id}")


@router.websocket("/ws/room/{room_id}")
async def websocket_room(
    websocket: WebSocket,
    room_id: str
):
    """
    WebSocket endpoint for room-based communication.
    Supports both authenticated and anonymous users.
    """
    # Get database session
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        current_user = await get_current_user_optional_websocket(websocket, db)
        await manager.connect(websocket, str(current_user.id) if current_user else None)
        await manager.join_room(websocket, room_id)
        
        try:
            # Notify others in the room
            await manager.send_to_room({
                "type": "user_joined",
                "room_id": room_id,
                "user_id": str(current_user.id) if current_user else "anonymous"
            }, room_id, exclude_websocket=websocket)
            
            while True:
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    message_type = message.get("type", "message")
                    
                    # Broadcast to room
                    await manager.send_to_room({
                        "type": message_type,
                        "room_id": room_id,
                        "data": message.get("data"),
                        "user_id": str(current_user.id) if current_user else "anonymous",
                        "timestamp": message.get("timestamp")
                    }, room_id, exclude_websocket=websocket)
                    
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                    
        except WebSocketDisconnect:
            manager.leave_room(websocket, room_id)
            manager.disconnect(websocket, str(current_user.id) if current_user else None)
            
            # Notify others in the room
            await manager.send_to_room({
                "type": "user_left",
                "room_id": room_id,
                "user_id": str(current_user.id) if current_user else "anonymous"
            }, room_id)


# Helper function to send notifications via WebSocket
async def send_notification_websocket(user_id: str, notification: dict):
    """Send a notification to a user via WebSocket."""
    await manager.send_personal_message({
        "type": "notification",
        "data": notification
    }, str(user_id))

