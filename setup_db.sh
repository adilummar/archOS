#!/bin/bash
sudo -u postgres psql -c "CREATE DATABASE archos_db;"
sudo -u postgres psql -c "CREATE USER elscore WITH ENCRYPTED PASSWORD 'secret';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE archos_db TO elscore;"
sudo -u postgres psql -c "ALTER DATABASE archos_db OWNER TO elscore;"
sudo -u postgres psql -d archos_db -c "GRANT ALL ON SCHEMA public TO elscore;"
