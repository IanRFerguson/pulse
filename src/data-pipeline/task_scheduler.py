import subprocess
from datetime import datetime

from redis import Redis
from rq_scheduler import Scheduler

#####


def run():
    """
    NOTE: This is a little hacky but will suffice for an MVP
    """

    subprocess.run(
        ["uv", "run", "src/data-pipeline/run_pipeline.py", "--docker"], check=True
    )


# 'redis' matches the service name in your docker-compose
redis_conn = Redis(host="redis", port=6379)
scheduler = Scheduler(connection=redis_conn)

# Clear existing schedules to avoid duplicates if you re-run this
for job in scheduler.get_jobs():
    scheduler.cancel(job)

scheduler.schedule(
    scheduled_time=datetime.utcnow(),
    func=run,
    interval=300,  # 5 minutes
    repeat=None,  # Infinite
)
