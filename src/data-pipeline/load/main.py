from sources import AsanaSource, FreshdeskSource, GithubSource

#####


def main():
    for source_cls in [GithubSource, AsanaSource, FreshdeskSource]:
        source = source_cls()
        source.load()


#####

if __name__ == "__main__":
    main()
