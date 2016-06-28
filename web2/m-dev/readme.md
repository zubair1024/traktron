# How to build the mobile app

## Prerequisites

- Install Sencha Cmd on your computer. Download it from here: http://www.sencha.com/products/sencha-cmd/download
- from then you only need to upgrade it with running `sencha upgrade`.
- After installation, check if it works: open a terminal and type `sencha`. It returns a bunch of information.


## Deploy to production
--------------------

In the terminal, go to the folder of the mobile site, eg. with "cd web2/m-dev", then:
   
    sencha app build
    rm -rf ../m/*
    cp -r build/production/Rms/* ../m
    rm -rf build
    rm -rf resources/sass/.sass-cache

The sencha command spits out a bunch of logging information, even a few warnings (eg. "C1015: callSuper has no target (this.callSuper in Ext.layout.Default.setContainer) -- .../web2/m-dev/touch/src/layout/Default.js:63")
Ignore them.