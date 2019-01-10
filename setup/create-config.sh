#!/bin/bash

# "set -e" makes it so if any step fails, the script aborts:
set -e

cd "${BASH_SOURCE%/*}"
source ./definitions.sh

echo
echo "Writing resource stack outputs to config file"

printf '{\n\t"region": "%s",\n\t"userPoolId": "%s",\n\t"userPoolName": "%s",\n\t"appClientId": "%s"\n}' \
	$(aws configure get region) \
	$(aws cloudformation describe-stacks --stack-name ${ProjectName} --output text | grep ^OUTPUTS | cut -f3-4 | grep ^UserPoolId | cut -f2) \
	${UserPoolName} \
	$(aws cloudformation describe-stacks --stack-name ${ProjectName} --output text | grep ^OUTPUTS | cut -f3-4 | grep ^UserPoolClientWeb | cut -f2) \
	> ../config/aws-resources.json

echo "Wrote config file"
