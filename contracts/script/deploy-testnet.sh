#!/bin/bash
# Deploy Apex Predators to Monad testnet
# Usage: ./script/deploy-testnet.sh <private_key>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./script/deploy-testnet.sh <private_key>"
    exit 1
fi

forge script script/Deploy.s.sol:DeployScript \
    --rpc-url https://testnet-rpc.monad.xyz \
    --broadcast \
    --private-key "$1" \
    -vvvv
