key :
  [...] optional
  <...> replace with suggested

For usage on a specific command, use

  `flow usage <command>`

flow specific options

  --version
      alias of `flow version`

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