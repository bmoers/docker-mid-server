#/bin/bash

export $(grep -v '^#' ../.env | xargs -0)

docker run --rm -v ${PWD}:/tmp/backup mongo mongoexport --uri=$MONGODB_URL -c city --sort='{name: 1}' -o /tmp/backup/city.json
docker run --rm -v ${PWD}:/tmp/backup mongo mongoexport --uri=$MONGODB_URL -c build --sort='{id: 1}' -o /tmp/backup/build.json
