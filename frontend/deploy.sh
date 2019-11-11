if [ "$1" == "deploy" ]
then
	echo "WARNING: Do you really want to deploy with the game? This SHOULD NEVER BE DONE before the game is released to the world, since this means that the game specs and the visualizer become public."
	select yn in "Yes" "No"; do
		case $yn in
			Yes ) break;;
			No ) exit;;
		esac
	done
    npm install
	npm run build
	cd build
	gsutil -m cp -r * gs://battlecode20-frontend
	cd ..
elif [ "$1" == "clean" ]
then
	gsutil -m rm gs://battlecode20-frontend/**
elif [ "$1" == "deploynogame" ]
then
    npm install
	npm run buildnogame
	cd build
	gsutil -m cp -r * gs://battlecode20-frontend
	cd ..
else
	echo "Unsupported instruction"
fi
