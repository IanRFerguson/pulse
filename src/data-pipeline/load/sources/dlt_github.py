from base import DltSource
import os
import requests
import dlt

#####

GITHUB_TOKEN = os.environ["SOURCES__GITHUB__ACCESS_TOKEN"]


@dlt.resource(write_disposition="replace")
def pull_requests(repo_owner: str, repo_name: str):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/pulls"
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    yield response.json()


@dlt.source
def github_source():
    yield pull_requests(repo_owner="move-coop", repo_name="dbt-tmc")


class GithubSource(DltSource):
    """
    DLT source for GitHub data.
    """

    def __init__(self, pipeline_name: str, destination_name: str, dataset_name: str):
        super().__init__(
            pipeline_name=pipeline_name,
            destination_name=destination_name,
            dataset_name=dataset_name,
        )

    def load(self, source_data):
        return super().load(source_data)


#####

if __name__ == "__main__":
    source = GithubSource(
        pipeline_name="github_pipeline",
        destination_name="postgres",
        dataset_name="github_data",
    )
    source.load(source_data=github_source())
