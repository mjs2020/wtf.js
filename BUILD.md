## Notes about building releases

You will need the three platorms to build apps for each of them.

## Windows

## Linux
If the build happens from a codebase that's on NTFS the build will fail due to lack of permissions.
The best way to achieve a build is to checkout, install deps and run the build in a temporary folder on an ext drive:

    cd ~/Desktop
    git clone git@github.com:mjs2020/wtf.js.git
    cd wtf.js
    npm install
    npm run release
    
    
Also note that the project name for the DEB package must be lowercase.

## OSX

No issues reported. For OSX just run

    npm run release