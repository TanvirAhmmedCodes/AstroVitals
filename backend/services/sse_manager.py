"""Manages real-time Server-Sent Events subscribers and fixture replay for telemetry."""

import os
import json
import asyncio
from typing import Dict, Set, AsyncGenerator, List, Any, Optional
from datetime import datetime, timezone
from pathlib import Path

# Resolve demo fixtures directory
CURRENT_FILE = Path(__file__).resolve()
ROOT_DIR = CURRENT_FILE.parent.parent.parent
FIXTURES_PATH = ROOT_DIR / "demo_fixtures" / "vitals.json"


class SSEManager:
    """Manages real-time Server-Sent Events subscribers for telemetry."""

    def __init__(self):
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._cached_frames: Optional[List[Dict[str, Any]]] = None

    def get_fixture_frames(self) -> List[Dict[str, Any]]:
        """Load and cache 600-second vitals demo fixture frames."""
        if self._cached_frames is not None:
            return self._cached_frames
        if FIXTURES_PATH.exists():
            try:
                self._cached_frames = json.loads(FIXTURES_PATH.read_text(encoding="utf-8"))
                return self._cached_frames
            except Exception as e:
                print(f"[SSEManager] Fixture load notice: {e}")
        return []

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
        wildcard_targets = self._subscribers.get("*", set())
        all_queues = list(targets | wildcard_targets)

        for queue in all_queues:
            try:
                await queue.put(data)
            except Exception:
                pass

    async def event_generator(self, astronaut_id: str = "astronaut-A", replay: bool = False) -> AsyncGenerator[dict, None]:
        """Async generator yielding SSE formatted events for a subscriber.

        When OFFLINE=1 or replay=True, feeds from committed demo fixture at 1 frame per second.
        """
        queue = self.subscribe(astronaut_id)
        is_offline = os.getenv("OFFLINE", "0").strip() == "1"
        should_replay = replay or is_offline

        try:
            # Yield initial connect handshake
            initial_event = {
                "event": "connected",
                "data": json.dumps({
                    "astronaut_id": astronaut_id,
                    "connected_at": datetime.now(timezone.utc).isoformat(),
                    "status": "stream_active",
                    "mode": "FIXTURE_REPLAY" if should_replay else "LIVE",
                }),
            }
            yield initial_event

            if should_replay:
                frames = self.get_fixture_frames()
                if not frames:
                    frames = [{"heart_rate_bpm": 72.0, "spo2_pct": 98.0, "skin_temp_c": 36.5, "status": "nominal"}]

                idx = 0
                while True:
                    frame = dict(frames[idx % len(frames)])
                    frame["timestamp_utc"] = datetime.now(timezone.utc).isoformat()
                    yield {
                        "event": "telemetry",
                        "data": json.dumps(frame),
                    }
                    idx += 1
                    await asyncio.sleep(1.0)
            else:
                while True:
                    try:
                        # Wait up to 3 seconds for live data; if idle, stream a fallback nominal frame
                        data = await asyncio.wait_for(queue.get(), timeout=3.0)
                        yield {
                            "event": "telemetry",
                            "data": json.dumps(data) if isinstance(data, dict) else str(data),
                        }
                    except asyncio.TimeoutError:
                        frames = self.get_fixture_frames()
                        if frames:
                            fallback_frame = dict(frames[0])
                            fallback_frame["timestamp_utc"] = datetime.now(timezone.utc).isoformat()
                            yield {
                                "event": "telemetry",
                                "data": json.dumps(fallback_frame),
                            }
        finally:
            self.unsubscribe(astronaut_id, queue)


sse_manager = SSEManager()
