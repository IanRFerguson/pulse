from sources import GithubSource, AsanaSource, FreshdeskSource

#####


def main():
    for source_cls in [GithubSource, AsanaSource, FreshdeskSource]:
        source = source_cls()
        source.load()


#####

if __name__ == "__main__":
    main()
