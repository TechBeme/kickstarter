"""Convenience runner for the Kickstarter scraper/enricher."""

from src.kickstarter_tools import run


if __name__ == "__main__":
    import sys
    sys.exit(run.main(sys.argv[1:]))
