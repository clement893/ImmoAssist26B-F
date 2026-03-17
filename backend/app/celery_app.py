"""Celery configuration."""

import os

from celery import Celery

# Create Celery app
celery_app = Celery(
    "modele_backend",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
)


@celery_app.task(bind=True)
def debug_task(self):
    """Debug task."""
    print(f"Request: {self.request!r}")
