
DOCKER := $(shell which docker)
DOCKER_TAG := arablocks/ann-identity-manager

docker: Dockerfile
	$(DOCKER) build -t $(DOCKER_TAG) .
