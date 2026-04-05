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


if __name__ == "__main__":
    # 'redis' matches the service name in your docker-compose
    redis_conn = Redis(host="redis", port=6379)
    scheduler = Scheduler(connection=redis_conn)

    # Clear existing schedules to avoid duplicates if you re-run this
    for job in scheduler.get_jobs():
        scheduler.cancel(job)

    # Import via module name (not __main__) so the worker can deserialize the reference
    from task_scheduler import run as _run

    scheduler.schedule(
        scheduled_time=datetime.now(),
        func=_run,
        interval=300,  # 5 minutes
        repeat=None,  # Infinite
    )
