# AstroVitals - NASA Space Apps Challenge 2026
# Challenge 5: Health Monitoring Software for Astronauts
# Team Orbitrix - Dhaka, Bangladesh

.PHONY: help cache demo test build clean

help:
	@echo AstroVitals Command Suite:
	@echo   make cache : Pre-fetch demo inputs and generate fixtures
	@echo   make demo  : Run application with OFFLINE=1 fixture replay mode
	@echo   make test  : Run deterministic compute and provenance unit tests
	@echo   make build : Build frontend static production bundle

cache:
	python scripts/generate_fixtures.py

demo:
	python -c "import os, uvicorn; os.environ['OFFLINE']='1'; uvicorn.run('backend.main:app', host='0.0.0.0', port=8080, reload=True)"

test:
	python -m unittest discover -s backend/tests

build:
	cd frontend && npm run build
