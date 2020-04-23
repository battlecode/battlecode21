import os, argparse, zipfile


def zip_file(folder_name):
    # Try to read contents of folder_name
    try:
        files = os.listdir(folder_name)
    except:
        if (folder_name.endswith('.py')):
            print('It appears you have selected a python file, not a folder. Please enter the folder containing your bot.py')
        else:
            print('It appears you have not selected a valid folder')
        return
    
    # ensure there is 'bot.py' in folder_name
    if not 'bot.py' in files:
        print('It appears there is no \'bot.py\' in this folder')
        return

    # zip it up!
    zip_name = folder_name + '.zip'
    with zipfile.ZipFile(zip_name, 'w') as zip_file:
        for folderName, subfolders, filenames in os.walk(folder_name):
            for filename in filenames:
                #create complete filepath of file in directory
                filePath = os.path.join(folderName, filename)
                # Add file to zip
                zip_file.write(filePath)

    print('Success! Upload {} through the online portal'.format(zip_name))




if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('bot_name', help='The name of the bot you wish to zip')

    args = parser.parse_args()

    zip_file(args.bot_name)

