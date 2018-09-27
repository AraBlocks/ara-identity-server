#!/bin/bash

declare EFS_ID="${EFS_ID:-fs-0e1f7245}"
declare AWS_REGION="${AWS_REGION:-us-east-1}"
declare ARA_ROOT_DIR="/home/ubuntu/.ara"

apt-get install nfs-common

## Ensure Ara root directory exists
mkdir -p /home/ubuntu/.ara
mount \
  --types nfs4 \
  --options nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 \
  $EFS_ID.efs.$AWS_REGION.amazonaws.com:/ \
  $ARA_ROOT_DIR