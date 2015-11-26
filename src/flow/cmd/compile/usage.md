`flow compile [target] --options`

  [target] is implied as your current system if not specified. 
  
  `flow compile` will execute a `build` command but stop after compiling the haxe output.  
  `--options` includes all options from the listed commands.
  
  for full info, `flow usage` and more specifically   
    `flow usage build`   

  examples   

    `flow compile`   
        build, and run the current system as the target

    `flow compile --clean`   
        compile against a clean bin/ path
