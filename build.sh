#!/bin/bash

rm -rf ctbrec-minimal-browser*x64
npx electron-packager --overwrite . ctbrec-minimal-browser --platform=linux --arch=x64 --icon icon.png
# windows app has to be build on windows or wine must be installed
#npx electron-packager --overwrite . ctbrec-minimal-browser --platform=win32 --arch=x64 --icon icon.ico
npx electron-packager --overwrite . ctbrec-minimal-browser --platform=darwin --arch=x64 --icon icon.icns