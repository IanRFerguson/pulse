import importlib


def test_load_uses_staged_parquet_without_requerying_source(monkeypatch):
    monkeypatch.setenv("GCS_BUCKET", "test-bucket")
    monkeypatch.setenv("SOURCES__ASANA__ACCESS_TOKEN", "test-token")
    monkeypatch.setenv("SOURCES__FRESHDESK__DOMAIN", "test-domain")
    monkeypatch.setenv("SOURCES__FRESHDESK__API_SECRET_KEY", "test-key")
    monkeypatch.setenv("SOURCES__GITHUB__ACCESS_TOKEN", "test-token")

    base = importlib.import_module("src.data_pipeline.load.sources.base")
    base = importlib.reload(base)

    created_pipelines = []

    class FakePipeline:
        def __init__(self, name):
            self.name = name
            self.dataset_name = f"{name}_dataset"
            self.calls = []

        def run(self, data, **kwargs):
            self.calls.append((data, kwargs))
            return {"pipeline": self.name}

    def fake_pipeline(name, **kwargs):
        pipeline = FakePipeline(name)
        created_pipelines.append(pipeline)
        return pipeline

    staged_filesystem_calls = []

    def fake_filesystem_destination(*, bucket_url):
        return {"bucket_url": bucket_url}

    def fake_filesystem_source(bucket_url, *, file_glob):
        staged_filesystem_calls.append((bucket_url, file_glob))
        return {"bucket_url": bucket_url, "file_glob": file_glob}

    class FakeParquetResource:
        def __init__(self):
            self.resource_name = None

        def with_name(self, resource_name):
            self.resource_name = resource_name
            return self

        def pipe_data_from(self, parent):
            return {"resource_name": self.resource_name, "parent": parent}

    monkeypatch.setattr(base.dlt, "pipeline", fake_pipeline)
    monkeypatch.setattr(base, "filesystem_destination", fake_filesystem_destination)
    monkeypatch.setattr(base, "filesystem_source", fake_filesystem_source)
    monkeypatch.setattr(base, "read_parquet", FakeParquetResource)

    class TestSource(base.DltSource):
        source_calls: int = 0

        def sources(self):
            self.source_calls += 1

            class FakeSource:
                selected_resources = {"alpha": object(), "beta": object()}

            return [FakeSource()]

    source = TestSource(
        pipeline_name="demo",
        gcs_prefix="demo",
        destination_name="postgres",
        dataset_name="demo_data",
    )

    source.load()

    extract_pipeline, load_pipeline = created_pipelines

    assert source.source_calls == 1
    extract_data, extract_kwargs = extract_pipeline.calls[0]
    assert extract_kwargs == {"loader_file_format": "parquet"}
    assert len(extract_data) == 1
    assert list(extract_data[0].selected_resources.keys()) == ["alpha", "beta"]

    load_data, load_kwargs = load_pipeline.calls[0]
    assert load_kwargs == {}
    assert load_data == [
        {
            "resource_name": "alpha",
            "parent": {
                "bucket_url": "gs://test-bucket/demo",
                "file_glob": "demo__extract_dataset/alpha/*.parquet",
            },
        },
        {
            "resource_name": "beta",
            "parent": {
                "bucket_url": "gs://test-bucket/demo",
                "file_glob": "demo__extract_dataset/beta/*.parquet",
            },
        },
    ]
    assert staged_filesystem_calls == [
        ("gs://test-bucket/demo", "demo__extract_dataset/alpha/*.parquet"),
        ("gs://test-bucket/demo", "demo__extract_dataset/beta/*.parquet"),
    ]
