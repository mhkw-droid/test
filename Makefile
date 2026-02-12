.PHONY: post-pull repair-compose clean-rebuild overwrite-master overwrite-main

post-pull:
	bash scripts/post-pull-check.sh

repair-compose:
	bash scripts/repair-compose.sh

clean-rebuild:
	bash scripts/clean-rebuild.sh

overwrite-master:
	bash scripts/overwrite-with-branch.sh origin master

overwrite-main:
	bash scripts/overwrite-with-branch.sh origin main
