# Plugin-Mqtt-js

mosquitto on Raspberry pi:

sudo apt-get update
sudo apt-get upgrade

sudo wget http://repo.mosquitto.org/debian/mosquitto-repo.gpg.key
sudo apt-key add mosquitto-repo.gpg.key
sudo rm mosquitto-repo.gpg.key

cd /etc/apt/sources.list.d/

For jessie:
sudo wget http://repo.mosquitto.org/debian/mosquitto-jessie.list

For stretch:
sudo wget http://repo.mosquitto.org/debian/mosquitto-stretch.list

sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients

Check:
sudo service mosquitto status

Stop and run CLI:
sudo service mosquitto stop
mosquitto -v
