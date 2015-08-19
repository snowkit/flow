
<a href="{{{rel_path}}}index.html" id="logo"><img src="{{{rel_path}}}images/logo.png" /></a>

<div class="topmenu">
[usage]({{{rel_path}}}usage/index.html) . [guide](#guide) ![github]({{{rel_path}}}/images/github.png)  [source](https://github.com/underscorediscovery/snow) . [issues](https://github.com/underscorediscovery/snow/issues/)
</div>

---

#flow file format

The flow file format is based on JSON, which should be familiar. The difference is that the format is parsed very loosely, allowing clarity and simplicity over inane JSON errors, while still supporting concise error reporting when errors are found in the project.

The following convention is used below :

- `node` a json object i.e `{ }`
- `list` an array i.e `[ ]`
- `key` a key/value pair `name: 'value'`

## Root nodes

Root nodes are in the parent object.   
**There are three reserved nodes**.  

### `flow`
The flow node is your direct route to the flow tool config from a project file, to override and augment flow itself, as needed.

### `project`
This is your project root node, where the majority of your flow is described.

### `if`
This is a conditional `project` node. It mirrors some features of the project node, but wraps the nodes inside of conditions, allowing expressive control over the flow based on defines.

---

### Custom root nodes

Aside from the three nodes above, the entirety of the flow file belongs to you, and the flow files in your dependency tree (more on this later).

What the project uses these nodes for is entirely up to the project, and flow will simply maintain the nodes and pass them to hooks, file templates and so on.

---

<a name="defines"></a>
##Project defines

When defined (shown later), these can be used in haxe code :

```haxe
#if desktop
  desktop_code();
#else
  other_code();
#end
```
and in the conditional project nodes :

```js
if: {
    desktop: {
        files: { desktop_config:'config/desktop.json => config.json' }
    }
}
```


##Built in defines

- _`dependency`_
    - any dependency will define it's `name` as a define
    - i.e `{ dependencies:{nape:'*'} }`
        - `nape` is defined
- `desktop`
    - when building for mac, windows, or linux
- `mobile`
    - when building for android, ios
- _`target`_
    - the current target is automatically defined
    - web, android, ios, mac, linux, android etc.
- `arch-`_arch_
    - on web, `arch-web` is used
    - if on 64 bit, `arch-64`, 32 bit is `arch-32`
    - arch-armv7, arch-i386 and so on
- `ios-sim`
    - only defined if `--sim` is specifed when building
- `debug`
    - defined when `--debug` is enabled


For more info see the [build.defines node](#build.defines)

---

<a name="conditions"></a>
##Conditional project nodes

inside the `if` node in the root, currently following nodes can be used :

- files
- build.files
- build.defines
- build.flags

The conditional nodes rely soley on the defines.

### condition resolution

The conditional system allows you to use defines *defined later*. This means that all defines will be resolved (and all conditions that define new defines) before hand, so you can safely use one define to  include new defines, and then use those defines. This can help simplify complex define expressions. For example :

```js
if : {
    "mac || windows || linux || android || ios" : {
      build: {
        defines : ['is_native']
      }
    },
    "is_native && arch-32" : {
        ...
    }
}
```

Instead of using the entire long expression each time, a single shorthand can be defined, and relied upon to be resolved.


### conditional statements

The conditions node supports the following operands
- `!` not
- `||` or
- `&&` and

This means that you can use expressions to define exclusion/inclusion.
**Take note that due to the syntax, conditional statements with operands must be inside of quotes, single or double.**

```js
if: {
    'desktop && web': {
        ..
    },
    'mac && arch-32 && !static_link': {
        ..
    }
}
```

---

### A flow file

Each of the links below take you to the relevant node on this page.   
** Take note ** that a lot of this is not required as the defaults will fill in the gaps.

<pre><code class='js'>
{

  <a href="#">project</a> : {
    <a href="#project.name">name</a> : 'empty',
    <a href="#project.version">version</a> : '1.0.0',
    <a href="#project.author">author</a> : 'luxeengine',

    <a href="#app">app</a> : {
      <a href="#app.name">name</a> : 'luxe_empty',
      <a href="#app.package">package</a> : 'org.snowkit.empty'
      <a href="#app.output">output</a> : 'bin/'
      <a href="#app.main">main</a> : 'Game',

        <a href="#app.web">web</a> : {
            <a href="#app.web">libs</a> : { ... }
        },

        <a href="#app.mobile">mobile</a> : {
            ..
            <a href="#app.mobile.ios">ios</a> : { ... },
            <a href="#app.mobile.android">android</a> : { ... }
        }
    },

    <a href="#build">build</a> : {
      <a href="#build.flags">flags</a> : ['-v', '--macro keep(example)'],
      <a href="#defines">defines</a> : ['no_sfx', 'no_music'],
      <a href="#build.dependencies">dependencies</a> : {
        example : '*'
      }
    },

    <a href="#files">files</a> : {
      config : { 
          path: 'config.template.json => config.json', 
          <a href="#templating">template</a>:'project' 
      },
      data : 'data/ => assets/'
    }

  },

  <a href="#conditions">if</a> : {
    ...
  }

}
</code>
</pre>

## `project` properties

- `name`
    - string
    - the display name of this project
    - `mobile` this shows on the launch screen/menus
    - **required**

- `version`
    - string
    - the version number
    - use [semantic versioning](http://semver.org/)
    - not related to haxelib versioning
    - **required**

- `author`
    - string
    - the author/owner/maintainer of the project
    - can be any alphanumeric string

---

```js
{
    project: {
        name: 'hello',
        version: '1.0.0-beta.1+2345',
        author: 'snowkit.org'
    }
}
```

---

## `project` nodes

- [app](#app)
- [build](#build)
- [files](#files)

<br/>

<a name="app"></a>
### `app`

The app node controls build configurations specific to the binary/app output of a flow, if any.   

<a name="app.name"></a>
- `name`
    - string
    - the binary file name
    - should not use special characters
    - default `flow_app`

<a name="app.package"></a>
- `package`
    - string
    - the bundle/package/app identifier
    - should not use special characters or spaces
    - *change this*
    - default `org.snowkit.flow_app`

<a name="app.output"></a>
- `output`
    - string
    - the output directory
    - default `'bin'`

<a name="app.main"></a>
- `main`
    - string
    - the main class for haxe to use
    - no hx extension, just the name
    - default `'Main'`

<a name="app.codepaths"></a>
- `codepaths`
    - list of strings `[ ]`
    - local code paths, for haxe to use (`-cp`)
    - default `['src']`

<a name="app.icon"></a>
- `icon`
    - string
    - specifies the location of your icons
    - `path => name` OR `path` (assumed name = 'icon')
    - `path` is relative to your flow file
    - `name` name is used, if not given `icon` is used
    - default : internal default flow icons
    - examples : `flow/src/flow/cmd/icons/default`
    - create a folder with fixed structure :
        - `path/`
            - `icons/`
                - `windows/`
                - `mac/`
                - `linux/`
                - `android/`
                - `ios/`
                - `web/`
    - inside the folders :
        - `web/`
            - `source.png`
            - any valid favicon
        - `windows`
            - `name.ico`
            - must be a valid .ico format
            - many tools [online](http://www.convertico.com/)
        - `mac`
            - `name.iconset/`
                - `icon_512x512@2x.png`
                - ...
                - sizes in [Mac docs](https://developer.apple.com/library/mac/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html)
        - `android`
            - `drawable-hdpi/`
                - `name.png`
            - ...
            - sizes in [Android docs](http://developer.android.com/design/style/iconography.html)
            - just follow the sizes
        - `ios`
            - uses contents of [Images.xcassets](https://developer.apple.com/library/ios/recipes/xcode_help-image_catalog-1.0/Recipe.html)
            - `icon/`
                - `Contents.json`
                - `29.png`
                - ...
            - `launch/`
                - `Contents.json`
                - `640x1136.png`
                - ...
                - splash images

#### `app` nodes

- `mobile`
    - node `{ }`
    - mobile specific build options

- `web`
    - node `{ }`
    - web specific build options

<a name="app.web"></a>
##### `app.web` properties

- `libs`
    - node of keys `{ libname:'path' }`
    - you determine what you name these but
    - can be overridden from project tree per name
    - passed through to templates, for use in html
    - `libs: { jquery:'js/jquery.js', index:'index.js' }`
        - key: given lib name
            - `jquery`
        - value: path string
            - relative to project output
            - or absolute link/http
            - `js/jquery.js`

<a name="app.mobile"></a>
##### `app.mobile` properties

- `fullscreen`
    - bool
    - if device fullscreen is used 
    - default `true`

- `orientation`
    - string
    - device orientation
    - available options
        - `landscape`
        - `landscape left`
        - `landscape both`
        - `portrait`
        - `portrait upside down`
        - `portrait both`
    - default `landscape`

- `ios`
    - node `{ }`
    - ios specific settings

- `android`
    - node `{ }`
    - android specific settings

<a name="app.mobile.ios"></a>
##### `app.mobile.ios` properties

- `devices`
    - string
    - matches the device types in xcode
    - available options
        - `Universal`
        - `iPhone`
        - `iPad`
    - default `Universal`

- `deployment_target`
    - string
    - a version of iOS that is the minimum target
    - default `6.0`

- `cpp`
    - string
    - the xcode formal name for the cpp
    - don't change unless the framework requires it
    - allows framework developers to customize cpp lib
    - default `libc++`

<a name="app.mobile.android"></a>
##### `app.mobile.android` properties


- `build_type`
    - string
    - debug/store build flags
    - available options
        - `debug`
        - `store`
    - default `debug`

- `install_location`
    - string
    - matches [installLocation in android manifest](http://developer.android.com/guide/topics/manifest/manifest-element.html#install)
    - default `preferExternal`

- `sdk_min`
    - string
    - matches the [sdk min in android manifest](http://developer.android.com/guide/topics/manifest/uses-sdk-element.html)
    - default `10`

- `sdk_target`
    - string
    - matches the [sdk target in android manifest](http://developer.android.com/guide/topics/manifest/uses-sdk-element.html)
    - commonly set to the highest available
    - default `19`

- `permissions`
    - list of strings `[ ]`
    - matches the [android manifest permissions](http://developer.android.com/reference/android/Manifest.permission.html)
    - documentation mentions "constant value", 
    - example:
        - `['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.INTERNET']`
    - permissions will combine in project tree
    - default `[]`


---

<a name="build"></a>

### `build`

The build node controls build specific configurations and files.   

<a name="build.dependencies"></a>
- `dependencies`
    - node of keys `{ depend:'version' }`
    - key must be quoted if contains `.` or `-` or others
        - plainalpha
        - "with-quotes"
    - dependencies use haxelib directly
    - dependencies do not require a flow file, just a haxelib entry
    - `haxelib.json` will be read if no flow file is found, including dependencies
    - missing dependencies fail early, clear error messages
    - `cpp` on cpp targets, hxcpp will automatically be added
    - key: dependency name, must match `haxelib list`
        - `mylib`
    - value: dependency version
        - `'*'` currently active haxelib version
        - `'1.0.0'` require haxelib version 1,0,0
    - default `[]`

<a name="build.flags"></a>
- `flags`
    - list of strings `[ ]`
    - haxe flags, passed directly to haxe
    - default `[]`
    - example `['-resource version.txt@version']`

<a name="build.defines"></a>
- `defines`
    - list of strings `[ ]`
    - haxe defines, passed to haxe (`-D define`)
    - default `[]`
    - example `['some_define']`
    - see [defines](#defines) usage

- `files`
    - see [files below](#files)

---

<a name="files"></a>

### `files`

&nbsp;
#### copying

- in project `files` node, copies to output/_target_/
    - i.e `bin/web/`
- in project `build.files` node, copies to output/_target_.build/
    - i.e `bin/web.build/`
- list of nodes `{ }`
- `{ filereference : 'path/source.name => dest/path/dest.name' }`
- **source part**
    - file path must be relative to the flow file
- **destination part**
    - **dest** path **must** end up alongside or below flow file
    - i.e relative paths are ok, but not escaping project
        - i.e for `project.files`: 
            - `../../` is `output/target/../../`
            - same location as flow file, but `../../../` is invalid
    - **dest** will be created, includings folders if needed
    - **dest** will be overwritten (see below for stopping this)
    - **dest** part is optional, 
        - `file.json` is same as `file.json => file.json`
        - `path/file.name` is same as `path/file.name => path/file.name`

#### templating

- templates are run using [handlebars](http://handlebarsjs.com/)
- a file node has a `template` property
- the `template` property is sourced from **root nodes** only
- you can specify a single node or a list `['project', 'custom']`
- any root node (except for `if`) can be requested
    - this includes custom nodes
    - the `project` node is a post-processed project, including special values and preprocessed paths, links and more
- examples :
    - copy config.json over, template it against the project
    - using `{ project:{ name:'the name' } }` in flow file
    - and `{ config : 'config.json', template:'project' }`
    - and config.json contains
    - `{ project_name:` "&#123;&#123; `project.name` &#125;&#125;" `}`
    - becomes
    - `{ project_name: "the name" }`
- custom root
    - using `{ project:{}, custom:{ value:2 } }` in flow file
    - and `{ config : 'config.json', template:'custom' }`
    - and config.json contains
    - `{ custom_value:` &#123;&#123; `custom.value` &#125;&#125; `}`
    - becomes
    - `{ custom_value: 2 }`

- handlebars helpers ([usage docs](http://handlebarsjs.com/#helpers))
    - &#123;&#123; `json value` &#125;&#125;
        - dump json object from scope to debug
        - i.e request `project` and use to inspect
            - &#123;&#123; `json project` &#125;&#125;
    - &#123;&#123; `toString custom.bool` &#125;&#125;
        - because "falsey" values are ignored, it wont template if literal false
        - use toString for all bool/falsey types to ensure correct output
    - &#123;&#123; `upperFirst string` &#125;&#125;
        - if string contains "something" it becomes Something
    - &#123;&#123; `#if value '==' 'other'` &#125;&#125;
        - extensions on the default if block helper
        - supports `'=='`, `'==='`, `'!=='`, `'<'`, `'<='`, `'>'`, `'>='`, `'||'`, `'&&'`
        - operand must be in quotes
        - see [this stackoverflow for logic](http://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional)




---

&nbsp;   
&nbsp;   
&nbsp;   
&nbsp;   
&nbsp;   
&nbsp;   
&nbsp;   
&nbsp;   
