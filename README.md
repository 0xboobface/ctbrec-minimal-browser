# Requirements
- node.js
- npm

# Build instructions
```
npm install
npm install electron-packager --save-dev
node node_modules/electron-packager/bin/electron-packager.js --overwrite . ctbrec-minimal-browser
```
This builds the browser for your current OS. If you want to build for other platforms you can use additional switches. Available platforms are
linux, win32, darwin. For example macos 64bit:
```
node node_modules/electron-packager/bin/electron-packager.js --overwrite . ctbrec-minimal-browser --platform=darwin --arch=x64 --icon icon.icns
```