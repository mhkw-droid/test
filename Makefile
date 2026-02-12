.PHONY: post-pull repair-compose

post-pull:
	bash scripts/post-pull-check.sh

repair-compose:
	bash scripts/repair-compose.sh
