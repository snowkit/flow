
<a href="{{{rel_path}}}index.html" id="logo"><img src="{{{rel_path}}}images/logo.png" /></a>

<div class="topmenu">
[usage]({{{rel_path}}}usage.html) . [guide](#guide) ![github]({{{rel_path}}}/images/github.png)  [source](https://github.com/underscorediscovery/flow) . [issues](https://github.com/underscorediscovery/flow/issues/)
</div>

---
<div class="version">current version `1.0.0-beta`</div>

<br/>
##About

**flow** is a project based **build tool** for the **haxe** programming language.

&nbsp;

[ <img src="{{{rel_path}}}images/haxe.png" target="_blank" class="small-image"/> ](http://haxe.org)   

<small class="haxedesc">Haxe is an expressive, beautiful modern programming language <br/>
      that compiles it's own code into other languages. <a href="http://haxe.org/" target="_blank"> learn more</a> </small>

<br/>
<br/>

---

<div class="breakout">

[Install](#guide)
[Project format]({{{rel_path}}}flow.html)
[Features](#features)

</div>

---

<a name="workflow"> &nbsp; </a>
<h2>What does it do?</h2>


<h4>brief overview</h4>

flow is a project based build tool, meaning that it simply takes a “flow file”, <br/>
and executes the commands and tasks you request - according to your project.
<br/><br/>
An example of some of the available commands : <br/>

- `files` - copies and templates files from your project to the build
- `icons` - copies, converts and embeds icons for a build
- `package` - creates a zip or tar archive from a build
- `run` - builds, copies files, icons, runs hooks and launches the application

For a full list, see the [usage]({{{rel_path}}}usage.html) guide.

--- 

<h3>Example flow file</h3>
A flow file is a project. It is a simple, not-strict json file.

<br/>
<br/>

![flow file]({{{rel_path}}}images/project.png)


<hr/>

<h2>Why do I need it?</h2>

To understand why flow exists, you must understand the way haxe works it's magic.

<h3>A _target_ and a _platform_ are not the same thing.</h3>

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

The code that haxe generates is 100% ready to use, in a webpage or an application, <br/>haxe has done it's job now and it's your turn. <br/>
<br/>
You need to put all this together, maybe in an html file or an app bundle, maybe package an apk for android, add some assets, an icon and make this work over a few platforms. <br/>
<br/>
What if you want to run a script automatically before building? <br/>
What if you want to package nightly builds of your application for testers? <br/>

<h3>This is what flow is for</h3> <br/>
flow takes the haxe output, your project input, and creates shippable applications, <br/> games, websites or more on it's supported _platforms_.


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
from a terminal (<a href="{{{rel_path}}}guide/terminology.html" target="_blank">need help?</a>) <br/>

by running the following command :

`haxelib install flow`

followed by

`haxelib run flow setup`

This opens a **simple web interface** get you setup.

---

<small>
   **btw** <br/>
   - on **windows** [cmder](http://bliker.github.io/cmder/) is an excellent alternative to cmd.exe garbage <br/>
   - on **mac/linux** [fish](http://fishshell.com/) is also a really nice shell <br/>
</small>

---

<div class="guide">

**flow guides**<br/>
<br/>
[flow files - the project format]({{{rel_path}}}flow.html) <br/>
[pipeline - what flow does exactly]({{{rel_path}}}pipeline.html) <br/>
[platforms - all the gory details]({{{rel_path}}}platforms.html) <br/>
[design - how flow fits together]({{{rel_path}}}design.html) <br/>
[contribute - discuss, build, test]({{{rel_path}}}contribute.html) <br/>



<a name="projects"> &nbsp;</a>
<h2>Projects using flow</h2>

[luxe engine](#) - game engine for haxe <br/>
[snow](#) - a minimal toolkit for building applications and games <br/>

</div> <!-- guide -->

<h2>Technology</h2>

flow is proudly built using <a href="http://nodejs.org/" target="_blank"> node.js </a>

<img src="{{{rel_path}}}images/nodejs-light.png"/>

<a name="alternatives"> &nbsp;</a>
<h2>Things like flow</h2>

[aether](https://github.com/openfl/aether) is a long standing haxe build tool (a.k.a lime-tools), used by [OpenFL](https://openfl.org).

---

[feedback](http://snowkit.org)
<br/>
<br/>
<br/>
<br/>
<small class="trademark"> All trademarks and registered trademarks are the property of their respective owners.</small>
