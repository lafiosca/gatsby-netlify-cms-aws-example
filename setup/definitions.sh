#!/bin/bash

ProjectName=GatsbyNetlifyCMS

S3BucketName=gatsby-netlify-cms

UserPoolName=GatsbyNetlifyCMS
UserPoolSmsExternalId=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

TemplateFile=resources.json
