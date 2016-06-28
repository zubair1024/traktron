# The ROAMWORKS UI framework

All done with Kendo UI, Bootstrap and jQuery.


## HOW TO deploy files of the frontend

Currently, we have two files to access the frontend:

*   **index.html**
    contains JS files that are already compressed for deployment.
    Most of the JS files have been mangled into one JS file to cut down loading times and increase application speed.
*   **index_dev.html**
    contains all uncompressed files for easy debugging.
    Use this files for development.

When you want to deploy all changes, then run `grunt` in this directory.

What does "run `grunt`" mean?
Once you have opened the "Node.js command prompt" and installed the grunt-cli, you can just type "grunt" in the web2 folder.
You should see something like this:

	D:\ROAMSVN\base\web2>grunt
    Running "jshint:files" (jshint) task
    >> 76 files lint free.
    
    Running "qunit:all" (qunit) task
    Testing test/index.html .OK
    >> 2 assertions passed (4ms)
    
    Running "htmlmin:dist" (htmlmin) task
    Minified 3 files
    
    Running "browserify:build" (browserify) task
    >> Bundle js/maps/modules/maps.js created.
    
    Running "exorcise:bundle" (exorcise) task
    Exorcising source map from js/maps/modules/maps.js
    
    Running "uglify:dist" (uglify) task
    >> 3 files created.
    
    Running "uglify:shims" (uglify) task
    >> 1 file created.
    
    Running "less:dist" (less) task
    >> 9 stylesheets created.
    
    Running "cssmin:dist" (cssmin) task
    >> 2 files created. 188.7 kB → 83.79 kB
    
    Done, without errors.

That's all.


## What software is needed for deployment?

1.  Install NodeJS on your machine.
    For that, go to <http://nodejs.org/download/>
2.  Install grunt-cli globally and all needed grunt modules with
    for windows users: open "node.js" command prompt to execute the following
    `sudo npm install -g grunt-cli`
    `cd web2`
    `npm install`


## What it does

1.  Checks code quality (jsHint)
2.  Uglifies all JS files of the projects into four (`build/lib.min.js`, `build/misc.min.js`, `build/app.min.js`, `build/maps.min.js`)
3.  Minifies CSS into two files (`build/app.min.css`, `build/rtl.min.css`)


## FAQ

Q: How can I have a more detailed look what the tasks are actually doing?
A: Run grunt with the `--verbose` flag. Or click the "V" button in WebStorm's/PhpStorm's Grunt Console.

Q: How do I update the installed node modules?
A: Run `npm update` in `web2` directory. Additionally, run `sudo npm update -g` to update all your globally installed modules.

Q: Which things do we need to adjust to align the web help to the current style?
A: unzip the help files (created using the "HTML5 responsive standard template") and put them in web2/help
   Then adjust the `helpContent/template/Theme1_Standard/main.css` and prepend this line:
   
    @import url('../../css/help.css');

