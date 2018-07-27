FROM arablocks/ann
WORKDIR /opt/ann/identity-manager
ADD . /opt/ann/identity-manager
ENTRYPOINT [ "ann",  "-t", "." ]
