if [ "$1" == "deploy" ]
then
	npm run build
	cd build
	gsutil -m cp -r * gs://battlehack-southeast19-frontend
	cd ..
elif [ "$1" == "clean" ]
then
	gsutil -m rm gs://battlehack-southeast19-frontend/**
else
	echo "Unsupported instruction"
fi
