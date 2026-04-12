import click
import subprocess

#####

@click.command()
@click.option("--image-tag", default="latest", help="Tag for the Docker image")
@click.option("--repository", default="us-central1-docker.pkg.dev/ian-is-online/tmc-pulse/pulse", help="Artifact Registry repository")
@click.option("--dockerfile", default="Dockerfile", help="Path to the Dockerfile")
@click.option("--push/--no-push", default=True, help="Whether to push the image after building")
def push_docker_image(image_tag: str, repository: str, dockerfile: str, push: bool) -> None:
    """Build and push the Docker image to Artifact Registry."""
    
    # Build the Docker image
    subprocess.run(["docker", "build", "-t", f"{repository}:{image_tag}", "--platform", "linux/amd64", "-f", dockerfile, "."], check=True)

    # Push the Docker image to Artifact Registry
    if push:
        subprocess.run(["docker", "push", f"{repository}:{image_tag}"], check=True)

#####

if __name__ == "__main__":
    push_docker_image()