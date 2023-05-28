FROM mongo:latest

COPY data.json /data.json

CMD mongoimport --uri mongodb://db_container:27017/envelope --collection data --type json --file /data.json --jsonArray