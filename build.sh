#!/bin/bash

rm -rf ctbrec-minimal-browser*x64
node node_modules/electron-packager/cli.js --overwrite . ctbrec-minimal-browser --platform=linux --arch=x64 --icon icon.png
# windows app has to be build on windows or wine must be installed
#node node_modules/electron-packager/cli.js --overwrite . ctbrec-minimal-browser --platform=win32 --arch=x64
node node_modules/electron-packager/cli.js --overwrite . ctbrec-minimal-browser --platform=darwin --arch=x64 --icon icon.icns 
