import asyncio
import json
from typing import Dict, Set, AsyncGenerator
from datetime import datetime, timezone


class SSEManager:
    """Manages real-time Server-Sent Events subscribers for telemetry."""

    def __init__(self):
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}

    def subscribe(self, astronaut_id: str = "astronaut-A") -> asyncio.Queue:
        queue = asyncio.Queue()
        if astronaut_id not in self._subscribers:
            self._subscribers[astronaut_id] = set()
        self._subscribers[astronaut_id].add(queue)
        return queue

    def unsubscribe(self, astronaut_id: str, queue: asyncio.Queue):
        if astronaut_id in self._subscribers:
            self._subscribers[astronaut_id].discard(queue)
            if not self._subscribers[astronaut_id]:
                del self._subscribers[astronaut_id]

    async def broadcast(self, astronaut_id: str, data: dict):
        """Broadcast data payload to subscribers of this astronaut."""
        targets = self._subscribers.get(astronaut_id, set())
        # Also include any wildcard subscribers
        wildcard_targets = self._subscribers.get("*", set())
        all_queues = list(targets | wildcard_targets)

        for queue in all_queues:
            try:
                await queue.put(data)
            except Exception:
                pass

    async def event_generator(self, astronaut_id: str) -> AsyncGenerator[dict, None]:
        """Async generator yielding SSE formatted events for a subscriber."""
        queue = self.subscribe(astronaut_id)
        try:
            # Yield initial connect handshake
            initial_event = {
                "event": "connected",
                "data": json.dumps({
                    "astronaut_id": astronaut_id,
                    "connected_at": datetime.now(timezone.utc).isoformat(),
                    "status": "stream_active",
                }),
            }
            yield initial_event

            while True:
                data = await queue.get()
                yield {
                    "event": "telemetry",
                    "data": json.dumps(data) if isinstance(data, dict) else str(data),
                }
        finally:
            self.unsubscribe(astronaut_id, queue)


sse_manager = SSEManager()
