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

FRESHDESK_DOMAIN = os.environ["SOURCES__FRESHDESK__DOMAIN"]
FRESHDESK_API_KEY = os.environ["SOURCES__FRESHDESK__API_SECRET_KEY"]


class FreshdeskSource(DltSource):
    """
    DLT source for Freshdesk data.
    """

    full_refresh: bool = False

    def sources(self) -> List[dlt.sources.DltSource]:
        write_disposition = "replace" if self.full_refresh else "merge"
        # Freshdesk uses Basic Auth with the API key as the username
        # and a dummy string (like 'X') as the password.
        auth = (FRESHDESK_API_KEY, "X")

        @dlt.resource(write_disposition=write_disposition, primary_key="id")
        def tickets():
            # 1. First, grab all agents and store them in a dictionary
            agents_res = requests.get(
                f"https://{FRESHDESK_DOMAIN}.freshdesk.com/api/v2/agents", auth=auth
            )
            agents_res.raise_for_status()
            # Map ID -> Name: {12345: "John Doe"}
            agent_map = {a["id"]: a["contact"]["name"] for a in agents_res.json()}

            # 2. Now fetch tickets
            url = f"https://{FRESHDESK_DOMAIN}.freshdesk.com/api/v2/tickets"
            params = {"per_page": 100, "page": 1}

            while True:
                response = requests.get(url, auth=auth, params=params)
                response.raise_for_status()
                tickets = response.json()

                if not tickets:
                    break

                for ticket in tickets:
                    # Manually inject the agent name into the ticket record
                    r_id = ticket.get("responder_id")
                    ticket["assigned_agent_name"] = agent_map.get(r_id, "Unassigned")
                    yield ticket

                params["page"] += 1

        @dlt.resource(write_disposition=write_disposition, primary_key="id")
        def agents():
            """Fetches all agents so you can map responder_id to a Name."""
            url = f"https://{FRESHDESK_DOMAIN}.freshdesk.com/api/v2/agents"
            response = requests.get(url, auth=auth)
            response.raise_for_status()
            yield response.json()

        @dlt.source
        def support_tickets():
            yield tickets()

        @dlt.source
        def support_agents():
            yield agents()

        return [support_tickets(), support_agents()]

    def load(self):
        source_data = self.sources()
        return super().load(source_data)


#####

if __name__ == "__main__":
    source = FreshdeskSource(
        pipeline_name="freshdesk_pipeline",
        destination_name="postgres",
        dataset_name="freshdesk_data",
    )
    source.load()
