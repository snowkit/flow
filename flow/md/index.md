
<a href="{{{rel_path}}}index.html" id="logo"><img src="{{{rel_path}}}images/logo.png" /></a>

<div class="topmenu">
[usage](#usage) . [guide](#guide) ![github]({{{rel_path}}}/images/github.png)  [source](https://github.com/underscorediscovery/flow) . [issues](https://github.com/underscorediscovery/flow/issues/)
</div>

---
<script src="{{{rel_path}}}js/release.version.js"> </script>
<div class="version">current version <a href="https://github.com/underscorediscovery/flow" id="version_notes_link" target="_blank">notes</a> <code> <a id="version_tag" target="_blank" href="https://github.com/underscorediscovery/flow"> master </a></code> </div>

<br/>
##About

**flow** is a project based **build tool** for the **haxe** programming language. <br/>It is free and <a href="https://github.com/underscorediscovery/snow/blob/master/LICENSE.md" data-tooltip="MIT license" class="tooltip">open source</a>.

&nbsp;

[ <img src="{{{rel_path}}}images/haxe.png" target="_blank" class="small-image"/> ](http://haxe.org)   

<small class="haxedesc">Haxe is an expressive, beautiful modern programming language <br/>
      that compiles its own code into other languages. <a href="http://haxe.org/" target="_blank"> learn more</a> </small>

<br/>
<br/>

---

<div class="breakout">

[Install](#guide)
[Project format]({{{rel_path}}}flow.html)
[Features](#features)

</div>

---

###Alpha

<small>
Please note   

flow is currently considered alpha, which means there may be bugs, inconsistencies, incomplete implementations, and possible minor usage/project changes.
It is still considered fairly stable and is being used by multiple frameworks and games,
but there are things to tighten up before 1.0.0 release can be called final. 

Join us in developing and testing the framework and tools, below.
</small>

---

<a name="workflow"> &nbsp; </a>
<h2>What does it do?</h2>


<h4>brief overview</h4>

flow is a project based build tool, meaning that it takes a flow file, <br/>
and executes the commands and tasks in the flow file to build an application.
<br/><br/>
An example of some of the available commands: <br/>

- `files` - copies and templates files from your project to the build
- `icons` - copies, converts and embeds icons for a build
- `package` - creates a zip or tar archive from a build
- `run` - builds, copies files, icons, runs hooks and launches the application

For a full list, see the [usage](#usage) guide.

--- 

<h3>Example flow file</h3>
A flow file is a project. It is a simple, not-strict json file.

<br/>
<br/>

![flow file]({{{rel_path}}}images/project.png)


<hr/>
<br/>
<h2>Where does flow fit in?</h2>

To understand where flow fits, you should understand the way haxe works its magic.
<br/>
<br/>
<b>A _target_ and a _platform_ are not the same thing.</b>
<br/>
The haxe compiler transforms code from the _haxe language_, into another _target_ language.<br/>
<br/>
_haxe_ -&gt; _javascript_ <br/>
_haxe_ -&gt; _c++_ <br/>
<br/>
It's important to know the difference, using the js _target_ as an example. <br/>
**The javascript language, is the target**. <br/><br/>
There is no single _platform_ associated with js, it can run in the _browser_, on the _server_, in a standalone executable on _desktop_ or _mobile_.
The most common _platform_ is the web. <br/>
**The web, is a platform**. <br/>

<h3>Building an application</h3>

The code that haxe generates is 100% ready to use, in a webpage or an application, <br/>haxe has done its job now and it's your turn. <br/>
<br/>
You need to put all this together, maybe in an html file or an app bundle, maybe package an apk for android, add some assets, an icon and make this work over a few platforms. <br/>
<br/>
What if you want to run a script automatically before building? <br/>
What if you want to package nightly builds of your application for testers? <br/>

<h3>This is what flow is for</h3> <br/>
flow takes the haxe output, your project input, and creates shippable applications, <br/> games, websites or more on its supported _platforms_.


flow has many built in tools, from javascript minify to interacting with the cpp build pipeline - it's an expressive tool designed around flexibility and control.

---


<h2>Supported Platforms</h2>

A list of the supported platforms : <br/>

<div class="platform-icons">
![web]({{{rel_path}}}images/platforms/web64.png)
![mac]({{{rel_path}}}images/platforms/mac64.png)
![linux]({{{rel_path}}}images/platforms/linux64.png)
![windows]({{{rel_path}}}images/platforms/windows64.png)
![android]({{{rel_path}}}images/platforms/android64.png)
![ios]({{{rel_path}}}images/platforms/ios64.png)
</div>

- `web` - js (.js)
- `mac` - c++ (.app)
- `windows` - c++ (.exe)
- `linux` - c++ (binary)
- `android` - c++ (.apk)
- `ios` - c++ (.xcodeproj)

---

<a name="guide"> </a>
<h2>Guide</h2>

**Setup guide**<br/>

flow is setup through <a href="http://haxe.org/manual/haxelib.html" target="_blank">haxelib</a>, <br/>
from a terminal (<a class="tooltip" data-tooltip="A terminal is a command line interface from your operating system. <br/><br/> <em>windows</em>: cmd.exe <br/> <em>mac</em>: Terminal.app <br/><br/> In Windows cmd.exe is terrible. There is a good alternative linked below.">need help?</a>) <br/>

by running the following command :

`haxelib git flow https://github.com/underscorediscovery/flow.git`

<!-- ![](images/install.gif) -->

<!-- followed by -->

<!-- `haxelib run flow setup` -->

<!-- This opens a **simple web interface** get you setup. -->

---

<small>
   **btw** <br/>
   - on **windows** [cmder](http://bliker.github.io/cmder/) is an excellent alternative to cmd.exe garbage <br/>
   - on **mac/linux** [fish](http://fishshell.com/) is also a really nice shell <br/>
</small>

---

<div class="guide">

###Install the flow shortcut

Anywhere you see `flow` as a command, it's because an alias has been set up.   

**If you don't install the shortcut**,   
you must use `haxelib run flow` instead of `flow` where you see it.

Right now, the shortcut is a manual install but in the near future will be automated.

#### To install the shortcut alias

- Linux/Mac [download](https://raw.githubusercontent.com/underscorediscovery/flow/master/setup/flow)
    - copy this file to /usr/local/bin or anywhere in your path

- Windows [download](https://raw.githubusercontent.com/underscorediscovery/flow/master/setup/flow.bat)
    - copy this file to c:\haxetoolkit\haxe next to the haxe.exe file, or anywhere in your path

###Usage

The usage guide is accessed in full from the cli,   
simply run `flow` without arguments, or `flow usage`

####for basic use

- `flow build <target> [--debug]`
- `flow run <target> [--debug]`
- `flow clean <target>`
- `flow package <target>`

If target is not specified, it will use your current system i.e

`flow build` on a mac will result in `flow build mac --arch 64`

---

<style> img {max-width:26em;} </style>

## Editor support

Where possible, full code completion and building from the editor is supplied.

#### [Sublime Text](guide/sublimetext.html) (mac/windows/linux)
[![](images/plugins/sublime.png)](guide/sublimetext.html)

---

#### [Atom](https://atom.io/packages/flow) (mac/windows/linux)
[![](images/plugins/atom.png)](https://atom.io/packages/flow)

---

#### [FlashDevelop](guide/flashdevelop.html) (windows only)

template is at [snowkit-fd](https://github.com/Chman/Snowkit-FD), and here is a [Download link](https://github.com/Chman/Snowkit-FD/blob/master/SnowkitTemplate.fdz?raw=true)   

[![](images/plugins/fd.png)](guide/flashdevelop.html)

---

### Features

- `icons` - embeds and converts icons for all targets (except linux)
- `package` - zip or tar your builds quickly
- `hooks` - pre and post hooks (runs a [node.js](http://nodejs.org) script)
- `clean` - delete build and project output separately, or together
- `upx` - for desktop platforms, final binary can be auto compressed
- `files` - flexible copy and templating system
- `build` - take haxe code, and generate a deployable app
- `launch` - run the app, with file sync, internal web server and more

###flow guides

[flow files - the project format]({{{rel_path}}}flow.html) <br/>
~~pipeline - what flow does exactly~~ <br/>
~~platforms - all the gory details~~ <br/>
~~design - how flow fits together~~ <br/>
~~contribute - discuss, build, test~~ <br/>

<br/>

---

<a name="projects"> &nbsp;</a>
<h2>Projects using flow</h2>

[luxe engine](http://luxeengine.com/) - a high level game engine for haxe to build apps or games <br/>
[snow](http://snowkit.org/snow) - a minimal low level toolkit for building frameworks <br/>

</div> <!-- guide -->

<h2>Technology</h2>

flow is built using <a href="http://nodejs.org/" target="_blank"> node.js </a>

<img src="{{{rel_path}}}images/nodejs-light.png"/>

<a name="alternatives"> &nbsp;</a>
<h2>Things like flow</h2>

[aether](https://github.com/openfl/aether) is a long standing haxe build tool (a.k.a lime-tools), used by [OpenFL](https://openfl.org).

---

[feedback](https://github.com/underscorediscovery/flow/issues)
<br/>
<br/>
<br/>
<br/>
<small class="trademark"> All trademarks and registered trademarks are the property of their respective owners.</small>
