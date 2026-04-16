import os
from typing import List

import dlt
import requests

# NOTE: I hate this but keeping it for development speed
try:
    from .base import DltSource
except ImportError:
    from base import DltSource

#####

ASANA_TOKEN = os.environ["SOURCES__ASANA__ACCESS_TOKEN"]
DATA_ENGINEERING_PROJECT = "1200839284702516"


class AsanaSource(DltSource):
    """
    DLT source for Asana data.
    """

    full_refresh: bool = False

    def sources(self) -> List[dlt.resource]:
        write_disposition = "replace" if self.full_refresh else "merge"

        @dlt.resource(write_disposition=write_disposition, primary_key="gid")
        def project_tasks(project_id: str):
            """Fetches tasks from a specific Asana project."""
            url = f"https://app.asana.com/api/1.0/projects/{project_id}/tasks"
            headers = {"Authorization": f"Bearer {ASANA_TOKEN}"}

            # Asana tasks endpoint only returns names/gids by default.
            # We add opt_fields to get the data you actually want.
            params = {
                "opt_fields": "name,completed,due_on,assignee.name,notes,modified_at,custom_fields",
                "limit": 100,
            }

            while True:
                response = requests.get(url, headers=headers, params=params)
                response.raise_for_status()

                json_data = response.json()
                page_data = json_data.get("data", [])

                if not page_data:
                    break

                yield page_data

                # Check if there is another page
                next_page = json_data.get("next_page")
                if next_page:
                    # Asana provides an 'offset' token for the next request
                    params["offset"] = next_page.get("offset")
                else:
                    # No more pages left
                    break

        @dlt.source
        def data_engineering_tasks():  # type: ignore[no-untyped-def]
            yield project_tasks(project_id=DATA_ENGINEERING_PROJECT)

        return [data_engineering_tasks()]

    def load(self):
        source_data = self.sources()
        return super().load(source_data)


#####

if __name__ == "__main__":
    source = AsanaSource(
        pipeline_name="asana_pipeline",
        destination_name="postgres",
        dataset_name="asana_data",
    )
    source.load()
