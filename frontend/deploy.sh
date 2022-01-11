# TODO check presence of 2nd argument (version number)

if [ "$1" == "deploy" ]
then
	echo "WARNING: Do you really want to deploy with the game? This SHOULD NEVER BE DONE before the game is released to the world, since this means that the game specs and the visualizer become public."
	select yn in "Yes" "No"; do
		case $yn in
			Yes ) break;;
			No ) exit;;
		esac
	done
	# echo "WARNING: Do you have an up-to-date version of frontend/public/access.txt? If not, make sure to obtain it from someone who has it."
	# select yn in "Yes" "No"; do
	# 	case $yn in
	# 		Yes ) break;;
	# 		No ) exit;;
	# 	esac
	# done
	echo "Proceding with deploy!"

	# TODO check git status
	# (on master, up-to-date)

	rm -r public/specs
	mkdir public/specs
	cp -r ../specs public

	rm -r public/javadoc
	cd ..
	# Assumes version as second arg to deploy script
	./gradlew release_docs_zip -Prelease_version=$2
	mv battlecode-javadoc-$2.zip javadoc.zip
	unzip -d javadoc javadoc.zip
	rm javadoc.zip
	mkdir frontend/public/javadoc
	mv javadoc frontend/public
	cd frontend
	# Gets generated somewhere in the javadoc process; is better not to have, to ensure that a different bucket (the battleaccess bucket) always holds this.
	rm public/version.txt

	rm -r public/out
	cd ../client
	cd playback
	npm install
	npm run build
	cd ../visualizer
	npm install
	npm run prod
	mkdir ../../frontend/public/out
	cp -r out ../../frontend/public
	cd ../../frontend

	npm install
	npm run build

	rm -r public/specs
	rm -r public/javadoc
	rm -r public/out
	cd build
	gsutil -m rm gs://battlecode21-frontend/**
	gsutil -m cp -r * gs://battlecode21-frontend
	cd ..
elif [ "$1" == "deploynogame" ]
then
	echo "Deploying without game!"
    npm install
	npm run buildnogame
	cd build
	gsutil -m rm gs://battlecode21-frontend/**
	gsutil -m cp -r * gs://battlecode21-frontend
	cd ..
elif [ "$1" == "clean" ]
then
	gsutil -m rm gs://battlecode21-frontend/**
else
	echo "Unsupported instruction"
fi
