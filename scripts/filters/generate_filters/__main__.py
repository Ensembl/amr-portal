import sys
from generate_filters import get_cli_args, generate_filters

if __name__ == "__main__":
    cli = get_cli_args().parse_args(sys.argv[1:])
    generate_filters(cli.config, cli.data, cli.output)
