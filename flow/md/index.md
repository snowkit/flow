
<a href="{{{rel_path}}}index.html" id="logo"><img src="{{{rel_path}}}images/logo.png" /></a>

<div class="topmenu">
[usage]({{{rel_path}}}usage.html) . [guide](#guide) ![github]({{{rel_path}}}/images/github.png)  [source](https://github.com/underscorediscovery/flow) . [issues](https://github.com/underscorediscovery/flow/issues/)
</div>

---

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

<a name="workflow"> &nbsp;</a>
<h2>What does it do?</h2>

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
<br/>
With the c++ _target_, the code can run on a huge number of _platforms_, from desktop to mobile and many more. c++ is the _target_, Windows is the _platform_.

<h3>Building an application</h3>

Now that you understand the separation - the code that haxe generates is 100% ready to use, say in a webpage or an application., but has has done it's job. <br/>
<br/>
Now you need to put it all together, in a webpage or an application. <br/>
<br/>
What if your c++ application haxe generates needs an icon? <br/>
What if you want to copy files across, required to run your application? <br/>
What if you want to run a script automatically before building? <br/>
What if you want to package nightly of your application for testers? <br/>

**This is what flow is for** <br/>
flow takes the haxe output, your project input, and creates shippable applications, games, websites or more on it's supported _platforms_.

<h3>Brief Overview</h3>
flow is a project based build tool, it simply takes the flow file you describe, <br/>
and executes the tasks you request according to a flow file.
<br/><br/>
A quick overview of the available commands : <br/>

- `files` - copies and templates files from your project to the build
- `icons` - copies, converts and embeds icons for a build
- `package` - creates a zip or tar archive from a build
- `run` - builds, copies files, icons, runs hooks and launches the application

For a full list, see the [usage]({{{rel_path}}}usage.html) guide.

A list of the supported platforms : <br/>

- `web` - from js _target_ (.js)
- `mac` - from c++ _target_ (.app)
- `windows` - from c++ _target_ (.exe)
- `linux` - from c++ _target_ (binary)
- `android` - from c++ _target_ (.apk)
- `ios` - from c++ _target_ (.app + xcode project)

flow has many tools, from javascript minify to interacting with the cpp build pipeline directly - it's an expressive tool designed around flexibility and simplicity.
for full details, read the [flow file project format]({{{rel_path}}}flow.html), as it's the most direct route to learn more.

<br/>

---

<a name="guide"> &nbsp;</a>
<h2>Guide</h2>

<br/>
**Setup guide**<br/>
<br/>

flow is setup through <a href="http://haxe.org/manual/haxelib.html" target="_blank">haxelib</a>, <br/>
from a terminal (<a href="{{{rel_path}}}guide/terminology.html" target="_blank">need help?</a>) <br/>

by running the following command :

`haxelib install flow`

followed by

`haxelib run flow setup`

which will open a **simple web interface** get you started.

<small>
   **btw** <br/>
   - on **windows** [cmder](http://bliker.github.io/cmder/) is an excellent alternative to cmd.exe garbage <br/>
   - on **mac/linux** [fish](http://fishshell.com/) is also a really nice shell <br/>
</small>

---

<div class="guide">

**flow guides**<br/>
<br/>
[flow files - project format]({{{rel_path}}}flow.html) <br/>
[pipeline - what flow does for a build]({{{rel_path}}}pipeline.html) <br/>
[design - how it fits together]({{{rel_path}}}design.html) <br/>
[technology - what flow is made of]({{{rel_path}}}flow.html) <br/>



<a name="projects"> &nbsp;</a>
<h2>Projects using flow</h2>

[luxe engine](#) - game engine for haxe <br/>
[snow](#) - a minimal toolkit for building applications and games <br/>

</div> <!-- guide -->


<a name="alternatives"> &nbsp;</a>
<h2>Things like flow</h2>

[aether](https://github.com/openfl/aether) is a long standing build tool (previously lime-tools), used by [OpenFL](https://openfl.org).

---

[feedback](http://snowkit.org)
<br/>
<br/>
<br/>
<br/>