Q: which cultures are supported in the frontend?
A: the following cultures come along with Kendo:

    af-ZA
    af
    am-ET
    am
    ar-AE
    ar-BH
    ar-DZ
    ar-EG
    ar-IQ
    ar-JO
    ar-KW
    ar-LB
    ar-LY
    ar-MA
    ar-OM
    ar-QA
    ar-SA
    ar-SY
    ar-TN
    ar-YE
    ar
    arn-CL
    arn
    as-IN
    as
    az-Cyrl-AZ
    az-Cyrl
    az-Latn-AZ
    az-Latn
    az
    ba-RU
    ba
    be-BY
    be
    bg-BG
    bg
    bn-BD
    bn-IN
    bn
    bo-CN
    bo
    br-FR
    br
    bs-Cyrl-BA
    bs-Cyrl
    bs-Latn-BA
    bs-Latn
    bs
    ca-ES
    ca
    co-FR
    co
    cs-CZ
    cs
    cy-GB
    cy
    da-DK
    da
    de-AT
    de-CH
    de-DE
    de-LI
    de-LU
    de
    dsb-DE
    dsb
    dv-MV
    dv
    el-GR
    el
    en-029
    en-AU
    en-BZ
    en-CA
    en-GB
    en-IE
    en-IN
    en-JM
    en-MY
    en-NZ
    en-PH
    en-SG
    en-TT
    en-US
    en-ZA
    en-ZW
    en
    es-AR
    es-BO
    es-CL
    es-CO
    es-CR
    es-DO
    es-EC
    es-ES
    es-GT
    es-HN
    es-MX
    es-NI
    es-PA
    es-PE
    es-PR
    es-PY
    es-SV
    es-US
    es-UY
    es-VE
    es
    et-EE
    et
    eu-ES
    eu
    fa-IR
    fa
    fi-FI
    fi
    fil-PH
    fil
    fo-FO
    fo
    fr-BE
    fr-CA
    fr-CH
    fr-FR
    fr-LU
    fr-MC
    fr
    fy-NL
    fy
    ga-IE
    ga
    gd-GB
    gd
    gl-ES
    gl
    gsw-FR
    gsw
    gu-IN
    gu
    ha-Latn-NG
    ha-Latn
    ha
    he-IL
    he
    hi-IN
    hi
    hr-BA
    hr-HR
    hr
    hsb-DE
    hsb
    hu-HU
    hu
    hy-AM
    hy
    id-ID
    id
    ig-NG
    ig
    ii-CN
    ii
    is-IS
    is
    it-CH
    it-IT
    it
    iu-Cans-CA
    iu-Cans
    iu-Latn-CA
    iu-Latn
    iu
    ja-JP
    ja
    ka-GE
    ka
    kk-KZ
    kk
    kl-GL
    kl
    km-KH
    km
    kn-IN
    kn
    ko-KR
    ko
    kok-IN
    kok
    ky-KG
    ky
    lb-LU
    lb
    lo-LA
    lo
    lt-LT
    lt
    lv-LV
    lv
    mi-NZ
    mi
    mk-MK
    mk
    ml-IN
    ml
    mn-Cyrl
    mn-MN
    mn-Mong-CN
    mn-Mong
    mn
    moh-CA
    moh
    mr-IN
    mr
    ms-BN
    ms-MY
    ms
    mt-MT
    mt
    nb-NO
    nb
    ne-NP
    ne
    nl-BE
    nl-NL
    nl
    nn-NO
    nn
    no
    nso-ZA
    nso
    oc-FR
    oc
    or-IN
    or
    pa-IN
    pa
    pl-PL
    pl
    prs-AF
    prs
    ps-AF
    ps
    pt-BR
    pt-PT
    pt
    qut-GT
    qut
    quz-BO
    quz-EC
    quz-PE
    quz
    rm-CH
    rm
    ro-RO
    ro
    ru-RU
    ru-UA
    ru
    rw-RW
    rw
    sa-IN
    sa
    sah-RU
    sah
    se-FI
    se-NO
    se-SE
    se
    si-LK
    si
    sk-SK
    sk
    sl-SI
    sl
    sma-NO
    sma-SE
    sma
    smj-NO
    smj-SE
    smj
    smn-FI
    smn
    sms-FI
    sms
    sq-AL
    sq
    sr-Cyrl-BA
    sr-Cyrl-CS
    sr-Cyrl-ME
    sr-Cyrl-RS
    sr-Cyrl
    sr-Latn-BA
    sr-Latn-CS
    sr-Latn-ME
    sr-Latn-RS
    sr-Latn
    sr
    sv-FI
    sv-SE
    sv
    sw-KE
    sw
    syr-SY
    syr
    ta-IN
    ta
    te-IN
    te
    tg-Cyrl-TJ
    tg-Cyrl
    tg
    th-TH
    th
    tk-TM
    tk
    tn-ZA
    tn
    tr-TR
    tr
    tt-RU
    tt
    tzm-Latn-DZ
    tzm-Latn
    tzm
    ug-CN
    ug
    uk-UA
    uk
    ur-PK
    ur
    uz-Cyrl-UZ
    uz-Cyrl
    uz-Latn-UZ
    uz-Latn
    uz
    vi-VN
    vi
    wo-SN
    wo
    xh-ZA
    xh
    yo-NG
    yo
    zh-CHS
    zh-CHT
    zh-CN
    zh-HK
    zh-Hans
    zh-Hant
    zh-MO
    zh-SG
    zh-TW
    zh
    zu-ZA
    zu
