key :   
  [...] optional   
  <...> replace with suggested   

For usage on a specific command, use

  `flow usage <command>`

flow specific options

  --version
      alias of `flow version`

  --log <level>
      allows changing the default log level.
      The default log level is 2. example, `flow run --log 3`

      The log levels are as follows
        - `0` - silence :  no logging
        - `1` - error :  only logging, only errors will be logged
        - `2` - default :  critical and useful info
        - `3` - debug :  shows information required to diagnose issues
        - `4` - verbose :  shows internal and more debug info
        - `5` - verboser : shows even more internal and debug info

  --json
      return json values where applicable (for use in IDE's, or other data consumption of flags/values).
      Only used for special commands, and special usage options.


flow special commands

  `flow version`
    return a plain, parseable version number

special usage options

  `flow usage commands [--options]`   
    will list commands only (for use also with --json)

  `flow usage targets [--options]`   
    will list the set of known targets that flow supports.   
      options :   
        --invalid   
            will list the invalid targets for your system.    
            for example, building for mac from windows is not valid.