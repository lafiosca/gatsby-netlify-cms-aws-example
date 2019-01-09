#!/bin/bash

# "set -e" makes it so if any step fails, the script aborts:
set -e

cd "${BASH_SOURCE%/*}"
source ./definitions.sh

echo
echo "Creating resource stack ${ProjectName}"

aws cloudformation deploy \
	--template-file ${TemplateFile} \
	--stack-name ${ProjectName} \
	--capabilities CAPABILITY_NAMED_IAM \
	--parameter-overrides \
	S3BucketName=${S3BucketName} \
	UserPoolName=${UserPoolName} \
	UserPoolSmsExternalId=${UserPoolSmsExternalId}

echo
echo "Done creating resource stack ${ProjectName}"
