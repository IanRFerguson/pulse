import os
from typing import List

import dlt
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .base import DltSource

#####

GITHUB_TOKEN = os.environ["SOURCES__GITHUB__ACCESS_TOKEN"]

_retry_strategy = Retry(
    total=5,
    backoff_factor=2,
    status_forcelist=[503],
    allowed_methods=["GET"],
    raise_on_status=False,
)
_http_adapter = HTTPAdapter(max_retries=_retry_strategy)


def _get_session() -> requests.Session:
    session = requests.Session()
    session.mount("https://", _http_adapter)
    return session


class GithubSource(DltSource):
    """
    DLT source for GitHub data.
    """

    full_refresh: bool = False

    def sources(self) -> List[dlt.resource]:
        write_disposition = "replace" if self.full_refresh else "merge"

        @dlt.resource(write_disposition=write_disposition, primary_key="id")
        def pull_requests(repo_owner: str, repo_name: str):
            url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/pulls"
            headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
            session = _get_session()
            response = session.get(url, headers=headers)
            response.raise_for_status()
            yield response.json()

        @dlt.source
        def dbt_tmc_pulls():  # type: ignore[no-untyped-def]
            yield pull_requests(repo_owner="move-coop", repo_name="dbt-tmc")

        @dlt.source
        def canales_pulls():  # type: ignore[no-untyped-def]
            yield pull_requests(repo_owner="move-coop", repo_name="canales")

        @dlt.source
        def terraform_pulls():  # type: ignore[no-untyped-def]
            yield pull_requests(repo_owner="move-coop", repo_name="terraform")

        @dlt.source
        def pipelines_pulls():  # type: ignore[no-untyped-def]
            yield pull_requests(repo_owner="move-coop", repo_name="pipelines")

        return [dbt_tmc_pulls(), canales_pulls(), terraform_pulls(), pipelines_pulls()]

    def load(self):
        source_data = self.sources()
        return super().load(source_data)


#####

if __name__ == "__main__":
    source = GithubSource(
        pipeline_name="github_pipeline",
        destination_name="postgres",
        dataset_name="github_data",
    )
    source.load()
