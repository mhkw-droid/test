.PHONY: post-pull repair-compose clean-rebuild overwrite-master overwrite-main bootstrap-dev

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

bootstrap-dev:
	docker compose up -d --build
	docker compose exec backend npx prisma db push
	docker compose exec backend npm run prisma:seed
