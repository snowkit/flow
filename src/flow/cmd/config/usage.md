`flow config [leaf] [value] [--options]`

Configures the flow defaults on a system wide scale.
When [value] is not given, the leaf value will be printed.
When [value] is set, it will be stored in a user config file.

options

  --list (see examples below)
    when used against a single leaf node, print all values in the leaf
    when used against no leaf node, print the entire config that would be used

notes

  When user custom config values are assigned, they are stored in (home directory)/.flow.config.json

  These are examples, replace You with your username or the location of your home directory as appropriate.

      for windows : C:/Users/You/.flow.config.json
      for mac : /Users/You/.flow.config.json
      for linux : /home/You/.flow.config.json

  Only differences between the default config state will be stored in this file.
  All of the values in the file can be overridden at the flow file level, as well as a lot of them can be overridden by command line as well.

  For example, the web target `launch` command has a port. It starts at the config level, and goes down, in order.

      config level : flow config build.web.port is used (let's say 40404)
          -> port is now 40404
      if *.flow in your project defines flow : { build: web:{ port:50505 }}
          -> port is now 50505
      if `flow run web --port 6000` or `flow launch --port 6000` is used
          -> port is now 6000

  This allows frameworks and projects to define defaults aside from the flow defaults, allows users to customize their system level defaults - and one time or cli based overrides.

  There are quite a few system level values that are required to be set, which `flow setup` will process and handle for you (like the flow config build.android.[sdk, ant] paths).

  Important ; The value you are trying to set must be a value, not a leaf node of the config itself.
    In other words, flow config build { some:json, value:here } is invalid.

examples

    `flow config build --list`
      print the list of options in the build leaf

    `flow config --list`
      print the entire flow config as it would be used

    `flow config build.web.launch_wait 0.5`
      set the time to a half second wait, before launching

    `flow config build.android.sdk`
      print the location of the sdk that flow will use

    `flow config build.android.sdk '/my/path/to/android-sdk'`
      set the system level sdk location that flow will use