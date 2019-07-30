if [ "$1" == "deploy" ]
then
	npm run build
	cd build
	gsutil -m cp -r * gs://battlecode20-frontend
	cd ..
elif [ "$1" == "clean" ]
then
	gsutil -m rm gs://battlecode20-frontend/**
else
	echo "Unsupported instruction"
fi
