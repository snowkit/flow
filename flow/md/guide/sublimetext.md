

<a href="{{{rel_path}}}index.html" id="logo"><img src="{{{rel_path}}}images/logo.png" /></a>

<div class="topmenu">
[usage](#usage) . [guide](#guide) ![github]({{{rel_path}}}/images/github.png)  [source](https://github.com/underscorediscovery/flow) . [issues](https://github.com/underscorediscovery/flow/issues/)
</div>

---
<br/>

##Sublime text plugins

These plugins are for [sublime text 3](http://sublimetext.com/3) only.

#### Install plugins
To install the sublime text plugins for code completion, syntax highlighting and building:

- Make sure you have [package control](https://sublime.wbond.net/installation)
- Press `Ctrl/cmd + Shift + P` `Package Control : Add repository`
- Do this twice, add 
  - https://github.com/underscorediscovery/sublime_haxe_completion
  - https://github.com/underscorediscovery/sublime_flow
- Press `Ctrl/cmd + Shift + P` `Package Control : Install Package`
- Do this twice, and choose
  - sublime_flow
  - sublime_haxe_completion
- Restart sublime text

#### Using the plugins

A luxe project is usually a folder with a flow file in it. This is by default called _project.flow_ but can be called anything as long as the extension is _.flow_.

The plugin works by specifying _which_ flow file you want to use as your current active project.

- `File` -> `Open Folder`
- Open a luxe project folder
- Open the flow file (double click on it)
- Right click _inside_ the flow file 
- Choose "set as current flow project" (`ctrl+shift+9`)

![](../images/plugins/0.png)

- Right click _inside_ the flow file, and choose "flow status" (`ctrl+shift+0`)

![](../images/plugins/1.png)

The flow status window has some options:
- selecting the flow file will open the active project file
- selecting the target will show the build dialog window
- the other options are self explained

![](../images/plugins/2.png)

#####Code completion

Once you have an active flow file, the code completion should automatically work when using libraries.

![](../images/plugins/3.png)

######Building

To build, press `ctrl/cmd + B` or select Tools -> Build. This will show the build output, which can be reopened with Tools -> Build Results -> Show Results.

If you have errors, you can double click the error in the console, and it will jump to that line + file in the message. You can press F4 or Shift F4 to cycle errors as well.

![](../images/plugins/4.png)


_Take note that if you have the common Haxe plugin installed already, disable it using Package Control : Disable Package. 
The features are similar, but supports the flow build tool chain and code completion. You can toggle between them any time._

&nbsp;
&nbsp;