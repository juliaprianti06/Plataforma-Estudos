from __future__ import annotations

from collections import deque
from hashlib import sha256
from math import ceil
from threading import Lock
from time import monotonic

from app.core.exceptions import MuitasTentativasError


class LoginRateLimiter:
    """Sliding-window limiter for failed login attempts.

    Account and IP limits are independent so a distributed attack against one
    account and a credential-stuffing attack from one address are both bounded.
    """

    def __init__(
        self,
        *,
        account_limit: int = 5,
        account_window: int = 300,
        ip_limit: int = 30,
        ip_window: int = 60,
    ) -> None:
        self.account_limit = account_limit
        self.account_window = account_window
        self.ip_limit = ip_limit
        self.ip_window = ip_window
        self._failures: dict[tuple[str, str], deque[float]] = {}
        self._lock = Lock()

    @staticmethod
    def _identifier(value: str) -> str:
        return sha256(value.encode("utf-8")).hexdigest()

    def _key(self, scope: str, value: str) -> tuple[str, str]:
        return scope, self._identifier(value)

    @staticmethod
    def _prune(bucket: deque[float], window: int, now: float) -> None:
        threshold = now - window
        while bucket and bucket[0] <= threshold:
            bucket.popleft()

    @staticmethod
    def _retry_after(bucket: deque[float], window: int, now: float) -> int:
        return max(1, ceil(window - (now - bucket[0])))

    def check(self, *, ip: str, email: str) -> None:
        now = monotonic()
        with self._lock:
            checks = (
                (self._key("account", email), self.account_limit, self.account_window),
                (self._key("ip", ip), self.ip_limit, self.ip_window),
            )
            retry_after = 0
            for key, limit, window in checks:
                bucket = self._failures.get(key)
                if bucket is None:
                    continue
                self._prune(bucket, window, now)
                if not bucket:
                    self._failures.pop(key, None)
                    continue
                if len(bucket) >= limit:
                    retry_after = max(retry_after, self._retry_after(bucket, window, now))
            if retry_after:
                raise MuitasTentativasError(retry_after)

    def record_failure(self, *, ip: str, email: str) -> None:
        now = monotonic()
        with self._lock:
            self._failures.setdefault(self._key("account", email), deque()).append(now)
            self._failures.setdefault(self._key("ip", ip), deque()).append(now)

    def record_success(self, *, email: str) -> None:
        with self._lock:
            self._failures.pop(self._key("account", email), None)

    def clear(self) -> None:
        """Clear process-local counters, primarily for isolated tests."""
        with self._lock:
            self._failures.clear()


login_rate_limiter = LoginRateLimiter()
